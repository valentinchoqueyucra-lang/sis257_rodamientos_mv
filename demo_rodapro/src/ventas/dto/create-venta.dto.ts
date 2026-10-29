import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVentaDto {
  @ApiProperty()
  @IsDefined({ message: 'La fecha es obligatoria' })
  @IsDateString({}, { message: 'La fecha debe ser de tipo fecha' })
  readonly fecha: Date;

  @ApiProperty()
  @IsNotEmpty({ message: 'El numero de documento es obligatorio.' })
  @IsString({ message: 'El numero de documento debe ser de tipo cadena de texto.' })
  @MaxLength(50, { message: 'El numero de documento no puede tener mas de 50 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly numeroDocumento: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio.' })
  @IsString({ message: 'El tipo de documento debe ser de tipo cadena de texto.' })
  @MaxLength(100, { message: 'El tipo de documento no puede tener masa de 100 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly tipoDocumento: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El subtotal es obligatorio.' })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El subtotal debe ser un número con máximo 2 decimales.' },
  )
  @Min(0, { message: 'El precio de compra no puede ser negativo.' })
  readonly subTotal: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'El descuento es obligatorio.' })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El descuento debe ser un número con máximo 2 decimales.' },
  )
  @Min(0, { message: 'El precio de venta no puede ser negativo.' })
  readonly descuento: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'El total es obligatorio.' })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El total debe ser un número con máximo 2 decimales.' },
  )
  @Min(0, { message: 'El total no puede ser negativo.' })
  readonly total: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsString({ message: 'La estado debe ser de tipo cadena de texto.' })
  @MaxLength(30, { message: 'La estado no puede tener mas de 30 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly estado: string;
}