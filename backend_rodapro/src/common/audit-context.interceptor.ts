import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { runWithContext } from './request-context';

/** Guarda el id del usuario autenticado para que el AuditSubscriber lo use. */
@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const userId: number | undefined = context.switchToHttp().getRequest().user
      ?.id;
    return new Observable((subscriber) =>
      runWithContext({ userId }, () => next.handle().subscribe(subscriber)),
    );
  }
}