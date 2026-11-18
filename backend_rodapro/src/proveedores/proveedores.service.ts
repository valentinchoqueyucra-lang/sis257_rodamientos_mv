import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { Proveedor } from './entities/proveedor.entity';

@Injectable()
export class ProveedoresService extends CrudService<Proveedor> {
  constructor(@InjectRepository(Proveedor) repo: Repository<Proveedor>) {
    super(repo, 'Proveedor');
  }
}
