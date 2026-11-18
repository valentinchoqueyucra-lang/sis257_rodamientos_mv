import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';
import { Rol } from '../common/enums';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { ProductosService } from './productos.service';

@ApiTags('Productos')
@ApiBearerAuth()
@Controller('productos')
export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  @Get()
  @ApiQuery({ name: 'soloActivos', required: false, type: Boolean })
  @ApiQuery({ name: 'q', required: false, description: 'Texto a buscar en código, nombre o marca' })
  @ApiQuery({ name: 'idCategoria', required: false, type: Number })
  findAll(
    @Query('soloActivos') soloActivos?: string,
    @Query('q') q?: string,
    @Query('idCategoria') idCategoria?: string,
  ) {
    return this.service.buscar(soloActivos === 'true', q, idCategoria ? +idCategoria : undefined);
  }

  @Get('stock-bajo')
  @ApiOperation({ summary: 'Productos activos con stock <= stock mínimo' })
  stockBajo() {
    return this.service.stockBajo();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.ALMACENERO)
  @Post()
  create(@Body() dto: CreateProductoDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.ALMACENERO)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductoDto) {
    return this.service.update(id, dto);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.ALMACENERO)
  @Delete(':id')
  @ApiOperation({ summary: 'Borrado lógico (estado = false)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.ALMACENERO)
  @Patch(':id/restaurar')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.service.restore(id);
  }
}
