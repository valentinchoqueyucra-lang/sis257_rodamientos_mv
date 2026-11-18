import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Rol } from './enums';

export const IS_PUBLIC_KEY = 'isPublic';
/** Marca una ruta como pública (sin JWT). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** Restringe la ruta a los roles indicados. Sin decorador: cualquier usuario autenticado. */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);

export interface AuthUser {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  rol: Rol;
}

/** Usuario autenticado (cargado por JwtStrategy). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest().user,
);