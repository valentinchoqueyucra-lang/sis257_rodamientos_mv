import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { TipoDocumento } from '../../common/enums';

const limpiar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateClienteDto {
  @IsString() @IsNotEmpty() @MaxLength(100) @Transform(limpiar)
  nombre: string;

  @IsOptional() @IsString() @MaxLength(100) @Transform(limpiar)
  apellido?: string;

  /** Tipo de documento. Si no se envía se asume CI. */
  @IsOptional() @IsEnum(TipoDocumento)
  tipoDocumento?: TipoDocumento;

  /** Número de documento (CI, NIT, carnet de extranjero o pasaporte). Único. */
  @IsString() @IsNotEmpty() @MaxLength(30)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z0-9][A-Z0-9-]{2,29}$/, { message: 'El documento solo admite letras, números y guion (mínimo 3 caracteres)' })
  ciNit: string;

  @IsOptional() @IsString() @MaxLength(30) @Transform(limpiar)
  telefono?: string;

  @IsOptional() @IsString() @MaxLength(255) @Transform(limpiar)
  direccion?: string;
}
