import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const limpiar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateProveedorDto {
  @IsString() @IsNotEmpty() @MaxLength(150) @Transform(limpiar)
  nombreEmpresa: string;

  /** NIT (único). */
  @IsString() @IsNotEmpty() @MaxLength(30)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z0-9][A-Z0-9-]{2,29}$/, { message: 'El NIT solo admite letras, números y guion (mínimo 3 caracteres)' })
  nit: string;

  @IsOptional() @IsString() @MaxLength(30) @Transform(limpiar)
  telefono?: string;

  @IsOptional() @IsString() @MaxLength(255) @Transform(limpiar)
  direccion?: string;

  @IsOptional() @IsEmail() @MaxLength(120) @Transform(limpiar)
  email?: string;
}
