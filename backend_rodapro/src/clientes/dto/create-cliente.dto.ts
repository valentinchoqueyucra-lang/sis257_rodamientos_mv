import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateClienteDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El nombre  es obligatorio.' })
  @IsString({ message: 'El nombre debe ser de tipo cadena de texto.' })
  @MaxLength(100, { message: 'El nombre no puede tener mas de 100 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly nombre: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  @IsString({ message: 'El apellido debe ser de tipo cadena de texto.' })
  @MaxLength(100, { message: 'El apellido no puede tener masa de 100 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly apellido: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'La ci NIT es obligatorio.' })
  @IsString({ message: 'La ci NIT  debe ser de tipo cadena de texto.' })
  @MaxLength(30, { message: 'La ci NIT no puede tener mas de 30 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly ciNit: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El telefono es obligatorio.' })
  @IsString({ message: 'El telefono debe ser de tipo cadena de texto.' })
  @MaxLength(30, { message: 'El telefono no puede tener mas de 30 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly telefono: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'La direccion es obligatorio.' })
  @IsString({ message: 'La direccion debe ser de tipo cadena de texto.' })
  @MaxLength(100, { message: 'La direccion no puede tener mas de 100 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly direccion: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsString({ message: 'La estado debe ser de tipo cadena de texto.' })
  @MaxLength(30, { message: 'La estado no puede tener mas de 30 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly estado: string;
}