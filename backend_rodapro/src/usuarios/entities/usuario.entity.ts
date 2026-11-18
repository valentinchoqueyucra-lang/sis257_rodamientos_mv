import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditEntity } from '../../common/base-audit.entity';
import { Rol } from '../../common/enums';

@Entity('usuarios')
export class Usuario extends BaseAuditEntity {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id: number;

  @Column({ type: 'varchar', length: 120 })
  nombreCompleto: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  nombreUsuario: string;

  /** Hash bcrypt. Nunca se devuelve en las consultas (select: false). */
  @Column({ type: 'varchar', length: 100, select: false })
  password: string;

  @Column({ type: 'enum', enum: Rol, default: Rol.VENDEDOR })
  rol: Rol;
}