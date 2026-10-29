import { ConflictException, Injectable } from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';

@Injectable()
export class ClientesService {
  constructor(@InjectRepository(Cliente) private clienteRepository: Repository<Cliente>) {}
  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    let cliente = await this.clienteRepository.findOneBy({
      nombre: createClienteDto.nombre,
      apellido: createClienteDto.apellido,
      ciNit: createClienteDto.ciNit,
      telefono: createClienteDto.telefono,
      direccion: createClienteDto.direccion,
      estado: createClienteDto.estado,
    });
    if (cliente) throw new ConflictException('El cliente ya existe');

    cliente = this.clienteRepository.create(createClienteDto);
    return this.clienteRepository.save(cliente);
  }

  async findAll(): Promise<Cliente[]> {
    return this.clienteRepository.find();
  }

  async findOne(id: number): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOneBy({ id });
    if (!cliente) throw new ConflictException('El cliente no existe');
    return cliente;
  }

  async update(id: number, updateClienteDto: UpdateClienteDto): Promise<Cliente> {
    const cliente = await this.findOne(id);
    Object.assign(cliente, updateClienteDto);
    return this.clienteRepository.save(cliente);
  }

  async remove(id: number): Promise<Cliente> {
    const cliente = await this.findOne(id);
    await this.clienteRepository.softRemove(cliente);
    return cliente;
  }
}
