import { ConflictException, Injectable } from '@nestjs/common';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';

@Injectable()
export class PagosService {
  constructor(@InjectRepository(Pago) private pagoRepository: Repository<Pago>) {}
  async create(createPagoDto: CreatePagoDto): Promise<Pago> {
    let pago = await this.pagoRepository.findOneBy({
      fecha: createPagoDto.fecha,
      monto: createPagoDto.monto,
      metodoPago: createPagoDto.metodoPagp,
      referencia: createPagoDto.referencia,
    });
    if (pago) throw new ConflictException('La pago ya existe');

    pago = this.pagoRepository.create(createPagoDto);
    return this.pagoRepository.save(pago);
  }

  async findAll(): Promise<Pago[]> {
    return this.pagoRepository.find();
  }

  async findOne(id: number): Promise<Pago> {
    const pago = await this.pagoRepository.findOneBy({ id });
    if (!pago) throw new ConflictException('La pago no existe');
    return pago;
  }

  async update(id: number, updatePagoDto: UpdatePagoDto): Promise<Pago> {
    const pago = await this.findOne(id);
    Object.assign(pago, updatePagoDto);
    return this.pagoRepository.save(pago);
  }

  async remove(id: number): Promise<Pago> {
    const pago = await this.findOne(id);
    await this.pagoRepository.softRemove(pago);
    return pago;
  }
}

