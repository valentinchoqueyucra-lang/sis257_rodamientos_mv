import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductoDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'El codigo es obligatorio.' })
  @IsString({ message: 'El codigo debe ser de tipo cadena de texto.' })
  @MaxLength(50, { message: 'El codigo no puede tener mas de 50 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly codigo: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString({ message: 'El nombre debe ser de tipo cadena de texto.' })
  @MaxLength(150, { message: 'El nombre no puede tener masa de 150 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly nombre: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'La descripción es obligatorio.' })
  @IsString({ message: 'La descripción debe ser de tipo cadena de texto.' })
  @MaxLength(255, { message: 'La descripción no puede tener mas de 255 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly descripcion: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'La marca es obligatorio.' })
  @IsString({ message: 'La marca debe ser de tipo cadena de texto.' })
  @MaxLength(100, { message: 'La marca no puede tener mas de 100 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly marca: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'El precio de compra es obligatorio.' })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio de compra debe ser un número con máximo 2 decimales.' },
  )
  @Min(0, { message: 'El precio de compra no puede ser negativo.' })
  readonly precioCompra: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'El precio de venta es obligatorio.' })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio de venta debe ser un número con máximo 2 decimales.' },
  )
  @Min(0, { message: 'El precio de venta no puede ser negativo.' })
  readonly precioVenta: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'El stock es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'El stock debe ser un número entero.' })
  @Min(0, { message: 'El stock no puede ser negativo.' })
  stock: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'El stock mínimo es obligatorio.' })
  @Type(() => Number)
  @IsInt({ message: 'El stock debe ser un número entero.' })
  @Min(0, { message: 'El stock no puede ser negativo.' })
  stockMinimo: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  @IsBoolean({ message: 'El estado debe ser un valor booleano (true o false).' })
  readonly estado: boolean;
}
