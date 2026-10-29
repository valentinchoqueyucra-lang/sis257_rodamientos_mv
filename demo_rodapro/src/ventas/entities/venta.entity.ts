import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ventas')
export class Venta {
  @PrimaryGeneratedColumn('identity', { name: 'id_venta' })
  id: number;

  @Column('date')
  fecha: Date;

  @Column('varchar', { length: 50, name: 'numero_documento' })
  numeroDocumento: string;

  @Column('varchar', { length: 100, name: 'tipo_documento' })
  tipoDocuemnto: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'subtotal' })
  subTotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  descuento: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  @Column('varchar', { length: 30 })
  estado: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;
}

