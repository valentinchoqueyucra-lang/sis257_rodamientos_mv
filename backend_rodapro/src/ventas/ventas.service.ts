import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Cliente } from '../clientes/entities/cliente.entity';
import { ReferenciaTipo, TipoMovimiento } from '../common/enums';
import { round2 } from '../common/transformers';
import { MovimientoInventario } from '../movimientos-inventario/entities/movimiento-inventario.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Producto } from '../productos/entities/producto.entity';
import { CreateVentaDto } from './dto/create-venta.dto';
import { DetalleVenta } from './entities/detalle-venta.entity';
import { Venta } from './entities/venta.entity';

export interface FiltroVentas {
  desde?: string;
  hasta?: string;
  idCliente?: number;
  estado?: boolean;
}

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta) private readonly repo: Repository<Venta>,
    private readonly dataSource: DataSource,
  ) {}

  listar(f: FiltroVentas) {
    const qb = this.repo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.cliente', 'c')
      .leftJoinAndSelect('v.usuario', 'u')
      .leftJoinAndSelect('v.pagos', 'pg')
      .orderBy('v.fecha', 'DESC')
      .take(500);
    if (f.idCliente) qb.andWhere('v.idCliente = :idCliente', { idCliente: f.idCliente });
    if (f.estado !== undefined) qb.andWhere('v.estado = :estado', { estado: f.estado });
    if (f.desde) qb.andWhere(`DATE(v.fecha AT TIME ZONE 'America/La_Paz') >= :desde`, { desde: f.desde });
    if (f.hasta) qb.andWhere(`DATE(v.fecha AT TIME ZONE 'America/La_Paz') <= :hasta`, { hasta: f.hasta });
    return qb.getMany();
  }

  async findOne(id: number) {
    const venta = await this.repo.findOne({
      where: { id },
      relations: ['cliente', 'usuario', 'detalles', 'detalles.producto', 'pagos'],
      order: { detalles: { id: 'ASC' } },
    });
    if (!venta) throw new NotFoundException(`Venta #${id} no encontrada`);
    return venta;
  }

  /**
   * Registra la venta de forma atómica:
   * bloquea productos -> valida stock -> calcula totales -> guarda venta y detalle
   * -> descuenta stock -> registra MovimientoInventario (SALIDA) -> registra Pago.
   * Cualquier error revierte TODO (rollback).
   */
  async crear(dto: CreateVentaDto, userId: number) {
    const ids = dto.detalles.map((d) => d.idProducto);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Hay productos repetidos en el detalle; unifique las cantidades');
    }

    const ventaId = await this.dataSource.transaction(async (m) => {
      if (dto.idCliente) {
        const cliente = await m.findOneBy(Cliente, { id: dto.idCliente });
        if (!cliente || !cliente.estado) {
          throw new BadRequestException('El cliente no existe o está inactivo');
        }
      }

      // Bloqueo pesimista ordenado por id: evita sobreventa y deadlocks entre ventas simultáneas.
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
        if (p.stock < d.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente de "${p.nombre}": disponible ${p.stock}, solicitado ${d.cantidad}`,
          );
        }
        const bruto = round2(p.precioVenta * d.cantidad);
        const descuento = round2(d.descuento ?? 0);
        if (descuento > bruto) {
          throw new BadRequestException(
            `El descuento de "${p.nombre}" (Bs ${descuento}) supera el importe de la línea (Bs ${bruto})`,
          );
        }
        const lineaSubtotal = round2(bruto - descuento);
        subtotal = round2(subtotal + lineaSubtotal);
        return { producto: p, cantidad: d.cantidad, precioUnitario: p.precioVenta, descuento, subtotal: lineaSubtotal };
      });

      const descuentoGlobal = round2(dto.descuento ?? 0);
      if (descuentoGlobal > subtotal) {
        throw new BadRequestException(
          `El descuento global (Bs ${descuentoGlobal}) supera el subtotal (Bs ${subtotal})`,
        );
      }
      const total = round2(subtotal - descuentoGlobal);

      const venta = await m.save(
        m.create(Venta, {
          idCliente: dto.idCliente ?? null,
          idUsuario: userId,
          subtotal,
          descuento: descuentoGlobal,
          total,
          observacion: dto.observacion ?? null,
        }),
      );

      await m.save(
        lineas.map((l) =>
          m.create(DetalleVenta, {
            idVenta: venta.id,
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
        l.producto.stock = anterior - l.cantidad;
        await m.save(l.producto);
        movimientos.push(
          m.create(MovimientoInventario, {
            idProducto: l.producto.id,
            idUsuario: userId,
            tipoMovimiento: TipoMovimiento.SALIDA,
            cantidad: l.cantidad,
            referenciaTipo: ReferenciaTipo.VENTA,
            referenciaId: venta.id,
            stockAnterior: anterior,
            stockResultante: l.producto.stock,
            observacion: `Venta #${venta.id}`,
          }),
        );
      }
      await m.save(movimientos);

      await m.save(
        m.create(Pago, {
          idVenta: venta.id,
          idUsuario: userId,
          monto: total,
          metodoPago: dto.metodoPago,
          referencia: dto.referencia ?? null,
        }),
      );

      return venta.id;
    });

    return this.findOne(ventaId);
  }

  /** Anula la venta: devuelve el stock, registra movimiento inverso y anula sus pagos. */
  async anular(id: number, motivo: string, userId: number) {
    await this.dataSource.transaction(async (m) => {
      const venta = await m.findOne(Venta, { where: { id }, lock: { mode: 'pessimistic_write' } });
      if (!venta) throw new NotFoundException(`Venta #${id} no encontrada`);
      if (!venta.estado) throw new BadRequestException('La venta ya está anulada');

      const detalles = await m.find(DetalleVenta, { where: { idVenta: id }, order: { idProducto: 'ASC' } });
      const productos = await m.find(Producto, {
        where: { id: In(detalles.map((d) => d.idProducto)) },
        order: { id: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });
      const porId = new Map(productos.map((p) => [p.id, p]));

      const movimientos: MovimientoInventario[] = [];
      for (const d of detalles) {
        const p = porId.get(d.idProducto)!;
        const anterior = p.stock;
        p.stock = anterior + d.cantidad;
        await m.save(p);
        movimientos.push(
          m.create(MovimientoInventario, {
            idProducto: p.id,
            idUsuario: userId,
            tipoMovimiento: TipoMovimiento.ENTRADA,
            cantidad: d.cantidad,
            referenciaTipo: ReferenciaTipo.ANULACION_VENTA,
            referenciaId: venta.id,
            stockAnterior: anterior,
            stockResultante: p.stock,
            observacion: `Anulación de venta #${venta.id}: ${motivo}`.slice(0, 255),
          }),
        );
      }
      await m.save(movimientos);

      const pagos = await m.find(Pago, { where: { idVenta: id } });
      pagos.forEach((pg) => (pg.estado = false));
      await m.save(pagos);

      venta.estado = false;
      venta.motivoAnulacion = motivo;
      await m.save(venta);
    });
    return this.findOne(id);
  }
}
