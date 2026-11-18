import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditEntity } from '../../common/base-audit.entity';

@Entity('proveedores')
export class Proveedor extends BaseAuditEntity {
  @PrimaryGeneratedColumn({ name: 'id_proveedor' })
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombreEmpresa: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  nit: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  email: string | null;
}
