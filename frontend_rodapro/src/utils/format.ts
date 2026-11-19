import type { Cliente, CrudOption, TipoDocumento } from '../types';

const nf = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TZ = 'America/La_Paz';

export const num = (n: number | null | undefined): string => nf.format(Number(n ?? 0));
export const bs = (n: number | null | undefined): string => `Bs ${nf.format(Number(n ?? 0))}`;
export const round2 = (n: number): number => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const fechaHora = (d?: string | Date | null): string =>
  d ? new Date(d).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short', timeZone: TZ }) : '';
export const fecha = (d?: string | Date | null): string =>
  d ? new Date(d).toLocaleDateString('es-BO', { dateStyle: 'short', timeZone: TZ }) : '';

/** Fecha de hoy en Bolivia como YYYY-MM-DD (para inputs type="date"). */
export const hoyISO = (): string => new Date().toLocaleDateString('en-CA', { timeZone: TZ });

interface ErrorConRespuesta {
  response?: { data?: { message?: string | string[] } };
  code?: string;
  message?: string;
}

export function errorMessage(e: unknown): string {
  const err = e as ErrorConRespuesta;
  const msg = err?.response?.data?.message;
  if (msg) return Array.isArray(msg) ? msg.join(' · ') : msg;
  if (err?.code === 'ERR_NETWORK') return 'No hay conexión con el servidor. ¿Está corriendo el backend?';
  return err?.message || 'Ocurrió un error inesperado';
}

export const getPath = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((o, k) => (o == null ? o : (o as Record<string, unknown>)[k]), obj);

export const nombreCliente = (c?: Pick<Cliente, 'nombre' | 'apellido'> | null): string =>
  c ? [c.nombre, c.apellido].filter(Boolean).join(' ') : 'Sin cliente';

export const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string; corto: string; placeholder: string }[] = [
  { value: 'CI', label: 'Cédula de identidad (CI)', corto: 'CI', placeholder: 'Ej. 5648912' },
  { value: 'NIT', label: 'NIT', corto: 'NIT', placeholder: 'Ej. 1029384015' },
  { value: 'CARNET_EXTRANJERO', label: 'Carnet de extranjero', corto: 'C. Ext.', placeholder: 'Ej. E-8841237' },
  { value: 'PASAPORTE', label: 'Pasaporte', corto: 'Pasaporte', placeholder: 'Ej. AB123456' },
];
export const OPCIONES_DOCUMENTO: CrudOption[] = TIPOS_DOCUMENTO.map((t) => ({ value: t.value, label: t.label }));

/** "CI 4567890", "C. Ext. E-8841237"… */
export const documentoCliente = (c?: Pick<Cliente, 'tipoDocumento' | 'ciNit'> | null): string => {
  if (!c) return '';
  const tipo = TIPOS_DOCUMENTO.find((t) => t.value === c.tipoDocumento)?.corto ?? 'CI';
  return `${tipo} ${c.ciNit}`;
};
