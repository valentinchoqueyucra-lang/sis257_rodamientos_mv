import {
  Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/base-audit.entity';
import { decimalTransformer } from '../../common/transformers';
import { Producto } from '../../productos/entities/producto.entity';
import { Venta } from './venta.entity';

@Entity('detalles_venta')
@Check('ck_detalles_venta_cantidad_positiva', '"cantidad" > 0')
export class DetalleVenta extends BaseAuditEntity {
  @PrimaryGeneratedColumn({ name: 'id_detalle_venta' })
  id: number;

  @Column({ name: 'id_venta', type: 'int' })
  idVenta: number;

  @ManyToOne(() => Venta, (v) => v.detalles, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_venta' })
  venta: Relation<Venta>;

  @Column({ name: 'id_producto', type: 'int' })
  idProducto: number;

  @ManyToOne(() => Producto, { nullable: false })
  @JoinColumn({ name: 'id_producto' })
  producto: Relation<Producto>;

  @Column({ type: 'int' })
  cantidad: number;

  /** Precio de venta del producto al momento de la venta. */
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer })
  precioUnitario: number;

  /** Descuento (Bs.) aplicado a la línea completa. */
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  descuento: number;

  /** cantidad * precioUnitario - descuento. */
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer })
  subtotal: number;
}
