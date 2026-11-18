import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

/** Traduce errores de PostgreSQL a respuestas HTTP comprensibles. */
@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError & { code?: string; detail?: string }, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const code = exception.code ?? (exception as any).driverError?.code;
    const detail: string = (exception as any).driverError?.detail ?? exception.detail ?? '';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno de base de datos';

    switch (code) {
      case '23505': // unique_violation
        status = HttpStatus.CONFLICT;
        message = `Ya existe un registro con ese valor único. ${detail}`.trim();
        break;
      case '23503': // foreign_key_violation
        status = HttpStatus.CONFLICT;
        message =
          'La operación referencia (o es referenciada por) un registro que no existe o está en uso.';
        break;
      case '23502': // not_null_violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Falta un dato obligatorio.';
        break;
      case '23514': // check_violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Un valor no cumple las restricciones de la base de datos (stock o montos negativos).';
        break;
    }

    res.status(status).json({ statusCode: status, message, error: 'Database Error' });
  }
}