import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCategoriaDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio.' })
  @IsString({ message: 'El nombre de la categoría debe ser de tipo cadena de texto.' })
  @MaxLength(100, { message: 'EL nombre no puede tener mas de 100 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly nombre: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'La descripción es obligatorio.' })
  @IsString({ message: 'La descripción debe ser de tipo cadena de texto.' })
  @MaxLength(255, { message: 'La descripción no puede tener masa de 255 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly descripcion: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsBoolean({ message: 'El estado debe ser un valor booleano (true o false).' })
  readonly estado: boolean;
}
