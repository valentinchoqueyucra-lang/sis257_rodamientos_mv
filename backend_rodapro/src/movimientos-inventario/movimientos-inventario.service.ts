import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ReferenciaTipo, TipoMovimiento } from '../common/enums';
import { Producto } from '../productos/entities/producto.entity';
import { AjusteInventarioDto } from './dto/ajuste-inventario.dto';
import { MovimientoInventario } from './entities/movimiento-inventario.entity';

export interface FiltroMovimientos {
  idProducto?: number;
  tipoMovimiento?: TipoMovimiento;
  referenciaTipo?: ReferenciaTipo;
  desde?: string;
  hasta?: string;
}

@Injectable()
export class MovimientosInventarioService {
  constructor(
    @InjectRepository(MovimientoInventario) private readonly repo: Repository<MovimientoInventario>,
    private readonly dataSource: DataSource,
  ) {}

  /** Kardex: más recientes primero (máx. 500). */
  movimientos(f: FiltroMovimientos) {
    const qb = this.repo
      .createQueryBuilder('mi')
      .leftJoinAndSelect('mi.producto', 'p')
      .leftJoinAndSelect('mi.usuario', 'u')
      .orderBy('mi.fecha', 'DESC')
      .addOrderBy('mi.id', 'DESC')
      .take(500);
    if (f.idProducto) qb.andWhere('mi.idProducto = :idProducto', { idProducto: f.idProducto });
    if (f.tipoMovimiento) qb.andWhere('mi.tipoMovimiento = :t', { t: f.tipoMovimiento });
    if (f.referenciaTipo) qb.andWhere('mi.referenciaTipo = :r', { r: f.referenciaTipo });
    if (f.desde) {
      qb.andWhere(`DATE(mi.fecha AT TIME ZONE 'America/La_Paz') >= :desde`, { desde: f.desde });
    }
    if (f.hasta) {
      qb.andWhere(`DATE(mi.fecha AT TIME ZONE 'America/La_Paz') <= :hasta`, { hasta: f.hasta });
    }
    return qb.getMany();
  }

  /** Ajuste manual de stock con su movimiento, en una transacción. */
  async ajustar(dto: AjusteInventarioDto, userId: number) {
    const id = await this.dataSource.transaction(async (m) => {
      const producto = await m.findOne(Producto, {
        where: { id: dto.idProducto },
        lock: { mode: 'pessimistic_write' },
      });
      if (!producto) throw new NotFoundException(`Producto #${dto.idProducto} no encontrado`);
      if (!producto.estado) throw new BadRequestException('El producto está inactivo');

      const anterior = producto.stock;
      const resultante =
        dto.tipoMovimiento === TipoMovimiento.ENTRADA ? anterior + dto.cantidad : anterior - dto.cantidad;
      if (resultante < 0) {
        throw new BadRequestException(
          `El ajuste dejaría stock negativo (stock actual ${anterior}, salida ${dto.cantidad})`,
        );
      }
      producto.stock = resultante;
      await m.save(producto);

      const mov = await m.save(
        m.create(MovimientoInventario, {
          idProducto: producto.id,
          idUsuario: userId,
          tipoMovimiento: dto.tipoMovimiento,
          cantidad: dto.cantidad,
          referenciaTipo: ReferenciaTipo.AJUSTE,
          referenciaId: producto.id,
          stockAnterior: anterior,
          stockResultante: resultante,
          observacion: dto.observacion,
        }),
      );
      return mov.id;
    });
    return this.repo.findOne({ where: { id }, relations: ['producto', 'usuario'] });
  }
}
