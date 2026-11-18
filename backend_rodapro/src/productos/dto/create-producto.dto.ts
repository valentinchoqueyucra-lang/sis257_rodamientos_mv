import { Type } from 'class-transformer';
import {
  IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min,
} from 'class-validator';

export class CreateProductoDto {
  @Type(() => Number) @IsInt() @IsPositive()
  idCategoria: number;

  @IsString() @IsNotEmpty() @MaxLength(50)
  codigo: string;

  @IsString() @IsNotEmpty() @MaxLength(150)
  nombre: string;

  @IsOptional() @IsString() @MaxLength(255)
  descripcion?: string;

  @IsOptional() @IsString() @MaxLength(80)
  marca?: string;

  /** @example UNIDAD */
  @IsOptional() @IsString() @MaxLength(30)
  unidadMedida?: string;

  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  precioCompra: number;

  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  precioVenta: number;

  /** Stock inicial. Después solo cambia con compras, ventas o ajustes de inventario. */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  stock?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  stockMinimo?: number;
}
