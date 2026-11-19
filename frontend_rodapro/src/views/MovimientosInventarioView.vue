<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import http from '../api/http';
import AppModal from '../components/AppModal.vue';
import { useToast } from '../composables/useToast';
import { errorMessage, fechaHora } from '../utils/format';
import type { MovimientoInventario, Producto, ReferenciaTipo, TipoMovimiento } from '../types';

const toast = useToast();
const movimientos = ref<MovimientoInventario[]>([]);
const productos = ref<Producto[]>([]);
const loading = ref(false);
const filtro = reactive<{ idProducto: number | ''; tipoMovimiento: TipoMovimiento | ''; referenciaTipo: ReferenciaTipo | ''; desde: string; hasta: string }>({
  idProducto: '', tipoMovimiento: '', referenciaTipo: '', desde: '', hasta: '',
});

const showAjuste = ref(false);
const guardando = ref(false);
const ajuste = reactive<{ idProducto: number | ''; tipoMovimiento: TipoMovimiento; cantidad: number; observacion: string }>({
  idProducto: '', tipoMovimiento: 'ENTRADA', cantidad: 1, observacion: '',
});

const referencias: ReferenciaTipo[] = ['VENTA', 'COMPRA', 'ANULACION_VENTA', 'ANULACION_COMPRA', 'AJUSTE', 'STOCK_INICIAL'];
const etiqueta = (r: string): string => r.replaceAll('_', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());

async function cargarProductos(): Promise<void> {
  try {
    productos.value = (await http.get<Producto[]>('/productos', { params: { soloActivos: true } })).data;
  } catch (e) {
    toast.error(errorMessage(e));
  }
}

async function cargar(): Promise<void> {
  loading.value = true;
  try {
    const params = Object.fromEntries(Object.entries(filtro).filter(([, v]) => v !== ''));
    movimientos.value = (await http.get<MovimientoInventario[]>('/movimientos-inventario', { params })).data;
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void cargarProductos();
  void cargar();
});

const productoAjuste = computed(() => productos.value.find((p) => p.id === ajuste.idProducto));
const stockResultante = computed(() => {
  const p = productoAjuste.value;
  if (!p) return 0;
  return ajuste.tipoMovimiento === 'ENTRADA' ? p.stock + (ajuste.cantidad || 0) : p.stock - (ajuste.cantidad || 0);
});

function abrirAjuste(): void {
  Object.assign(ajuste, { idProducto: '', tipoMovimiento: 'ENTRADA', cantidad: 1, observacion: '' });
  showAjuste.value = true;
}

async function guardarAjuste(): Promise<void> {
  guardando.value = true;
  try {
    await http.post('/movimientos-inventario/ajuste', { ...ajuste, cantidad: Number(ajuste.cantidad) });
    toast.success('Ajuste registrado');
    showAjuste.value = false;
    await Promise.all([cargar(), cargarProductos()]);
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <div class="rp-card">
    <div class="p-3 d-flex flex-wrap gap-2 align-items-end border-bottom">
      <div style="min-width: 220px">
        <label class="form-label small mb-1">Producto</label>
        <select v-model="filtro.idProducto" class="form-select form-select-sm">
          <option value="">Todos</option>
          <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.codigo }} · {{ p.nombre }}</option>
        </select>
      </div>
      <div>
        <label class="form-label small mb-1">Tipo</label>
        <select v-model="filtro.tipoMovimiento" class="form-select form-select-sm">
          <option value="">Todos</option><option value="ENTRADA">Entradas</option><option value="SALIDA">Salidas</option>
        </select>
      </div>
      <div>
        <label class="form-label small mb-1">Origen</label>
        <select v-model="filtro.referenciaTipo" class="form-select form-select-sm">
          <option value="">Todos</option>
          <option v-for="r in referencias" :key="r" :value="r">{{ etiqueta(r) }}</option>
        </select>
      </div>
      <div><label class="form-label small mb-1">Desde</label><input v-model="filtro.desde" type="date" class="form-control form-control-sm" /></div>
      <div><label class="form-label small mb-1">Hasta</label><input v-model="filtro.hasta" type="date" class="form-control form-control-sm" /></div>
      <button class="btn btn-sm btn-primary" @click="cargar"><i class="bi bi-funnel"></i> Filtrar</button>
      <button class="btn btn-sm btn-outline-primary ms-auto" @click="abrirAjuste"><i class="bi bi-sliders"></i> Ajuste de stock</button>
    </div>
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th class="num">Cantidad</th><th class="num">Stock ant.</th><th class="num">Stock res.</th><th>Origen</th><th>Usuario</th><th>Observación</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="9" class="text-center py-4 text-muted">Cargando…</td></tr>
          <tr v-else-if="!movimientos.length"><td colspan="9" class="text-center py-4 text-muted">Sin movimientos</td></tr>
          <tr v-for="m in movimientos" :key="m.id">
            <td class="text-nowrap">{{ fechaHora(m.fecha) }}</td>
            <td>{{ m.producto?.codigo }} · {{ m.producto?.nombre }}</td>
            <td><span class="badge" :class="m.tipoMovimiento === 'ENTRADA' ? 'text-bg-success' : 'text-bg-warning'">{{ m.tipoMovimiento }}</span></td>
            <td class="num fw-semibold">{{ m.tipoMovimiento === 'ENTRADA' ? '+' : '−' }}{{ m.cantidad }}</td>
            <td class="num">{{ m.stockAnterior }}</td><td class="num">{{ m.stockResultante }}</td>
            <td>{{ etiqueta(m.referenciaTipo) }}<span v-if="m.referenciaTipo !== 'AJUSTE' && m.referenciaTipo !== 'STOCK_INICIAL'" class="text-muted"> #{{ m.referenciaId }}</span></td>
            <td>{{ m.usuario?.nombreUsuario }}</td>
            <td class="small text-muted">{{ m.observacion }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="px-3 py-2 border-top text-muted small">{{ movimientos.length }} movimientos (máx. 500, más recientes primero)</div>
  </div>

  <AppModal :show="showAjuste" title="Ajuste manual de stock" @close="showAjuste = false">
    <form id="form-ajuste" class="row g-3" @submit.prevent="guardarAjuste">
      <div class="col-12">
        <label class="form-label">Producto <span class="text-danger">*</span></label>
        <select v-model="ajuste.idProducto" class="form-select" required>
          <option value="" disabled>Seleccione…</option>
          <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.codigo }} · {{ p.nombre }} (stock {{ p.stock }})</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Tipo</label>
        <select v-model="ajuste.tipoMovimiento" class="form-select"><option value="ENTRADA">Entrada (suma)</option><option value="SALIDA">Salida (resta)</option></select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Cantidad <span class="text-danger">*</span></label>
        <input v-model.number="ajuste.cantidad" type="number" min="1" step="1" class="form-control" required />
      </div>
      <div class="col-12">
        <label class="form-label">Motivo <span class="text-danger">*</span></label>
        <input v-model="ajuste.observacion" class="form-control" minlength="3" maxlength="255" required placeholder="Ej.: merma, producto dañado, conteo físico" />
      </div>
      <div v-if="productoAjuste" class="col-12 small text-muted">
        Stock resultante: <strong :class="{ 'text-danger': stockResultante < 0 }">{{ stockResultante }}</strong>
      </div>
    </form>
    <template #footer>
      <button class="btn btn-light" @click="showAjuste = false">Cancelar</button>
      <button class="btn btn-primary" form="form-ajuste" :disabled="guardando">Registrar ajuste</button>
    </template>
  </AppModal>
</template>
