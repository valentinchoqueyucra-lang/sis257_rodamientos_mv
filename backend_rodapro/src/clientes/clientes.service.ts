import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { Cliente } from './entities/cliente.entity';

@Injectable()
export class ClientesService extends CrudService<Cliente> {
  constructor(@InjectRepository(Cliente) repo: Repository<Cliente>) {
    super(repo, 'Cliente');
  }
}
