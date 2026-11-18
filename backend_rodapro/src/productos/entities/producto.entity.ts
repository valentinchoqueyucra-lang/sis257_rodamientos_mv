import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Categoria } from '../../categorias/entities/categoria.entity';

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn('identity', { name: 'id_producto' })
  id: number;

  @Column('varchar', { length: 50 })
  codigo: string;

  @Column('varchar', { length: 150 })
  nombre: string;

  @Column('varchar', { length: 255 })
  descripcion: string;

  @Column('varchar', { length: 100 })
  marca: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'precio_compra' })
  precioCompra: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'precio_venta' })
  precioVenta: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'int', default: 0, name: 'stock_minimo' })
  stockMinimo: number;

  @Column('boolean', { default: true })
  estado: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_modificacion' })
  fechaModificacion: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion' })
  fechaEliminacion: Date;

  @ManyToOne(() => Categoria, categoria => categoria.productos)
  @JoinColumn({ name: 'id_categoria', referencedColumnName: 'id' })
  categoria: Categoria;

}