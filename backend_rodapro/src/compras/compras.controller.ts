import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';
import { Rol } from '../common/enums';
import { AnularDto } from '../ventas/dto/anular.dto';
import { ComprasService } from './compras.service';
import { CreateCompraDto } from './dto/create-compra.dto';

@ApiTags('Compras')
@ApiBearerAuth()
@Roles(Rol.ADMINISTRADOR, Rol.ALMACENERO)
@Controller('compras')
export class ComprasController {
  constructor(private readonly service: ComprasService) {}

  @Get()
  @ApiQuery({ name: 'desde', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'hasta', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'idProveedor', required: false, type: Number })
  @ApiQuery({ name: 'estado', required: false, type: Boolean, description: 'true = vigentes, false = anuladas' })
  listar(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('idProveedor') idProveedor?: string,
    @Query('estado') estado?: string,
  ) {
    return this.service.listar({
      desde,
      hasta,
      idProveedor: idProveedor ? +idProveedor : undefined,
      estado: estado === undefined || estado === '' ? undefined : estado === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar compra (transacción: detalle, ingreso de stock, kardex y pago)' })
  crear(@Body() dto: CreateCompraDto, @CurrentUser() user: AuthUser) {
    return this.service.crear(dto, user.id);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Patch(':id/anular')
  @ApiOperation({ summary: 'Anular compra (descuenta el stock ingresado)' })
  anular(@Param('id', ParseIntPipe) id: number, @Body() dto: AnularDto, @CurrentUser() user: AuthUser) {
    return this.service.anular(id, dto.motivo, user.id);
  }
}
