import { NotFoundException } from '@nestjs/common';
import { FindOptionsRelations, FindOptionsWhere, Repository } from 'typeorm';
import { BaseAuditEntity } from './base-audit.entity';

/**
 * Servicio base para los catálogos: listar, obtener, crear, actualizar
 * y borrado lógico (estado = false) con restauración.
 */
export abstract class CrudService<T extends BaseAuditEntity> {
  protected constructor(
    protected readonly repo: Repository<T>,
    protected readonly etiqueta: string,
    protected readonly relations: FindOptionsRelations<T> = {},
  ) {}

  async findAll(soloActivos = false): Promise<T[]> {
    return this.repo.find({
      where: (soloActivos ? { estado: true } : {}) as FindOptionsWhere<T>,
      relations: this.relations,
      order: { id: 'ASC' } as any,
    });
  }

  async findOne(id: number): Promise<T> {
    const entity = await this.repo.findOne({
      where: { id } as FindOptionsWhere<T>,
      relations: this.relations,
    });
    if (!entity) throw new NotFoundException(`${this.etiqueta} #${id} no encontrado/a`);
    return entity;
  }

  async create(dto: any, _userId?: number): Promise<T> {
    const saved = await this.repo.save(this.repo.create(dto as any) as unknown as T);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: any): Promise<T> {
    // Sin relaciones cargadas: así un cambio de FK (idCategoria...) no es pisado.
    const entity = await this.getPlain(id);
    this.repo.merge(entity, dto);
    await this.repo.save(entity);
    return this.findOne(id);
  }

  /** Borrado lógico. */
  async remove(id: number): Promise<T> {
    return this.setEstado(id, false);
  }

  async restore(id: number): Promise<T> {
    return this.setEstado(id, true);
  }

  protected async getPlain(id: number): Promise<T> {
    const entity = await this.repo.findOneBy({ id } as FindOptionsWhere<T>);
    if (!entity) throw new NotFoundException(`${this.etiqueta} #${id} no encontrado/a`);
    return entity;
  }

  private async setEstado(id: number, estado: boolean): Promise<T> {
    const entity = await this.getPlain(id);
    entity.estado = estado;
    await this.repo.save(entity);
    return this.findOne(id);
  }
}