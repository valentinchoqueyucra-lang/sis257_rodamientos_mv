import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Columnas comunes a todas las tablas:
 *  - estado: true = activo / vigente, false = inactivo / anulado (borrado lógico).
 *  - auditoría: quién y cuándo creó / modificó el registro.
 * `usuarioCreacion` y `usuarioActualizacion` los completa automáticamente
 * el AuditSubscriber con el usuario autenticado en la petición.
 */
export abstract class BaseAuditEntity {
  abstract id: number;

  @Column({ type: 'boolean', default: true })
  estado: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  fechaCreacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fechaActualizacion: Date;

  @Column({ type: 'int', nullable: true })
  usuarioCreacion: number | null;

  @Column({ type: 'int', nullable: true })
  usuarioActualizacion: number | null;
}
