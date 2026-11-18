import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetodoPago } from '../common/enums';
import { Pago } from './entities/pago.entity';

@Injectable()
export class PagosService {
  constructor(@InjectRepository(Pago) private readonly repo: Repository<Pago>) {}

  /** tipo: 'VENTA' (cobros) | 'COMPRA' (pagos a proveedores). Máx. 500 filas. */
  listar(f: { tipo?: 'VENTA' | 'COMPRA'; metodoPago?: MetodoPago; desde?: string; hasta?: string }) {
    const qb = this.repo
      .createQueryBuilder('pg')
      .leftJoinAndSelect('pg.usuario', 'u')
      .orderBy('pg.fecha', 'DESC')
      .take(500);
    if (f.tipo === 'VENTA') qb.andWhere('pg.idVenta IS NOT NULL');
    if (f.tipo === 'COMPRA') qb.andWhere('pg.idCompra IS NOT NULL');
    if (f.metodoPago) qb.andWhere('pg.metodoPago = :mp', { mp: f.metodoPago });
    if (f.desde) qb.andWhere(`DATE(pg.fecha AT TIME ZONE 'America/La_Paz') >= :desde`, { desde: f.desde });
    if (f.hasta) qb.andWhere(`DATE(pg.fecha AT TIME ZONE 'America/La_Paz') <= :hasta`, { hasta: f.hasta });
    return qb.getMany();
  }
}
