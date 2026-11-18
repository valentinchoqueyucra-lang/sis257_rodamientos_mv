import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString,
  MaxLength, Min, ValidateNested,
} from 'class-validator';
import { MetodoPago } from '../../common/enums';

export class DetalleCompraDto {
  @Type(() => Number) @IsInt() @IsPositive()
  idProducto: number;

  @Type(() => Number) @IsInt() @Min(1)
  cantidad: number;

  /** Costo unitario de esta compra (Bs.). */
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  precioUnitario: number;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  descuento?: number;
}

export class CreateCompraDto {
  @Type(() => Number) @IsInt() @IsPositive()
  idProveedor: number;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  descuento?: number;

  @IsEnum(MetodoPago)
  metodoPago: MetodoPago;

  @IsOptional() @IsString() @MaxLength(100)
  referencia?: string;

  @IsOptional() @IsString() @MaxLength(255)
  observacion?: string;

  @IsArray() @ArrayMinSize(1, { message: 'La compra debe tener al menos un producto' })
  @ValidateNested({ each: true }) @Type(() => DetalleCompraDto)
  detalles: DetalleCompraDto[];
}
