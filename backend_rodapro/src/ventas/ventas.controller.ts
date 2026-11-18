import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';
import { Rol } from '../common/enums';
import { AnularDto } from './dto/anular.dto';
import { CreateVentaDto } from './dto/create-venta.dto';
import { VentasService } from './ventas.service';

@ApiTags('Ventas')
@ApiBearerAuth()
@Roles(Rol.ADMINISTRADOR, Rol.VENDEDOR)
@Controller('ventas')
export class VentasController {
  constructor(private readonly service: VentasService) {}

  @Get()
  @ApiQuery({ name: 'desde', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'hasta', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'idCliente', required: false, type: Number })
  @ApiQuery({ name: 'estado', required: false, type: Boolean, description: 'true = vigentes, false = anuladas' })
  listar(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('idCliente') idCliente?: string,
    @Query('estado') estado?: string,
  ) {
    return this.service.listar({
      desde,
      hasta,
      idCliente: idCliente ? +idCliente : undefined,
      estado: estado === undefined || estado === '' ? undefined : estado === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar venta (transacción: detalle, stock, kardex y pago)' })
  crear(@Body() dto: CreateVentaDto, @CurrentUser() user: AuthUser) {
    return this.service.crear(dto, user.id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Patch(':id/anular')
  @ApiOperation({ summary: 'Anular venta (revierte stock y registra movimiento inverso)' })
  anular(@Param('id', ParseIntPipe) id: number, @Body() dto: AnularDto, @CurrentUser() user: AuthUser) {
    return this.service.anular(id, dto.motivo, user.id);
  }
}
