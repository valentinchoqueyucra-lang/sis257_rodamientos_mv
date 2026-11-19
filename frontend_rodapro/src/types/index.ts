// Tipos de la API de RODAPRO (reflejan las entidades y respuestas del backend).

export type Rol = 'ADMINISTRADOR' | 'VENDEDOR' | 'ALMACENERO';
export type MetodoPago = 'EFECTIVO' | 'QR';
export type TipoMovimiento = 'ENTRADA' | 'SALIDA';
export type ReferenciaTipo =
  | 'VENTA'
  | 'COMPRA'
  | 'ANULACION_VENTA'
  | 'ANULACION_COMPRA'
  | 'AJUSTE'
  | 'STOCK_INICIAL';

/** Columnas comunes a todas las tablas. */
export interface Auditoria {
  estado: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  usuarioCreacion: number | null;
  usuarioActualizacion: number | null;
}

export interface SesionUsuario {
  id: number;
  nombreCompleto: string;
  nombreUsuario: string;
  rol: Rol;
}

export interface LoginResponse {
  accessToken: string;
  usuario: SesionUsuario;
}

export interface Usuario extends Auditoria, SesionUsuario {}

export interface Categoria extends Auditoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Producto extends Auditoria {
  id: number;
  idCategoria: number;
  categoria?: Categoria;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  marca: string | null;
  unidadMedida: string;
  precioCompra: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
}

export type TipoDocumento = 'CI' | 'NIT' | 'CARNET_EXTRANJERO' | 'PASAPORTE';

export interface Cliente extends Auditoria {
  id: number;
  nombre: string;
  apellido: string | null;
  tipoDocumento: TipoDocumento;
  ciNit: string;
  telefono: string | null;
  direccion: string | null;
}

export interface Proveedor extends Auditoria {
  id: number;
  nombreEmpresa: string;
  nit: string;
  telefono: string | null;
  direccion: string | null;
  email: string | null;
}

export interface Pago extends Auditoria {
  id: number;
  idVenta: number | null;
  idCompra: number | null;
  idUsuario: number;
  usuario?: Usuario;
  fecha: string;
  monto: number;
  metodoPago: MetodoPago;
  referencia: string | null;
}

export interface DetalleDocumento extends Auditoria {
  id: number;
  idProducto: number;
  producto?: Producto;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
}

interface DocumentoBase extends Auditoria {
  id: number;
  idUsuario: number;
  usuario?: Usuario;
  fecha: string;
  subtotal: number;
  descuento: number;
  total: number;
  observacion: string | null;
  motivoAnulacion: string | null;
  detalles?: DetalleDocumento[];
  pagos?: Pago[];
}

export interface Venta extends DocumentoBase {
  idCliente: number | null;
  cliente: Cliente | null;
}

export interface Compra extends DocumentoBase {
  idProveedor: number;
  proveedor?: Proveedor;
}

export type Documento = Venta | Compra;

export interface MovimientoInventario extends Auditoria {
  id: number;
  idProducto: number;
  producto?: Producto;
  idUsuario: number;
  usuario?: Usuario;
  fecha: string;
  tipoMovimiento: TipoMovimiento;
  cantidad: number;
  referenciaTipo: ReferenciaTipo;
  referenciaId: number | null;
  stockAnterior: number;
  stockResultante: number;
  observacion: string | null;
}

export interface ReporteResumen {
  ventasHoy: { total: number; cantidad: number };
  ventasMes: { total: number; cantidad: number };
  comprasMes: { total: number; cantidad: number };
  productosActivos: number;
  stockBajo: number;
  clientesActivos: number;
  ultimos7Dias: { fecha: string; total: number }[];
  topProductos: { nombre: string; cantidad: number; total: number }[];
  ventasPorMetodo: { metodoPago: MetodoPago; total: number }[];
}

// ---- Catálogo público (vista del cliente) ----
export type Disponibilidad = 'DISPONIBLE' | 'POCO_STOCK' | 'AGOTADO';

export interface CatalogoProducto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  marca: string | null;
  unidadMedida: string;
  precioVenta: number;
  categoria: { id: number; nombre: string };
  disponibilidad: Disponibilidad;
}

export interface CatalogoCategoria {
  id: number;
  nombre: string;
  total: number;
}

export interface Paginado<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TiendaInfo {
  nombre: string;
  direccion: string;
  telefono: string;
  whatsapp: string;
  horario: string;
  /** Horario por tramos, uno por línea. */
  horarios: string[];
  mapaUrl: string;
  mapaEmbedUrl: string;
}

// ---- Configuración de las pantallas CRUD genéricas ----
export interface CrudColumn {
  key: string;
  label: string;
  num?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format?: (valor: any, fila: any) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cls?: (fila: any) => string;
}

export interface CrudOption {
  value: string | number;
  label: string;
}

export interface CrudField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'email' | 'password';
  required?: boolean | 'create';
  createOnly?: boolean;
  step?: string;
  min?: number;
  minlength?: number;
  maxlength?: number;
  col?: string;
  help?: string;
  helpOnEdit?: boolean;
  default?: string | number;
  options?: CrudOption[];
  optionsEndpoint?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  optionLabel?: (o: any) => string;
}
