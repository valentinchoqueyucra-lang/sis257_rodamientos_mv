import {
  Check, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/base-audit.entity';
import { decimalTransformer } from '../../common/transformers';
import { Proveedor } from '../../proveedores/entities/proveedor.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Pago } from '../../pagos/entities/pago.entity';
import { DetalleCompra } from './detalle-compra.entity';

/** estado: true = vigente, false = anulada. */
@Entity('compras')
@Check('ck_compras_montos_no_negativos', '"total" >= 0 AND "descuento" >= 0')
export class Compra extends BaseAuditEntity {
  @PrimaryGeneratedColumn({ name: 'id_compra' })
  id: number;

  @Column({ name: 'id_proveedor', type: 'int' })
  idProveedor: number;

  @ManyToOne(() => Proveedor, { nullable: false })
  @JoinColumn({ name: 'id_proveedor' })
  proveedor: Relation<Proveedor>;

  @Column({ name: 'id_usuario', type: 'int' })
  idUsuario: number;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Relation<Usuario>;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  fecha: Date;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  subtotal: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  descuento: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  total: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacion: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivoAnulacion: string | null;

  @OneToMany(() => DetalleCompra, (d) => d.compra)
  detalles: Relation<DetalleCompra>[];

  @OneToMany(() => Pago, (p) => p.compra)
  pagos: Relation<Pago>[];
}
