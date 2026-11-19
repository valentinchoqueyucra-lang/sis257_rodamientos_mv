<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import http from '../api/http';
import AppModal from '../components/AppModal.vue';
import { useListaStore } from '../stores/lista';
import { useToast } from '../composables/useToast';
import { bs, errorMessage } from '../utils/format';
import type { CatalogoCategoria, CatalogoProducto, Disponibilidad, Paginado } from '../types';

const PAGE_SIZE = 24;

const lista = useListaStore();
const toast = useToast();
const route = useRoute();

const categorias = ref<CatalogoCategoria[]>([]);
const items = ref<CatalogoProducto[]>([]);
const total = ref(0);
const page = ref(1);
const cargando = ref(true);
const cargandoMas = ref(false);
const fallo = ref('');

// Filtros iniciales desde la URL (vienen de la landing: /catalogo?q=...&categoria=...)
const q = ref(String(route.query.q ?? ''));
const idCategoria = ref<number | null>(Number(route.query.categoria) || null);
const soloDisponibles = ref(false);

const detalle = ref<CatalogoProducto | null>(null);
const cantidadDetalle = ref(1);

const etiquetas: Record<Disponibilidad, { texto: string; cls: string }> = {
  DISPONIBLE: { texto: 'Disponible', cls: 'text-bg-success' },
  POCO_STOCK: { texto: 'Pocas unidades', cls: 'text-bg-warning' },
  AGOTADO: { texto: 'Agotado', cls: 'text-bg-secondary' },
};

// Evita que una respuesta lenta pise a una más reciente.
let ultimaPeticion = 0;

async function buscar(reiniciar: boolean): Promise<void> {
  const id = ++ultimaPeticion;
  if (reiniciar) {
    page.value = 1;
    cargando.value = true;
  } else {
    cargandoMas.value = true;
  }
  fallo.value = '';
  try {
    const { data } = await http.get<Paginado<CatalogoProducto>>('/catalogo/productos', {
      params: {
        q: q.value.trim() || undefined,
        idCategoria: idCategoria.value ?? undefined,
        soloDisponibles: soloDisponibles.value || undefined,
        page: page.value,
        limit: PAGE_SIZE,
      },
    });
    if (id !== ultimaPeticion) return;
    items.value = reiniciar ? data.items : [...items.value, ...data.items];
    total.value = data.total;
  } catch (e) {
    if (id !== ultimaPeticion) return;
    fallo.value = errorMessage(e);
  } finally {
    if (id === ultimaPeticion) {
      cargando.value = false;
      cargandoMas.value = false;
    }
  }
}

async function verMas(): Promise<void> {
  page.value++;
  await buscar(false);
}

onMounted(async () => {
  void buscar(true);
  try {
    categorias.value = (await http.get<CatalogoCategoria[]>('/catalogo/categorias')).data;
  } catch {
    /* sin categorías el catálogo igual funciona */
  }
});

let timer: ReturnType<typeof setTimeout> | undefined;
watch(q, () => {
  clearTimeout(timer);
  timer = setTimeout(() => void buscar(true), 350);
});
watch([idCategoria, soloDisponibles], () => void buscar(true));

const hayMas = computed(() => items.value.length < total.value);

function agregar(p: CatalogoProducto, cantidad = 1): void {
  lista.agregar(p, cantidad);
  toast.success(`«${p.nombre}» agregado a su lista`);
}

function abrirDetalle(p: CatalogoProducto): void {
  detalle.value = p;
  cantidadDetalle.value = 1;
}

function agregarDesdeDetalle(): void {
  if (!detalle.value) return;
  agregar(detalle.value, Math.min(Math.max(Math.floor(cantidadDetalle.value) || 1, 1), 99));
  detalle.value = null;
}
</script>

