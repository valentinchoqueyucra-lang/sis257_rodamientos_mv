import { defineStore } from 'pinia';
import type { CatalogoProducto, TiendaInfo } from '../types';
import { bs } from '../utils/format';

export interface ItemLista {
  producto: CatalogoProducto;
  cantidad: number;
}

const KEY = 'rodapro_lista';
const MAX_CANT = 99;

function leer(): ItemLista[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? (raw as ItemLista[]) : [];
  } catch {
    return [];
  }
}

/** "Mi lista" del cliente: productos de interés para consultar por WhatsApp. No reserva stock. */
export const useListaStore = defineStore('lista', {
  state: () => ({
    items: leer(),
    abierta: false,
  }),
  getters: {
    cantidadTotal: (s): number => s.items.reduce((t, i) => t + i.cantidad, 0),
    totalEstimado: (s): number => s.items.reduce((t, i) => t + i.cantidad * i.producto.precioVenta, 0),
  },
  actions: {
    guardar(): void {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.items));
      } catch {
        /* almacenamiento no disponible: la lista vive solo en memoria */
      }
    },
    agregar(producto: CatalogoProducto, cantidad = 1): void {
      const existente = this.items.find((i) => i.producto.id === producto.id);
      if (existente) existente.cantidad = Math.min(existente.cantidad + cantidad, MAX_CANT);
      else this.items.push({ producto, cantidad: Math.min(cantidad, MAX_CANT) });
      this.guardar();
    },
    cambiarCantidad(id: number, cantidad: number): void {
      const item = this.items.find((i) => i.producto.id === id);
      if (!item) return;
      item.cantidad = Math.min(Math.max(Math.floor(cantidad) || 1, 1), MAX_CANT);
      this.guardar();
    },
    quitar(id: number): void {
      this.items = this.items.filter((i) => i.producto.id !== id);
      this.guardar();
    },
    vaciar(): void {
      this.items = [];
      this.guardar();
    },
    enLista(id: number): number {
      return this.items.find((i) => i.producto.id === id)?.cantidad ?? 0;
    },
    mensaje(tienda: TiendaInfo | null, nombreCliente: string): string {
      const lineas = this.items.map(
        (i) => `• ${i.cantidad} x ${i.producto.nombre} (${i.producto.codigo}) — ${bs(i.producto.precioVenta)} c/u`,
      );
      return [
        `Hola ${tienda?.nombre ?? 'RODAPRO'}, quisiera consultar disponibilidad y precio de estos repuestos:`,
        '',
        ...lineas,
        '',
        `Total estimado: ${bs(this.totalEstimado)}`,
        nombreCliente.trim() ? `Mi nombre: ${nombreCliente.trim()}` : '',
      ]
        .filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== ''))
        .join('\n')
        .trim();
    },
  },
});
