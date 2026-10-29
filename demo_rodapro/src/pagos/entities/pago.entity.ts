import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn('identity', { name: 'id_pago' })
  id: number;

  @Column('date')
  fecha: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto: number;

  @Column('varchar', { length: 50, name: 'metodo_pago' })
  metodoPago: string;

  @Column('varchar', { length: 100 })
  referencia: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;
}
