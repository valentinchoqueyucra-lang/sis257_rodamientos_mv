import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditEntity } from '../../common/base-audit.entity';
import { TipoDocumento } from '../../common/enums';

@Entity('clientes')
export class Cliente extends BaseAuditEntity {
  @PrimaryGeneratedColumn({ name: 'id_cliente' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  apellido: string | null;

  /** Tipo del documento guardado en `ciNit` (CI, NIT, carnet de extranjero o pasaporte). */
  @Column({ type: 'enum', enum: TipoDocumento, enumName: 'clientes_tipo_documento_enum', default: TipoDocumento.CI })
  tipoDocumento: TipoDocumento;

  /** Número del documento (único en todos los tipos). */
  @Column({ type: 'varchar', length: 30, unique: true })
  ciNit: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string | null;
}
