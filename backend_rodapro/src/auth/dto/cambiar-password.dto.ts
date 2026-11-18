import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CambiarPasswordDto {
  @IsString() @IsNotEmpty()
  passwordActual: string;

  @IsString() @MinLength(6) @MaxLength(72)
  passwordNueva: string;
}