import { ref } from 'vue';
import http from '../api/http';
import type { TiendaInfo } from '../types';

const tienda = ref<TiendaInfo | null>(null);
let pendiente: Promise<void> | null = null;

/** Datos de contacto de la tienda (se piden una sola vez y se comparten). */
export function useTienda() {
  if (!tienda.value && !pendiente) {
    pendiente = http
      .get<TiendaInfo>('/catalogo/tienda')
      .then((r) => {
        tienda.value = r.data;
      })
      .catch(() => undefined)
      .finally(() => {
        pendiente = null;
      });
  }
  return tienda;
}
