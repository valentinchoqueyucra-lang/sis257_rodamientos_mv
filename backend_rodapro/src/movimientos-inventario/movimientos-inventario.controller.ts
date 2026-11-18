import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';
import { ReferenciaTipo, Rol, TipoMovimiento } from '../common/enums';
import { AjusteInventarioDto } from './dto/ajuste-inventario.dto';
import { MovimientosInventarioService } from './movimientos-inventario.service';

@ApiTags('Movimientos de inventario')
@ApiBearerAuth()
@Roles(Rol.ADMINISTRADOR, Rol.ALMACENERO)
@Controller('movimientos-inventario')
export class MovimientosInventarioController {
  constructor(private readonly service: MovimientosInventarioService) {}

  @Get()
  @ApiOperation({ summary: 'Kardex de movimientos de inventario' })
  @ApiQuery({ name: 'idProducto', required: false, type: Number })
  @ApiQuery({ name: 'tipoMovimiento', required: false, enum: TipoMovimiento })
  @ApiQuery({ name: 'referenciaTipo', required: false, enum: ReferenciaTipo })
  @ApiQuery({ name: 'desde', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'hasta', required: false, description: 'YYYY-MM-DD' })
  movimientos(
    @Query('idProducto') idProducto?: string,
    @Query('tipoMovimiento') tipoMovimiento?: TipoMovimiento,
    @Query('referenciaTipo') referenciaTipo?: ReferenciaTipo,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.movimientos({
      idProducto: idProducto ? +idProducto : undefined,
      tipoMovimiento,
      referenciaTipo,
      desde,
      hasta,
    });
  }

  @Post('ajuste')
  @ApiOperation({ summary: 'Ajuste manual de stock (merma, corrección, etc.)' })
  ajustar(@Body() dto: AjusteInventarioDto, @CurrentUser() user: AuthUser) {
    return this.service.ajustar(dto, user.id);
  }
}
