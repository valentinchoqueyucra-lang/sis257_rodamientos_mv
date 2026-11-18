import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { Rol } from '../common/enums';
import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@ApiTags('Categorías')
@ApiBearerAuth()
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly service: CategoriasService) {}

  @Get()
  @ApiQuery({ name: 'soloActivos', required: false, type: Boolean })
  findAll(@Query('soloActivos') soloActivos?: string) {
    return this.service.findAll(soloActivos === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.ALMACENERO)
  @Post()
  create(@Body() dto: CreateCategoriaDto) {
    return this.service.create(dto);
  }

  @Roles(Rol.ADMINISTRADOR, Rol.ALMACENERO)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoriaDto) {
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
