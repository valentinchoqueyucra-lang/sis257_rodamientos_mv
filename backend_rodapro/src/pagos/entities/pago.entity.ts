import {
  Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/base-audit.entity';
import { MetodoPago } from '../../common/enums';
import { decimalTransformer } from '../../common/transformers';
import { Compra } from '../../compras/entities/compra.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Venta } from '../../ventas/entities/venta.entity';

/** Un pago pertenece a una venta (cobro) o a una compra (pago a proveedor), nunca a ambas. */
@Entity('pagos')
@Check(
  'ck_pagos_venta_o_compra',
  '("id_venta" IS NOT NULL AND "id_compra" IS NULL) OR ("id_venta" IS NULL AND "id_compra" IS NOT NULL)',
)
export class Pago extends BaseAuditEntity {
  @PrimaryGeneratedColumn({ name: 'id_pago' })
  id: number;

  @Column({ name: 'id_venta', type: 'int', nullable: true })
  idVenta: number | null;

  @ManyToOne(() => Venta, (v) => v.pagos, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_venta' })
  venta: Relation<Venta> | null;

  @Column({ name: 'id_compra', type: 'int', nullable: true })
  idCompra: number | null;

  @ManyToOne(() => Compra, (c) => c.pagos, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_compra' })
  compra: Relation<Compra> | null;

  @Column({ name: 'id_usuario', type: 'int' })
  idUsuario: number;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Relation<Usuario>;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  fecha: Date;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer })
  monto: number;

  @Column({ type: 'enum', enum: MetodoPago, default: MetodoPago.EFECTIVO })
  metodoPago: MetodoPago;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia: string | null;
}
