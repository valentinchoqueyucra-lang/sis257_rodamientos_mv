import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { CrudService } from '../common/crud.service';
import { Rol } from '../common/enums';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuariosService extends CrudService<Usuario> implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    @InjectRepository(Usuario) repo: Repository<Usuario>,
    private readonly config: ConfigService,
  ) {
    super(repo, 'Usuario');
  }

  /** Crea el administrador inicial si la tabla está vacía. */
  async onApplicationBootstrap() {
    if ((await this.repo.count()) > 0) return;
    const nombreUsuario = this.config.get('ADMIN_USUARIO', 'admin');
    const password = this.config.get('ADMIN_PASSWORD', 'Admin123*');
    await this.repo.save(
      this.repo.create({
        nombreCompleto: this.config.get('ADMIN_NOMBRE_COMPLETO', 'Administrador RODAPRO'),
        nombreUsuario,
        password: await bcrypt.hash(password, 10),
        rol: Rol.ADMINISTRADOR,
      }),
    );
    this.logger.warn(`Usuario administrador inicial creado: "${nombreUsuario}". Cambie su contraseña.`);
  }

  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    return super.create({ ...dto, password: await bcrypt.hash(dto.password, 10) });
  }

  async update(id: number, dto: UpdateUsuarioDto): Promise<Usuario> {
    const { password, ...rest } = dto;
    const data: Partial<Usuario> = { ...rest };
    if (password) data.password = await bcrypt.hash(password, 10);
    return super.update(id, data);
  }

  findByNombreUsuarioConPassword(nombreUsuario: string) {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.nombreUsuario = :nombreUsuario', { nombreUsuario })
      .getOne();
  }

  findByIdConPassword(id: number) {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.id = :id', { id })
      .getOne();
  }

  findActiveById(id: number) {
    return this.repo.findOneBy({ id, estado: true });
  }

  async cambiarPassword(id: number, nueva: string) {
    const usuario = await this.getPlain(id);
    usuario.password = await bcrypt.hash(nueva, 10);
    await this.repo.save(usuario);
  }
}