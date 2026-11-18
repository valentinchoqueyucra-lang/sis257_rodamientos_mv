import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString,
  MaxLength, Min, ValidateNested,
} from 'class-validator';
import { MetodoPago } from '../../common/enums';

export class DetalleVentaDto {
  @Type(() => Number) @IsInt() @IsPositive()
  idProducto: number;

  @Type(() => Number) @IsInt() @Min(1)
  cantidad: number;

  /** Descuento en Bs. sobre toda la línea (no por unidad). */
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  descuento?: number;
}

export class CreateVentaDto {
  /** Opcional: venta al paso sin cliente registrado. */
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  idCliente?: number | null;

  /** Descuento global en Bs. sobre el subtotal. */
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  descuento?: number;

  @IsEnum(MetodoPago)
  metodoPago: MetodoPago;

  /** Nº de transacción / comprobante QR. */
  @IsOptional() @IsString() @MaxLength(100)
  referencia?: string;

  @IsOptional() @IsString() @MaxLength(255)
  observacion?: string;

  @IsArray() @ArrayMinSize(1, { message: 'La venta debe tener al menos un producto' })
  @ValidateNested({ each: true }) @Type(() => DetalleVentaDto)
  detalles: DetalleVentaDto[];
}