<template>
  <section class="lp-hero lp-hero--compact">
    <div class="container">
      <h1 class="lp-h1 lp-h1--sm">Catálogo de repuestos</h1>
      <p class="lp-lead mb-3">Busque por nombre, marca o código, arme su lista y confirme por WhatsApp.</p>
      <form class="lp-order" role="search" @submit.prevent>
        <i class="bi bi-search" aria-hidden="true"></i>
        <input v-model="q" type="search" placeholder="Ej.: pastillas de freno, filtro de aceite, FIL-001" aria-label="Buscar repuestos" />
      </form>
    </div>
  </section>

  <div class="container mt-4">
    <div class="rp-card p-3 mb-3">
      <div class="rp-chips">
        <button class="rp-chip" :class="{ active: idCategoria === null }" @click="idCategoria = null">Todas</button>
        <button v-for="c in categorias" :key="c.id" class="rp-chip" :class="{ active: idCategoria === c.id }" @click="idCategoria = c.id">
          {{ c.nombre }}<small>{{ c.total }}</small>
        </button>
      </div>
      <div class="form-check form-switch mt-2 mb-0">
        <input id="solo-disp" v-model="soloDisponibles" class="form-check-input" type="checkbox" role="switch" />
        <label class="form-check-label" for="solo-disp">Mostrar solo productos disponibles</label>
      </div>
    </div>

    <div v-if="fallo" class="alert alert-danger d-flex align-items-center gap-2">
      <i class="bi bi-exclamation-octagon"></i><span class="flex-grow-1">{{ fallo }}</span>
      <button class="btn btn-sm btn-outline-danger" @click="buscar(true)">Reintentar</button>
    </div>

    <div v-if="cargando" class="text-center text-muted py-5"><span class="spinner-border me-2"></span>Cargando catálogo…</div>

    <div v-else-if="!items.length && !fallo" class="text-center py-5">
      <i class="bi bi-search fs-1 text-muted"></i>
      <p class="mt-2 mb-1 fw-semibold">No encontramos productos con esos filtros.</p>
      <p class="text-muted">Pruebe con otra palabra o escríbanos: podemos conseguirlo.</p>
    </div>

    <template v-else>
      <div class="text-muted small mb-2">{{ total }} producto{{ total === 1 ? '' : 's' }}</div>
      <div class="row g-3">
        <div v-for="p in items" :key="p.id" class="col-6 col-md-4 col-xl-3">
          <article class="rp-product">
            <div class="thumb" aria-hidden="true"><i class="bi bi-gear-wide-connected"></i></div>
            <div class="p-3 d-flex flex-column flex-grow-1">
              <small class="text-muted text-uppercase" style="letter-spacing: .05em">{{ p.categoria.nombre }}</small>
              <div class="name my-1" role="button" tabindex="0" @click="abrirDetalle(p)" @keyup.enter="abrirDetalle(p)">{{ p.nombre }}</div>
              <small class="text-muted mb-2">{{ p.marca || 'Sin marca' }} · {{ p.codigo }}</small>
              <div class="mt-auto">
                <span class="badge mb-2" :class="etiquetas[p.disponibilidad].cls">{{ etiquetas[p.disponibilidad].texto }}</span>
                <div class="price mb-2">{{ bs(p.precioVenta) }} <small class="text-muted fw-normal fs-6">/ {{ p.unidadMedida.toLowerCase() }}</small></div>
                <button class="btn w-100" :class="lista.enLista(p.id) ? 'btn-outline-primary' : 'btn-primary'" :disabled="p.disponibilidad === 'AGOTADO'" @click="agregar(p)">
                  <template v-if="p.disponibilidad === 'AGOTADO'">Agotado</template>
                  <template v-else-if="lista.enLista(p.id)"><i class="bi bi-check2"></i> En su lista ({{ lista.enLista(p.id) }})</template>
                  <template v-else><i class="bi bi-plus-lg"></i> Agregar a mi lista</template>
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div v-if="hayMas" class="text-center mt-4">
        <button class="btn btn-outline-primary px-4" :disabled="cargandoMas" @click="verMas">
          <span v-if="cargandoMas" class="spinner-border spinner-border-sm me-2"></span>Ver más productos
        </button>
      </div>
    </template>
  </div>

  <AppModal :show="!!detalle" :title="detalle?.nombre ?? ''" @close="detalle = null">
    <template v-if="detalle">
      <div class="d-flex flex-wrap gap-2 mb-3">
        <span class="badge text-bg-dark">{{ detalle.categoria.nombre }}</span>
        <span class="badge" :class="etiquetas[detalle.disponibilidad].cls">{{ etiquetas[detalle.disponibilidad].texto }}</span>
      </div>
      <dl class="row mb-3">
        <dt class="col-4 text-muted fw-normal">Código</dt><dd class="col-8">{{ detalle.codigo }}</dd>
        <dt class="col-4 text-muted fw-normal">Marca</dt><dd class="col-8">{{ detalle.marca || '—' }}</dd>
        <dt class="col-4 text-muted fw-normal">Se vende por</dt><dd class="col-8">{{ detalle.unidadMedida.toLowerCase() }}</dd>
        <dt class="col-4 text-muted fw-normal">Detalle</dt><dd class="col-8">{{ detalle.descripcion || 'Consulte por compatibilidad con su vehículo.' }}</dd>
      </dl>
      <div class="display-6 fw-bold mb-3">{{ bs(detalle.precioVenta) }}</div>
      <div class="d-flex gap-2 align-items-center">
        <input v-model.number="cantidadDetalle" type="number" min="1" max="99" class="form-control" style="width: 90px" aria-label="Cantidad" />
        <button class="btn btn-primary flex-grow-1" :disabled="detalle.disponibilidad === 'AGOTADO'" @click="agregarDesdeDetalle">
          <i class="bi bi-plus-lg"></i> Agregar a mi lista
        </button>
      </div>
    </template>
  </AppModal>
</template>
