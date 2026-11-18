import { IsEnum, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Rol } from '../../common/enums';

export class CreateUsuarioDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  nombreCompleto: string;

  @IsString() @MinLength(3) @MaxLength(50)
  @Matches(/^[A-Za-z0-9_.-]+$/, { message: 'nombreUsuario solo admite letras, números, . _ -' })
  nombreUsuario: string;

  @IsString() @MinLength(6) @MaxLength(72)
  password: string;

  @IsEnum(Rol)
  rol: Rol;
}
