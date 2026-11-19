
import { ref } from 'vue';
import http from '../api/http';
import type { TiendaInfo } from '../types';

const tienda = ref<TiendaInfo | null>(null);
let pendiente: Promise<void> | null = null;

/** Datos de contacto de la tienda, compartidos entre componentes. */
export function useTienda() {
  if (!tienda.value && !pendiente) {
    pendiente = http
      .get<TiendaInfo>('/catalogo/tienda')
      .then((r) => {
        tienda.value = r.data;
        console.log('Datos de la tienda:', r.data);
      })
      .catch((error) => {
        console.error('Error al cargar los datos de la tienda:', error);
      })
      .finally(() => {
        pendiente = null;
      });
  }

  return tienda;
}
