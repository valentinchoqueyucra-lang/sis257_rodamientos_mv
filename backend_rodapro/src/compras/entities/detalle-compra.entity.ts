import {
  Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/base-audit.entity';
import { decimalTransformer } from '../../common/transformers';
import { Producto } from '../../productos/entities/producto.entity';
import { Compra } from './compra.entity';

@Entity('detalles_compra')
@Check('ck_detalles_compra_cantidad_positiva', '"cantidad" > 0')
export class DetalleCompra extends BaseAuditEntity {
  @PrimaryGeneratedColumn({ name: 'id_detalle_compra' })
  id: number;

  @Column({ name: 'id_compra', type: 'int' })
  idCompra: number;

  @ManyToOne(() => Compra, (c) => c.detalles, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_compra' })
  compra: Relation<Compra>;

  @Column({ name: 'id_producto', type: 'int' })
  idProducto: number;

  @ManyToOne(() => Producto, { nullable: false })
  @JoinColumn({ name: 'id_producto' })
  producto: Relation<Producto>;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer })
  precioUnitario: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  descuento: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer })
  subtotal: number;
}
