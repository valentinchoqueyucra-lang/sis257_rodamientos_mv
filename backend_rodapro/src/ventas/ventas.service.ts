import { ConflictException, Injectable } from '@nestjs/common';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Venta } from './entities/venta.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class VentasService {
  constructor(@InjectRepository(Venta) private ventaRepository: Repository<Venta>) {}
  async create(createVentaDto: CreateVentaDto): Promise<Venta> {
    let venta = await this.ventaRepository.findOneBy({
      fecha: createVentaDto.fecha,
      numeroDocumento: createVentaDto.numeroDocumento,
      tipoDocuemnto: createVentaDto.tipoDocumento,
      subTotal: createVentaDto.subTotal,
      descuento: createVentaDto.descuento,
      total: createVentaDto.total,
      estado: createVentaDto.estado,
    });
    if (venta) throw new ConflictException('La venta ya existe');

    venta = this.ventaRepository.create(createVentaDto);
    return this.ventaRepository.save(venta);
  }

  async findAll(): Promise<Venta[]> {
    return this.ventaRepository.find();
  }

  async findOne(id: number): Promise<Venta> {
    const venta = await this.ventaRepository.findOneBy({ id });
    if (!venta) throw new ConflictException('La venta no existe');
    return venta;
  }

  async update(id: number, updateVentaDto: UpdateVentaDto): Promise<Venta> {
    const venta = await this.findOne(id);
    Object.assign(venta, updateVentaDto);
    return this.ventaRepository.save(venta);
  }

  async remove(id: number): Promise<Venta> {
    const venta = await this.findOne(id);
    await this.ventaRepository.softRemove(venta);
    return venta;
  }
}

