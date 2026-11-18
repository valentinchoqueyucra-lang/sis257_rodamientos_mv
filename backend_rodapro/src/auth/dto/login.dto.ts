import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  /** @example admin */
  @IsString() @IsNotEmpty()
  nombreUsuario: string;

  /** @example Admin123* */
  @IsString() @IsNotEmpty()
  password: string;
}
