import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProductoDto } from './create-producto.dto';

/** El stock no se edita aquí: use /movimientos-inventario/ajuste para mantener el kardex. */
export class UpdateProductoDto extends PartialType(OmitType(CreateProductoDto, ['stock'] as const)) {}
