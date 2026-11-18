import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarios: UsuariosService,
    private readonly jwt: JwtService,
  ) {}

  async login({ nombreUsuario, password }: LoginDto) {
    const u = await this.usuarios.findByNombreUsuarioConPassword(nombreUsuario);
    // Mismo mensaje para usuario inexistente, inactivo o clave errada.
    if (!u || !u.estado || !(await bcrypt.compare(password, u.password))) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }
    const accessToken = await this.jwt.signAsync({
      sub: u.id,
      nombreUsuario: u.nombreUsuario,
      rol: u.rol,
    });
    return {
      accessToken,
      usuario: { id: u.id, nombreCompleto: u.nombreCompleto, nombreUsuario: u.nombreUsuario, rol: u.rol },
    };
  }

  async cambiarPassword(userId: number, dto: CambiarPasswordDto) {
    const u = await this.usuarios.findByIdConPassword(userId);
    if (!u || !(await bcrypt.compare(dto.passwordActual, u.password))) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }
    await this.usuarios.cambiarPassword(userId, dto.passwordNueva);
    return { message: 'Contraseña actualizada' };
  }
}

