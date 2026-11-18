import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '../categorias/entities/categoria.entity';
import { Producto } from '../productos/entities/producto.entity';

export type Disponibilidad = 'DISPONIBLE' | 'POCO_STOCK' | 'AGOTADO';

export interface FiltroCatalogo {
  q?: string;
  idCategoria?: number;
  soloDisponibles?: boolean;
  page: number;
  limit: number;
}

@Injectable()
export class CatalogoService {
  constructor(
    @InjectRepository(Producto) private readonly productos: Repository<Producto>,
    @InjectRepository(Categoria) private readonly categorias: Repository<Categoria>,
    private readonly config: ConfigService,
  ) {}

  /** Datos de contacto de la tienda (se configuran en el .env). */
  tienda() {
    const direccion = this.config.get<string>('TIENDA_DIRECCION', 'Sucre, Bolivia');
    // Cada tramo del horario va separado por "|" para mostrarlo en líneas.
    const horarios = this.config
      .get<string>('TIENDA_HORARIO', '')
      .split('|')
      .map((h) => h.trim())
      .filter(Boolean);
    const lat = this.config.get<string>('TIENDA_LATITUD', '').trim();
    const lng = this.config.get<string>('TIENDA_LONGITUD', '').trim();
    // Prioridad del mapa embebido: URL de "Insertar un mapa" > coordenadas > dirección.
    const consulta = lat && lng ? `${lat},${lng}` : `${direccion}, Bolivia`;
    const mapaEmbedUrl =
      this.config.get<string>('TIENDA_MAPA_EMBED', '').trim() ||
      `https://maps.google.com/maps?q=${encodeURIComponent(consulta)}&z=16&output=embed`;
    const mapaUrl =
      this.config.get<string>('TIENDA_MAPA_URL', '').trim() ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;

    return {
      nombre: this.config.get('TIENDA_NOMBRE', 'RODAPRO'),
      direccion,
      telefono: this.config.get('TIENDA_TELEFONO', ''),
      whatsapp: this.config.get('TIENDA_WHATSAPP', ''),
      horario: horarios.join(' · '),
      horarios,
      mapaUrl,
      mapaEmbedUrl,
    };
  }

  /** Solo categorías activas que tienen al menos un producto activo. */
  categoriasConConteo() {
    return this.categorias
      .createQueryBuilder('c')
      .leftJoin('c.productos', 'p', 'p.estado = true')
      .select('c.id', 'id')
      .addSelect('c.nombre', 'nombre')
      .addSelect('COUNT(p.id)::int', 'total')
      .where('c.estado = true')
      .groupBy('c.id')
      .addGroupBy('c.nombre')
      .having('COUNT(p.id) > 0')
      .orderBy('c.nombre', 'ASC')
      .getRawMany<{ id: number; nombre: string; total: number }>();
  }

  /**
   * Catálogo público: NO expone precio de compra, stock exacto ni datos de auditoría.
   * Solo informa la disponibilidad (disponible / poco stock / agotado).
   */
  async productosPublicos(f: FiltroCatalogo) {
    const qb = this.productos
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.categoria', 'c')
      .where('p.estado = true')
      .andWhere('c.estado = true');

    if (f.idCategoria) qb.andWhere('p.idCategoria = :idCategoria', { idCategoria: f.idCategoria });
    if (f.soloDisponibles) qb.andWhere('p.stock > 0');
    if (f.q?.trim()) {
      qb.andWhere('(p.codigo ILIKE :q OR p.nombre ILIKE :q OR p.marca ILIKE :q OR p.descripcion ILIKE :q)', {
        q: `%${f.q.trim()}%`,
      });
    }

    const [rows, total] = await qb
      .orderBy('p.nombre', 'ASC')
      .skip((f.page - 1) * f.limit)
      .take(f.limit)
      .getManyAndCount();

    return {
      items: rows.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        descripcion: p.descripcion,
        marca: p.marca,
        unidadMedida: p.unidadMedida,
        precioVenta: p.precioVenta,
        categoria: { id: p.categoria.id, nombre: p.categoria.nombre },
        disponibilidad: this.disponibilidad(p),
      })),
      total,
      page: f.page,
      limit: f.limit,
    };
  }

  private disponibilidad(p: Producto): Disponibilidad {
    if (p.stock <= 0) return 'AGOTADO';
    if (p.stock <= p.stockMinimo) return 'POCO_STOCK';
    return 'DISPONIBLE';
  }
}
