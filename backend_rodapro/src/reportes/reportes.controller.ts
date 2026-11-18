import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators';
import { Rol } from '../common/enums';
import { ReportesService } from './reportes.service';

@ApiTags('Reportes')
@ApiBearerAuth()
@Roles(Rol.ADMINISTRADOR)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  @Get('resumen')
  @ApiOperation({ summary: 'Indicadores del tablero: ventas, compras, stock bajo, top productos' })
  resumen() {
    return this.service.resumen();
  }
}
