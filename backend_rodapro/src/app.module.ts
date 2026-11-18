import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditContextInterceptor } from './common/audit-context.interceptor';
import { AuditSubscriber } from './common/audit.subscriber';
import { SnakeNamingStrategy } from './common/snake-naming.strategy';
import { TypeOrmExceptionFilter } from './common/typeorm-exception.filter';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { CatalogoModule } from './catalogo/catalogo.module';
import { CategoriasModule } from './categorias/categorias.module';
import { ClientesModule } from './clientes/clientes.module';
import { ComprasModule } from './compras/compras.module';
import { MovimientosInventarioModule } from './movimientos-inventario/movimientos-inventario.module';
import { PagosModule } from './pagos/pagos.module';
import { ProductosModule } from './productos/productos.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { ReportesModule } from './reportes/reportes.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { VentasModule } from './ventas/ventas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get('DB_HOST', 'localhost'),
        port: +config.get('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'sis257_rodapro').trim(),
        password: config.get<string>('DB_PASSWORD', '123456'),
        database: config.get<string>('DB_NAME', 'rodapro'),
        autoLoadEntities: true,
        // Solo para desarrollo: crea/ajusta las tablas a partir de las entidades.
        synchronize: true,
        namingStrategy: new SnakeNamingStrategy(),
        subscribers: [AuditSubscriber],
      }),
    }),
    AuthModule,
    UsuariosModule,
    CategoriasModule,
    ProductosModule,
    ClientesModule,
    ProveedoresModule,
    VentasModule,
    ComprasModule,
    PagosModule,
    MovimientosInventarioModule,
    ReportesModule,
    CatalogoModule,
  ],
  providers: [
    // Orden: primero autentica (JWT), luego valida rol.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditContextInterceptor },
    { provide: APP_FILTER, useClass: TypeOrmExceptionFilter },
  ],
})
export class AppModule {}

