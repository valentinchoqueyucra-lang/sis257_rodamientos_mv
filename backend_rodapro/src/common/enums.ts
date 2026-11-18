export enum Rol {
  ADMINISTRADOR = 'ADMINISTRADOR',
  VENDEDOR = 'VENDEDOR',
  ALMACENERO = 'ALMACENERO',
}

export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  QR = 'QR',
}

/** Sentido del movimiento sobre el stock. */
export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
}

/** Documento u operación que originó el movimiento de inventario. */
export enum ReferenciaTipo {
  VENTA = 'VENTA',
  COMPRA = 'COMPRA',
  ANULACION_VENTA = 'ANULACION_VENTA',
  ANULACION_COMPRA = 'ANULACION_COMPRA',
  AJUSTE = 'AJUSTE',
  STOCK_INICIAL = 'STOCK_INICIAL',
}

/** Documento de identidad con el que se registra un cliente. */
export enum TipoDocumento {
  CI = 'CI',
  NIT = 'NIT',
  CARNET_EXTRANJERO = 'CARNET_EXTRANJERO',
  PASAPORTE = 'PASAPORTE',
}