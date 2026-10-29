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

export class CreatePagoDto {
  @ApiProperty()
  @IsDefined({ message: 'La fecha es obligatoria' })
  @IsDateString({}, { message: 'La fecha debe ser de tipo fecha' })
  readonly fecha: Date;

  @ApiProperty()
  @IsNotEmpty({ message: 'El monto es obligatorio.' })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto debe ser un número con máximo 2 decimales.' },
  )
  @Min(0, { message: 'El monto no puede ser negativo.' })
  readonly monto: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'El metodo de pago es obligatorio.' })
  @IsString({ message: 'El metodo de pago debe ser de tipo cadena de texto.' })
  @MaxLength(50, { message: 'El metodo de pago no puede tener mas de 50 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly metodoPagp: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'La referencia es obligatorio.' })
  @IsString({ message: 'La referencia debe ser de tipo cadena de texto.' })
  @MaxLength(100, { message: 'La referencia no puede tener masa de 100 caracteres' })
  @Transform(({ value }): string | undefined => (typeof value === 'string' ? value.trim() : value))
  readonly referencia: string;
}
