import { ConflictException, Injectable } from '@nestjs/common';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './entities/categoria.entity';

@Injectable()
export class CategoriasService {
  constructor(@InjectRepository(Categoria) private categoriaRepository: Repository<Categoria>) {}
  async create(createCategoriaDto: CreateCategoriaDto): Promise<Categoria> {
    let categoria = await this.categoriaRepository.findOneBy({
      nombre: createCategoriaDto.nombre,
      descripcion: createCategoriaDto.descripcion,
      estado: createCategoriaDto.estado,
    });
    if (categoria) throw new ConflictException('La categoría ya existe');

    categoria = this.categoriaRepository.create(createCategoriaDto);
    return this.categoriaRepository.save(categoria);
  }

  async findAll(): Promise<Categoria[]> {
    return this.categoriaRepository.find();
  }

  async findOne(id: number): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findOneBy({ id });
    if (!categoria) throw new ConflictException('La categoría no existe');
    return categoria;
  }

  async update(id: number, updateCategoriaDto: UpdateCategoriaDto): Promise<Categoria> {
    const categoria = await this.findOne(id);
    Object.assign(categoria, updateCategoriaDto);
    return this.categoriaRepository.save(categoria);
  }

  async remove(id: number): Promise<Categoria> {
    const categoria = await this.findOne(id);
    await this.categoriaRepository.softRemove(categoria);
    return categoria;
  }
}
