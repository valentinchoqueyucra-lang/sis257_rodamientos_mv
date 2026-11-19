/// <reference types="vite/client" />
import type { Rol } from './types';

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    /** Ruta accesible sin sesión. */
    public?: boolean;
    /** Roles autorizados (sin definir = cualquier usuario autenticado). */
    roles?: Rol[];
  }
}
