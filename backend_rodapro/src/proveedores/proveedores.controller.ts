import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { Rol } from '../common/enums';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { ProveedoresService } from './proveedores.service';

@ApiTags('Proveedores')
@ApiBearerAuth()
@Roles(Rol.ADMINISTRADOR, Rol.ALMACENERO)
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly service: ProveedoresService) {}

  @Get()
  @ApiQuery({ name: 'soloActivos', required: false, type: Boolean })
  findAll(@Query('soloActivos') soloActivos?: string) {
    return this.service.findAll(soloActivos === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProveedorDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProveedorDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Borrado lógico (estado = false)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Patch(':id/restaurar')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.service.restore(id);
  }
}
