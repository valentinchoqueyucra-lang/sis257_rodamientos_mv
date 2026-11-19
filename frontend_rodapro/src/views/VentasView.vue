<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import http from '../api/http';
import AnularModal from '../components/AnularModal.vue';
import DocumentoModal from '../components/DocumentoModal.vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import { bs, errorMessage, fechaHora, hoyISO, nombreCliente } from '../utils/format';
import type { Documento, Venta } from '../types';

const auth = useAuthStore();
const toast = useToast();
const ventas = ref<Venta[]>([]);
const loading = ref(false);
const filtro = reactive({ desde: hoyISO(), hasta: hoyISO(), estado: '' });
const detalle = ref<Venta | null>(null);
const aAnular = ref<Documento | null>(null);
const anulando = ref(false);

async function cargar(): Promise<void> {
  loading.value = true;
  try {
    const params: Record<string, string> = {};
    if (filtro.desde) params.desde = filtro.desde;
    if (filtro.hasta) params.hasta = filtro.hasta;
    if (filtro.estado !== '') params.estado = filtro.estado;
    ventas.value = (await http.get<Venta[]>('/ventas', { params })).data;
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    loading.value = false;
  }
}
onMounted(cargar);

const totalVigente = computed(() => ventas.value.filter((v) => v.estado).reduce((s, v) => s + v.total, 0));

async function ver(v: Venta): Promise<void> {
  try {
    detalle.value = (await http.get<Venta>(`/ventas/${v.id}`)).data;
  } catch (e) {
    toast.error(errorMessage(e));
  }
}

async function anular(motivo: string): Promise<void> {
  if (!aAnular.value) return;
  anulando.value = true;
  try {
    await http.patch(`/ventas/${aAnular.value.id}/anular`, { motivo });
    toast.success(`Venta #${aAnular.value.id} anulada y stock restituido`);
    aAnular.value = null;
    detalle.value = null;
    await cargar();
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    anulando.value = false;
  }
}
</script>

<template>
  <div class="rp-card">
    <div class="p-3 d-flex flex-wrap gap-2 align-items-end border-bottom">
      <div><label class="form-label small mb-1">Desde</label><input v-model="filtro.desde" type="date" class="form-control form-control-sm" /></div>
      <div><label class="form-label small mb-1">Hasta</label><input v-model="filtro.hasta" type="date" class="form-control form-control-sm" /></div>
      <div>
        <label class="form-label small mb-1">Estado</label>
        <select v-model="filtro.estado" class="form-select form-select-sm">
          <option value="">Todas</option><option value="true">Vigentes</option><option value="false">Anuladas</option>
        </select>
      </div>
      <button class="btn btn-sm btn-primary" @click="cargar"><i class="bi bi-funnel"></i> Filtrar</button>
      <router-link to="/panel/ventas/nueva" class="btn btn-sm btn-outline-primary ms-auto"><i class="bi bi-cart-plus"></i> Nueva venta</router-link>
    </div>
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead><tr><th>N°</th><th>Fecha</th><th>Cliente</th><th>Vendedor</th><th>Pago</th><th class="num">Descuento</th><th class="num">Total</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="9" class="text-center py-4 text-muted">Cargando…</td></tr>
          <tr v-else-if="!ventas.length"><td colspan="9" class="text-center py-4 text-muted">No hay ventas en el rango seleccionado</td></tr>
          <tr v-for="v in ventas" :key="v.id" :class="{ 'text-muted': !v.estado }">
            <td>#{{ v.id }}</td><td>{{ fechaHora(v.fecha) }}</td><td>{{ nombreCliente(v.cliente) }}</td><td>{{ v.usuario?.nombreCompleto }}</td>
            <td><span class="badge text-bg-secondary">{{ v.pagos?.[0]?.metodoPago }}</span></td>
            <td class="num">{{ bs(v.descuento) }}</td>
            <td class="num fw-semibold" :class="{ 'text-decoration-line-through': !v.estado }">{{ bs(v.total) }}</td>
            <td><span class="badge" :class="v.estado ? 'text-bg-success' : 'text-bg-danger'">{{ v.estado ? 'Vigente' : 'Anulada' }}</span></td>
            <td class="text-end"><button class="btn btn-sm btn-outline-primary" @click="ver(v)"><i class="bi bi-eye"></i></button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="px-3 py-2 border-top d-flex justify-content-between small text-muted">
      <span>{{ ventas.length }} ventas</span><span>Total vigente: <strong class="text-dark">{{ bs(totalVigente) }}</strong></span>
    </div>
  </div>

  <DocumentoModal tipo="venta" :doc="detalle" :can-anular="auth.hasRole('ADMINISTRADOR')" @close="detalle = null" @anular="aAnular = $event" />
  <AnularModal :doc="aAnular" etiqueta="venta" :loading="anulando" @close="aAnular = null" @confirm="anular" />
</template>
