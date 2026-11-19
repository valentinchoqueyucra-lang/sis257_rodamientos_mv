<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import http from '../api/http';
import AnularModal from '../components/AnularModal.vue';
import DocumentoModal from '../components/DocumentoModal.vue';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import { bs, errorMessage, fechaHora } from '../utils/format';
import type { Compra, Documento } from '../types';

const auth = useAuthStore();
const toast = useToast();
const compras = ref<Compra[]>([]);
const loading = ref(false);
const filtro = reactive({ desde: '', hasta: '', estado: '' });
const detalle = ref<Compra | null>(null);
const aAnular = ref<Documento | null>(null);
const anulando = ref(false);

async function cargar(): Promise<void> {
  loading.value = true;
  try {
    const params: Record<string, string> = {};
    if (filtro.desde) params.desde = filtro.desde;
    if (filtro.hasta) params.hasta = filtro.hasta;
    if (filtro.estado !== '') params.estado = filtro.estado;
    compras.value = (await http.get<Compra[]>('/compras', { params })).data;
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    loading.value = false;
  }
}
onMounted(cargar);

const totalVigente = computed(() => compras.value.filter((c) => c.estado).reduce((s, c) => s + c.total, 0));

async function ver(c: Compra): Promise<void> {
  try {
    detalle.value = (await http.get<Compra>(`/compras/${c.id}`)).data;
  } catch (e) {
    toast.error(errorMessage(e));
  }
}

async function anular(motivo: string): Promise<void> {
  if (!aAnular.value) return;
  anulando.value = true;
  try {
    await http.patch(`/compras/${aAnular.value.id}/anular`, { motivo });
    toast.success(`Compra #${aAnular.value.id} anulada y stock descontado`);
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
      <router-link to="/panel/compras/nueva" class="btn btn-sm btn-outline-primary ms-auto"><i class="bi bi-bag-plus"></i> Nueva compra</router-link>
    </div>
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead><tr><th>N°</th><th>Fecha</th><th>Proveedor</th><th>Registró</th><th>Pago</th><th class="num">Total</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="8" class="text-center py-4 text-muted">Cargando…</td></tr>
          <tr v-else-if="!compras.length"><td colspan="8" class="text-center py-4 text-muted">No hay compras registradas</td></tr>
          <tr v-for="c in compras" :key="c.id" :class="{ 'text-muted': !c.estado }">
            <td>#{{ c.id }}</td><td>{{ fechaHora(c.fecha) }}</td><td>{{ c.proveedor?.nombreEmpresa }}</td><td>{{ c.usuario?.nombreCompleto }}</td>
            <td><span class="badge text-bg-secondary">{{ c.pagos?.[0]?.metodoPago }}</span></td>
            <td class="num fw-semibold" :class="{ 'text-decoration-line-through': !c.estado }">{{ bs(c.total) }}</td>
            <td><span class="badge" :class="c.estado ? 'text-bg-success' : 'text-bg-danger'">{{ c.estado ? 'Vigente' : 'Anulada' }}</span></td>
            <td class="text-end"><button class="btn btn-sm btn-outline-primary" @click="ver(c)"><i class="bi bi-eye"></i></button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="px-3 py-2 border-top d-flex justify-content-between small text-muted">
      <span>{{ compras.length }} compras</span><span>Total vigente: <strong class="text-dark">{{ bs(totalVigente) }}</strong></span>
    </div>
  </div>

  <DocumentoModal tipo="compra" :doc="detalle" :can-anular="auth.hasRole('ADMINISTRADOR')" @close="detalle = null" @anular="aAnular = $event" />
  <AnularModal :doc="aAnular" etiqueta="compra" :loading="anulando" @close="aAnular = null" @confirm="anular" />
</template>
