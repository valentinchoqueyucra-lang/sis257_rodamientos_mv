import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('identity', { name: 'id_usuario' })
  id: number;

  @Column('varchar', { length: 150, name: 'nombre_completo' })
  nombreCompleto: string;

  @Column('varchar', { length: 50, name: 'nombre_usuario' })
  nombreUsuario: string;

  @Column('varchar', { length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column('varchar', { length: 30 })
  rol: string;

  @Column('boolean', { default: true })
  estado: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;
}
