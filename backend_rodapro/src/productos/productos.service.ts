import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { ReferenciaTipo, TipoMovimiento } from '../common/enums';
import { MovimientoInventario } from '../movimientos-inventario/entities/movimiento-inventario.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { Producto } from './entities/producto.entity';

@Injectable()
export class ProductosService extends CrudService<Producto> {
  constructor(
    @InjectRepository(Producto) repo: Repository<Producto>,
    private readonly dataSource: DataSource,
  ) {
    super(repo, 'Producto', { categoria: true });
  }

  /** Búsqueda por código, nombre o marca; opcionalmente solo activos. */
  async buscar(soloActivos = false, q?: string, idCategoria?: number) {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'c')
      .orderBy('p.nombre', 'ASC');
    if (soloActivos) qb.andWhere('p.estado = true');
    if (idCategoria) qb.andWhere('p.idCategoria = :idCategoria', { idCategoria });
    if (q?.trim()) {
      qb.andWhere('(p.codigo ILIKE :q OR p.nombre ILIKE :q OR p.marca ILIKE :q)', {
        q: `%${q.trim()}%`,
      });
    }
    return qb.getMany();
  }

  stockBajo() {
    return this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'c')
      .where('p.estado = true')
      .andWhere('p.stock <= p.stockMinimo')
      .orderBy('p.stock', 'ASC')
      .getMany();
  }

  /** Crea el producto y, si trae stock inicial, deja su movimiento en el kardex. */
  async create(dto: CreateProductoDto, userId?: number): Promise<Producto> {
    const id = await this.dataSource.transaction(async (m) => {
      const stock = dto.stock ?? 0;
      const producto = await m.save(m.create(Producto, { ...dto, stock }));
      if (stock > 0 && userId) {
        await m.save(
          m.create(MovimientoInventario, {
            idProducto: producto.id,
            idUsuario: userId,
            tipoMovimiento: TipoMovimiento.ENTRADA,
            cantidad: stock,
            referenciaTipo: ReferenciaTipo.STOCK_INICIAL,
            referenciaId: producto.id,
            stockAnterior: 0,
            stockResultante: stock,
            observacion: 'Stock inicial',
          }),
        );
      }
      return producto.id;
    });
    return this.findOne(id);
  }
}
