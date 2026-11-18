import {
  Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/base-audit.entity';
import { decimalTransformer } from '../../common/transformers';
import { Categoria } from '../../categorias/entities/categoria.entity';

@Entity('productos')
@Check('ck_productos_stock_no_negativo', '"stock" >= 0')
@Check('ck_productos_precios_no_negativos', '"precio_compra" >= 0 AND "precio_venta" >= 0')
export class Producto extends BaseAuditEntity {
  @PrimaryGeneratedColumn({ name: 'id_producto' })
  id: number;

  @Column({ name: 'id_categoria', type: 'int' })
  idCategoria: number;

  @ManyToOne(() => Categoria, (c) => c.productos, { nullable: false })
  @JoinColumn({ name: 'id_categoria' })
  categoria: Relation<Categoria>;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  marca: string | null;

  @Column({ type: 'varchar', length: 30, default: 'UNIDAD' })
  unidadMedida: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  precioCompra: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  precioVenta: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'int', default: 0 })
  stockMinimo: number;
}
