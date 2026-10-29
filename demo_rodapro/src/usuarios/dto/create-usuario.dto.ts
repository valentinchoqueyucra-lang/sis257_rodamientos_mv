import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El nombre completo es obligatorio.' })
  @IsString({ message: 'El nombre completo debe ser de tipo cadena de texto.' })
  @MaxLength(150, { message: 'El nombre completo no puede tener mas de 150 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly nombreCompleto: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio.' })
  @IsString({ message: 'El nombre de usuario  debe ser de tipo cadena de texto.' })
  @MaxLength(50, { message: 'El nombre de usuario no puede tener masa de 50 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly nombreUsuario: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio.' })
  @IsString({ message: 'El nombre de la categoría debe ser de tipo cadena de texto.' })
  @MaxLength(255, { message: 'EL nombre no puede tener mas de 255 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly passwordHash: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El rol es obligatorio.' })
  @IsString({ message: 'El rol debe ser de tipo cadena de texto.' })
  @MaxLength(30, { message: 'EL rol no puede tener mas de 30 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly rol: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsBoolean({ message: 'El estado debe ser un valor booleano (true o false).' })
  readonly estado: boolean;
}
