import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';
import { TipoMovimiento } from '../../common/enums';

export class AjusteInventarioDto {
  @Type(() => Number) @IsInt() @IsPositive()
  idProducto: number;

  /** ENTRADA suma stock, SALIDA lo descuenta (mermas, daños, correcciones). */
  @IsEnum(TipoMovimiento)
  tipoMovimiento: TipoMovimiento;

  @Type(() => Number) @IsInt() @IsPositive()
  cantidad: number;

  /** Motivo del ajuste (obligatorio para dejar trazabilidad). */
  @IsString() @MinLength(3) @MaxLength(255)
  observacion: string;
}
