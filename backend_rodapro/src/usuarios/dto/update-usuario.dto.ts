import { PartialType } from '@nestjs/swagger';
import { CreateUsuarioDto } from './create-usuario.dto';

/** La contraseña es opcional al editar: si no se envía, se conserva. */
export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {}
