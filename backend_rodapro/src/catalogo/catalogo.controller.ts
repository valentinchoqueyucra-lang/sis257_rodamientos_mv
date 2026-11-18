import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { CatalogoService } from './catalogo.service';

/** Endpoints abiertos (sin JWT) para la vista pública del cliente. */
@ApiTags('Catálogo público')
@Public()
@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly service: CatalogoService) {}

  @Get('tienda')
  @ApiOperation({ summary: 'Datos de contacto de la tienda' })
  tienda() {
    return this.service.tienda();
  }

  @Get('categorias')
  @ApiOperation({ summary: 'Categorías con productos disponibles en el catálogo' })
  categorias() {
    return this.service.categoriasConConteo();
  }

  @Get('productos')
  @ApiOperation({ summary: 'Productos activos, paginados (sin costos ni stock exacto)' })
  @ApiQuery({ name: 'q', required: false, description: 'Texto a buscar en código, nombre, marca o descripción' })
  @ApiQuery({ name: 'idCategoria', required: false, type: Number })
  @ApiQuery({ name: 'soloDisponibles', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Máx. 60' })
  productos(
    @Query('q') q?: string,
    @Query('idCategoria') idCategoria?: string,
    @Query('soloDisponibles') soloDisponibles?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(parseInt(page ?? '1', 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit ?? '24', 10) || 24, 1), 60);
    const cat = parseInt(idCategoria ?? '', 10);
    return this.service.productosPublicos({
      q: q?.slice(0, 80),
      idCategoria: Number.isFinite(cat) ? cat : undefined,
      soloDisponibles: soloDisponibles === 'true',
      page: p,
      limit: l,
    });
  }
}
