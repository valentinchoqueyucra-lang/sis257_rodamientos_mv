import { ConflictException, Injectable } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './entities/producto.entity';

@Injectable()
export class ProductosService {
  constructor(@InjectRepository(Producto) private productoRepository: Repository<Producto>) {}
  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    let producto = await this.productoRepository.findOneBy({
      codigo: createProductoDto.codigo,
      nombre: createProductoDto.nombre,
      descripcion: createProductoDto.descripcion,
      marca: createProductoDto.marca,
      precioCompra: createProductoDto.precioCompra,
      precioVenta: createProductoDto.precioVenta,
      stock: createProductoDto.stock,
      stockMinimo: createProductoDto.stockMinimo,
      estado: createProductoDto.estado,
    });
    if (producto) throw new ConflictException('El producto ya existe');

    producto = this.productoRepository.create(createProductoDto);
    return this.productoRepository.save(producto);
  }

  async findAll(): Promise<Producto[]> {
    return this.productoRepository.find();
  }

  async findOne(id: number): Promise<Producto> {
    const producto = await this.productoRepository.findOneBy({ id });
    if (!producto) throw new ConflictException('El producto no existe');
    return producto;
  }

  async update(id: number, updateProductoDto: UpdateProductoDto): Promise<Producto> {
    const producto = await this.findOne(id);
    Object.assign(producto, updateProductoDto);
    return this.productoRepository.save(producto);
  }

  async remove(id: number): Promise<Producto> {
    const producto = await this.findOne(id);
    await this.productoRepository.softRemove(producto);
    return producto;
  }
}
