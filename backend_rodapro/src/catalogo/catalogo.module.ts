import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categoria } from '../categorias/entities/categoria.entity';
import { Producto } from '../productos/entities/producto.entity';
import { CatalogoController } from './catalogo.controller';
import { CatalogoService } from './catalogo.service';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, Categoria])],
  controllers: [CatalogoController],
  providers: [CatalogoService],
})
export class CatalogoModule {}
