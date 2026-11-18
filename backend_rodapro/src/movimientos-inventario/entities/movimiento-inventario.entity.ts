import {
  Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/base-audit.entity';
import { ReferenciaTipo, TipoMovimiento } from '../../common/enums';
import { Producto } from '../../productos/entities/producto.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

/** Kardex: cada cambio de stock deja una fila aquí. */
@Entity('movimientos_inventario')
@Index('ix_movimientos_inventario_producto_fecha', ['idProducto', 'fecha'])
@Check('ck_movimientos_inventario_cantidad_positiva', '"cantidad" > 0')
export class MovimientoInventario extends BaseAuditEntity {
  @PrimaryGeneratedColumn({ name: 'id_movimiento' })
  id: number;

  @Column({ name: 'id_producto', type: 'int' })
  idProducto: number;

  @ManyToOne(() => Producto, { nullable: false })
  @JoinColumn({ name: 'id_producto' })
  producto: Relation<Producto>;

  @Column({ name: 'id_usuario', type: 'int' })
  idUsuario: number;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Relation<Usuario>;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  fecha: Date;

  @Column({ type: 'enum', enum: TipoMovimiento })
  tipoMovimiento: TipoMovimiento;

  /** Siempre positiva; el sentido lo da tipoMovimiento. */
  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'enum', enum: ReferenciaTipo })
  referenciaTipo: ReferenciaTipo;

  /** Id de la venta / compra / producto que originó el movimiento. */
  @Column({ type: 'int', nullable: true })
  referenciaId: number | null;

  @Column({ type: 'int' })
  stockAnterior: number;

  @Column({ type: 'int' })
  stockResultante: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacion: string | null;
}
