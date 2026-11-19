<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import http from '../api/http';
import { useToast } from '../composables/useToast';
import { bs, errorMessage, fechaHora, hoyISO } from '../utils/format';
import type { MetodoPago, Pago } from '../types';

const toast = useToast();
const pagos = ref<Pago[]>([]);
const loading = ref(false);
const filtro = reactive({ tipo: '', metodoPago: '', desde: hoyISO(), hasta: hoyISO() });

async function cargar(): Promise<void> {
  loading.value = true;
  try {
    const params = Object.fromEntries(Object.entries(filtro).filter(([, v]) => v !== ''));
    pagos.value = (await http.get<Pago[]>('/pagos', { params })).data;
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    loading.value = false;
  }
}
onMounted(cargar);

const vigentes = computed(() => pagos.value.filter((p) => p.estado));
const suma = (fn: (p: Pago) => boolean): number => vigentes.value.filter(fn).reduce((s, p) => s + p.monto, 0);
const cobrado = computed(() => suma((p) => p.idVenta !== null));
const pagado = computed(() => suma((p) => p.idCompra !== null));
const porMetodo = (m: MetodoPago): number => suma((p) => p.idVenta !== null && p.metodoPago === m);
</script>

<template>
  <div class="row g-3 mb-3">
    <div class="col-6 col-lg-3"><div class="rp-card rp-stat"><div class="label">Cobrado (ventas)</div><div class="value">{{ bs(cobrado) }}</div></div></div>
    <div class="col-6 col-lg-3"><div class="rp-card rp-stat"><div class="label">Pagado (compras)</div><div class="value">{{ bs(pagado) }}</div></div></div>
    <div class="col-6 col-lg-3"><div class="rp-card rp-stat"><div class="label">Cobros en efectivo</div><div class="value">{{ bs(porMetodo('EFECTIVO')) }}</div></div></div>
    <div class="col-6 col-lg-3"><div class="rp-card rp-stat"><div class="label">Cobros por QR</div><div class="value">{{ bs(porMetodo('QR')) }}</div></div></div>
  </div>

  <div class="rp-card">
    <div class="p-3 d-flex flex-wrap gap-2 align-items-end border-bottom">
      <div><label class="form-label small mb-1">Desde</label><input v-model="filtro.desde" type="date" class="form-control form-control-sm" /></div>
      <div><label class="form-label small mb-1">Hasta</label><input v-model="filtro.hasta" type="date" class="form-control form-control-sm" /></div>
      <div>
        <label class="form-label small mb-1">Tipo</label>
        <select v-model="filtro.tipo" class="form-select form-select-sm"><option value="">Todos</option><option value="VENTA">Cobros de ventas</option><option value="COMPRA">Pagos de compras</option></select>
      </div>
      <div>
        <label class="form-label small mb-1">Método</label>
        <select v-model="filtro.metodoPago" class="form-select form-select-sm"><option value="">Todos</option><option value="EFECTIVO">Efectivo</option><option value="QR">QR</option></select>
      </div>
      <button class="btn btn-sm btn-primary" @click="cargar"><i class="bi bi-funnel"></i> Filtrar</button>
    </div>
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead><tr><th>N°</th><th>Fecha</th><th>Concepto</th><th>Método</th><th>Referencia</th><th>Usuario</th><th class="num">Monto</th><th>Estado</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="8" class="text-center py-4 text-muted">Cargando…</td></tr>
          <tr v-else-if="!pagos.length"><td colspan="8" class="text-center py-4 text-muted">Sin pagos en el rango</td></tr>
          <tr v-for="p in pagos" :key="p.id" :class="{ 'text-muted': !p.estado }">
            <td>#{{ p.id }}</td><td>{{ fechaHora(p.fecha) }}</td>
            <td>{{ p.idVenta ? `Cobro de venta #${p.idVenta}` : `Pago de compra #${p.idCompra}` }}</td>
            <td><span class="badge text-bg-secondary">{{ p.metodoPago }}</span></td>
            <td>{{ p.referencia || '—' }}</td><td>{{ p.usuario?.nombreUsuario }}</td>
            <td class="num fw-semibold" :class="[p.idCompra ? 'text-danger' : 'text-success', { 'text-decoration-line-through': !p.estado }]">{{ p.idCompra ? '−' : '+' }}{{ bs(p.monto) }}</td>
            <td><span class="badge" :class="p.estado ? 'text-bg-success' : 'text-bg-danger'">{{ p.estado ? 'Vigente' : 'Anulado' }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
