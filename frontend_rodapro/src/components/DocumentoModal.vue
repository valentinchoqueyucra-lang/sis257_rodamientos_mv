<script setup lang="ts">
import { computed } from 'vue';
import AppModal from './AppModal.vue';
import { bs, fechaHora, nombreCliente } from '../utils/format';
import { imprimirDocumento } from '../utils/print';
import type { Compra, Documento, Venta } from '../types';

const props = defineProps<{
  tipo: 'venta' | 'compra';
  doc: Documento | null;
  canAnular?: boolean;
}>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'anular', doc: Documento): void;
}>();

const esVenta = computed(() => props.tipo === 'venta');
const contraparte = computed(() =>
  esVenta.value ? nombreCliente((props.doc as Venta | null)?.cliente) : (props.doc as Compra | null)?.proveedor?.nombreEmpresa,
);
</script>

<template>
  <AppModal :show="!!doc" :title="`${esVenta ? 'Venta' : 'Compra'} #${doc?.id ?? ''}`" size="lg" @close="emit('close')">
    <template v-if="doc">
      <div class="row g-2 mb-3">
        <div class="col-sm-6"><span class="text-muted">Fecha:</span> {{ fechaHora(doc.fecha) }}</div>
        <div class="col-sm-6"><span class="text-muted">{{ esVenta ? 'Cliente' : 'Proveedor' }}:</span> {{ contraparte }}</div>
        <div class="col-sm-6"><span class="text-muted">Registró:</span> {{ doc.usuario?.nombreCompleto }}</div>
        <div class="col-sm-6">
          <span class="text-muted">Estado:</span>
          <span class="badge ms-1" :class="doc.estado ? 'text-bg-success' : 'text-bg-danger'">{{ doc.estado ? 'Vigente' : 'Anulada' }}</span>
        </div>
        <div v-if="doc.observacion" class="col-12"><span class="text-muted">Observación:</span> {{ doc.observacion }}</div>
        <div v-if="!doc.estado" class="col-12"><div class="alert alert-danger py-2 mb-0"><strong>Motivo de anulación:</strong> {{ doc.motivoAnulacion }}</div></div>
      </div>

      <div class="table-responsive">
        <table class="table table-sm align-middle">
          <thead><tr><th>Producto</th><th class="num">Cant.</th><th class="num">P. unit.</th><th class="num">Desc.</th><th class="num">Subtotal</th></tr></thead>
          <tbody>
            <tr v-for="d in doc.detalles" :key="d.id">
              <td>{{ d.producto?.codigo }} · {{ d.producto?.nombre }}</td>
              <td class="num">{{ d.cantidad }}</td>
              <td class="num">{{ bs(d.precioUnitario) }}</td>
              <td class="num">{{ d.descuento > 0 ? bs(d.descuento) : '—' }}</td>
              <td class="num">{{ bs(d.subtotal) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td colspan="4" class="num">Subtotal</td><td class="num">{{ bs(doc.subtotal) }}</td></tr>
            <tr><td colspan="4" class="num">Descuento</td><td class="num">{{ bs(doc.descuento) }}</td></tr>
            <tr class="fw-bold fs-5"><td colspan="4" class="num">TOTAL</td><td class="num">{{ bs(doc.total) }}</td></tr>
          </tfoot>
        </table>
      </div>

      <div v-if="doc.pagos?.length">
        <div class="text-muted small mb-1">Pagos</div>
        <div v-for="p in doc.pagos" :key="p.id" class="d-flex gap-2 align-items-center">
          <span class="badge text-bg-secondary">{{ p.metodoPago }}</span>
          <span>{{ bs(p.monto) }}</span>
          <span v-if="p.referencia" class="text-muted">· Ref: {{ p.referencia }}</span>
          <span v-if="!p.estado" class="badge text-bg-danger">Anulado</span>
        </div>
      </div>
    </template>
    <template #footer>
      <button class="btn btn-outline-secondary" @click="imprimirDocumento(tipo, doc)"><i class="bi bi-printer"></i> Imprimir</button>
      <button v-if="canAnular && doc?.estado" class="btn btn-outline-danger" @click="doc && emit('anular', doc)"><i class="bi bi-x-octagon"></i> Anular</button>
      <button class="btn btn-light" @click="emit('close')">Cerrar</button>
    </template>
  </AppModal>
</template>
