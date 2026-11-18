import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { Categoria } from './entities/categoria.entity';

@Injectable()
export class CategoriasService extends CrudService<Categoria> {
  constructor(@InjectRepository(Categoria) repo: Repository<Categoria>) {
    super(repo, 'Categoría');
  }
}
