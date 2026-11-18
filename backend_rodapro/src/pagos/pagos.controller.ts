import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { MetodoPago, Rol } from '../common/enums';
import { PagosService } from './pagos.service';

/** Los pagos se generan al registrar ventas y compras; aquí solo se consultan. */
@ApiTags('Pagos')
@ApiBearerAuth()
@Roles(Rol.ADMINISTRADOR, Rol.VENDEDOR)
@Controller('pagos')
export class PagosController {
  constructor(private readonly service: PagosService) {}

  @Get()
  @ApiQuery({ name: 'tipo', required: false, enum: ['VENTA', 'COMPRA'] })
  @ApiQuery({ name: 'metodoPago', required: false, enum: MetodoPago })
  @ApiQuery({ name: 'desde', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'hasta', required: false, description: 'YYYY-MM-DD' })
  listar(
    @Query('tipo') tipo?: 'VENTA' | 'COMPRA',
    @Query('metodoPago') metodoPago?: MetodoPago,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.listar({ tipo, metodoPago, desde, hasta });
  }
}
