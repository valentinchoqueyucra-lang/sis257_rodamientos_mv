import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ReferenciaTipo, TipoMovimiento } from '../common/enums';
import { round2 } from '../common/transformers';
import { MovimientoInventario } from '../movimientos-inventario/entities/movimiento-inventario.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Producto } from '../productos/entities/producto.entity';
import { Proveedor } from '../proveedores/entities/proveedor.entity';
import { CreateCompraDto } from './dto/create-compra.dto';
import { Compra } from './entities/compra.entity';
import { DetalleCompra } from './entities/detalle-compra.entity';

@Injectable()
export class ComprasService {
  constructor(
    @InjectRepository(Compra) private readonly repo: Repository<Compra>,
    private readonly dataSource: DataSource,
  ) {}

  listar(f: { desde?: string; hasta?: string; idProveedor?: number; estado?: boolean }) {
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.proveedor', 'pr')
      .leftJoinAndSelect('c.usuario', 'u')
      .leftJoinAndSelect('c.pagos', 'pg')
      .orderBy('c.fecha', 'DESC')
      .take(500);
    if (f.idProveedor) qb.andWhere('c.idProveedor = :idProveedor', { idProveedor: f.idProveedor });
    if (f.estado !== undefined) qb.andWhere('c.estado = :estado', { estado: f.estado });
    if (f.desde) qb.andWhere(`DATE(c.fecha AT TIME ZONE 'America/La_Paz') >= :desde`, { desde: f.desde });
    if (f.hasta) qb.andWhere(`DATE(c.fecha AT TIME ZONE 'America/La_Paz') <= :hasta`, { hasta: f.hasta });
    return qb.getMany();
  }

  async findOne(id: number) {
    const compra = await this.repo.findOne({
      where: { id },
      relations: ['proveedor', 'usuario', 'detalles', 'detalles.producto', 'pagos'],
      order: { detalles: { id: 'ASC' } },
    });
    if (!compra) throw new NotFoundException(`Compra #${id} no encontrada`);
    return compra;
  }

  /**
   * Registra la compra de forma atómica: guarda compra y detalle, suma stock,
   * actualiza el precio de compra del producto, registra el movimiento (ENTRADA) y el pago.
   */
  async crear(dto: CreateCompraDto, userId: number) {
    const ids = dto.detalles.map((d) => d.idProducto);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Hay productos repetidos en el detalle; unifique las cantidades');
    }

    const compraId = await this.dataSource.transaction(async (m) => {
      const proveedor = await m.findOneBy(Proveedor, { id: dto.idProveedor });
      if (!proveedor || !proveedor.estado) {
        throw new BadRequestException('El proveedor no existe o está inactivo');
      }

      const productos = await m.find(Producto, {
        where: { id: In(ids) },
        order: { id: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });
      const porId = new Map(productos.map((p) => [p.id, p]));

      let subtotal = 0;
      const lineas = dto.detalles.map((d) => {
        const p = porId.get(d.idProducto);
        if (!p) throw new BadRequestException(`El producto #${d.idProducto} no existe`);
        if (!p.estado) throw new BadRequestException(`El producto "${p.nombre}" está inactivo`);
        const bruto = round2(d.precioUnitario * d.cantidad);
        const descuento = round2(d.descuento ?? 0);
        if (descuento > bruto) {
          throw new BadRequestException(`El descuento de "${p.nombre}" supera el importe de la línea`);
        }
        const lineaSubtotal = round2(bruto - descuento);
        subtotal = round2(subtotal + lineaSubtotal);
        return { producto: p, cantidad: d.cantidad, precioUnitario: d.precioUnitario, descuento, subtotal: lineaSubtotal };
      });

      const descuentoGlobal = round2(dto.descuento ?? 0);
      if (descuentoGlobal > subtotal) {
        throw new BadRequestException('El descuento global supera el subtotal');
      }
      const total = round2(subtotal - descuentoGlobal);

      const compra = await m.save(
        m.create(Compra, {
          idProveedor: dto.idProveedor,
          idUsuario: userId,
          subtotal,
          descuento: descuentoGlobal,
          total,
          observacion: dto.observacion ?? null,
        }),
      );

      await m.save(
        lineas.map((l) =>
          m.create(DetalleCompra, {
            idCompra: compra.id,
            idProducto: l.producto.id,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            descuento: l.descuento,
            subtotal: l.subtotal,
          }),
        ),
      );

      const movimientos: MovimientoInventario[] = [];
      for (const l of lineas) {
        const anterior = l.producto.stock;
        l.producto.stock = anterior + l.cantidad;
        l.producto.precioCompra = l.precioUnitario; // último costo de compra
        await m.save(l.producto);
        movimientos.push(
          m.create(MovimientoInventario, {
            idProducto: l.producto.id,
            idUsuario: userId,
            tipoMovimiento: TipoMovimiento.ENTRADA,
            cantidad: l.cantidad,
            referenciaTipo: ReferenciaTipo.COMPRA,
            referenciaId: compra.id,
            stockAnterior: anterior,
            stockResultante: l.producto.stock,
            observacion: `Compra #${compra.id}`,
          }),
        );
      }
      await m.save(movimientos);

      await m.save(
        m.create(Pago, {
          idCompra: compra.id,
          idUsuario: userId,
          monto: total,
          metodoPago: dto.metodoPago,
          referencia: dto.referencia ?? null,
        }),
      );

      return compra.id;
    });

    return this.findOne(compraId);
  }

  /** Anula la compra: descuenta el stock ingresado (si aún alcanza) y registra el movimiento inverso. */
  async anular(id: number, motivo: string, userId: number) {
    await this.dataSource.transaction(async (m) => {
      const compra = await m.findOne(Compra, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!compra) throw new NotFoundException(`Compra #${id} no encontrada`);
      if (!compra.estado) throw new BadRequestException('La compra ya está anulada');

      const detalles = await m.find(DetalleCompra, { where: { idCompra: id } });
      const productos = await m.find(Producto, {
        where: { id: In(detalles.map((d) => d.idProducto)) },
        order: { id: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });
      const porId = new Map(productos.map((p) => [p.id, p]));

      const movimientos: MovimientoInventario[] = [];
      for (const d of detalles) {
        const p = porId.get(d.idProducto)!;
        if (p.stock < d.cantidad) {
          throw new BadRequestException(
            `No se puede anular: "${p.nombre}" ya tiene stock ${p.stock} y la compra ingresó ${d.cantidad} (parte ya se vendió)`,
          );
        }
        const anterior = p.stock;
        p.stock = anterior - d.cantidad;
        await m.save(p);
        movimientos.push(
          m.create(MovimientoInventario, {
            idProducto: p.id,
            idUsuario: userId,
            tipoMovimiento: TipoMovimiento.SALIDA,
            cantidad: d.cantidad,
            referenciaTipo: ReferenciaTipo.ANULACION_COMPRA,
            referenciaId: compra.id,
            stockAnterior: anterior,
            stockResultante: p.stock,
            observacion: `Anulación de compra #${compra.id}: ${motivo}`.slice(0, 255),
          }),
        );
      }
      await m.save(movimientos);

      const pagos = await m.find(Pago, { where: { idCompra: id } });
      pagos.forEach((pg) => (pg.estado = false));
      await m.save(pagos);

      compra.estado = false;
      compra.motivoAnulacion = motivo;
      await m.save(compra);
    });
    return this.findOne(id);
  }
}
