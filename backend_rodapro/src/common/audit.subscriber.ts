import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { BaseAuditEntity } from './base-audit.entity';
import { currentUserId } from './request-context';

/** Completa usuarioCreacion / usuarioActualizacion en cada INSERT y UPDATE. */
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<any>): void {
    const userId = currentUserId();
    if (userId && event.entity instanceof BaseAuditEntity) {
      event.entity.usuarioCreacion ??= userId;
      event.entity.usuarioActualizacion = userId;
    }
  }

  beforeUpdate(event: UpdateEvent<any>): void {
    const userId = currentUserId();
    if (userId && event.entity instanceof BaseAuditEntity) {
      event.entity.usuarioActualizacion = userId;
    }
  }
}