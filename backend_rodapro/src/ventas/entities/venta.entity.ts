import {
  Check, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation,
} from 'typeorm';
import { BaseAuditEntity } from '../../common/base-audit.entity';
import { decimalTransformer } from '../../common/transformers';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Pago } from '../../pagos/entities/pago.entity';
import { DetalleVenta } from './detalle-venta.entity';

/** estado: true = vigente, false = anulada. */
@Entity('ventas')
@Check('ck_ventas_montos_no_negativos', '"total" >= 0 AND "descuento" >= 0')
export class Venta extends BaseAuditEntity {
  @PrimaryGeneratedColumn({ name: 'id_venta' })
  id: number;

  @Column({ name: 'id_cliente', type: 'int', nullable: true })
  idCliente: number | null;

  @ManyToOne(() => Cliente, { nullable: true })
  @JoinColumn({ name: 'id_cliente' })
  cliente: Relation<Cliente> | null;

  @Column({ name: 'id_usuario', type: 'int' })
  idUsuario: number;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Relation<Usuario>;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  fecha: Date;

  /** Suma de los subtotales de línea (ya con descuento por línea). */
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  subtotal: number;

  /** Descuento global (Bs.) sobre el subtotal. */
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  descuento: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  total: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacion: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivoAnulacion: string | null;

  @OneToMany(() => DetalleVenta, (d) => d.venta)
  detalles: Relation<DetalleVenta>[];

  @OneToMany(() => Pago, (p) => p.venta)
  pagos: Relation<Pago>[];
}
