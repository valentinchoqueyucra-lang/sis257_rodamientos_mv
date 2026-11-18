import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { BaseAuditEntity } from '../../common/base-audit.entity';
import { Producto } from '../../productos/entities/producto.entity';

@Entity('categorias')
export class Categoria extends BaseAuditEntity {
  @PrimaryGeneratedColumn({ name: 'id_categoria' })
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;

  @OneToMany(() => Producto, (p) => p.categoria)
  productos: Relation<Producto>[];
}
