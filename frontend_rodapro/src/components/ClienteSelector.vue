<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import http from '../api/http';
import AppModal from './AppModal.vue';
import { useClickOutside } from '../composables/useClickOutside';
import { useToast } from '../composables/useToast';
import { documentoCliente, errorMessage, nombreCliente, TIPOS_DOCUMENTO } from '../utils/format';
import type { Cliente, TipoDocumento } from '../types';

/**
 * Cliente de una venta: buscar uno existente, registrar uno nuevo o dejarlo sin cliente (venta al paso).
 * Uso: <ClienteSelector v-model="cliente" />   (null = sin cliente)
 */
const modelo = defineModel<Cliente | null>({ default: null });

const toast = useToast();
const clientes = ref<Cliente[]>([]);
const consulta = ref('');
const abierto = ref(false);
const raiz = ref<HTMLElement | null>(null);
useClickOutside(raiz, () => (abierto.value = false));

onMounted(async () => {
  try {
    const { data } = await http.get<Cliente[]>('/clientes', { params: { soloActivos: true } });
    clientes.value = data;
  } catch (e) {
    toast.error(errorMessage(e));
  }
});

const coincidencias = computed(() => {
  const t = consulta.value.trim().toLowerCase();
  if (!t) return clientes.value.slice(0, 8);
  return clientes.value
    .filter((c) => [nombreCliente(c), c.ciNit, c.telefono].some((x) => (x ?? '').toLowerCase().includes(t)))
    .slice(0, 8);
});

function elegir(c: Cliente | null): void {
  modelo.value = c;
  consulta.value = '';
  abierto.value = false;
}
const elegirPrimero = (): void => {
  if (coincidencias.value.length) elegir(coincidencias.value[0]);
};

// ---- Registro rápido ----
const modal = ref(false);
const guardando = ref(false);
const form = reactive({ nombre: '', apellido: '', tipoDocumento: 'CI' as TipoDocumento, ciNit: '', telefono: '' });
const tipoActual = computed(() => TIPOS_DOCUMENTO.find((t) => t.value === form.tipoDocumento) ?? TIPOS_DOCUMENTO[0]);

function abrirNuevo(texto = ''): void {
  abierto.value = false;
  const t = texto.trim();
  Object.assign(form, { nombre: '', apellido: '', tipoDocumento: 'CI', ciNit: '', telefono: '' });
  if (/^\d+$/.test(t)) form.ciNit = t; // solo números: lo más probable es un CI o NIT
  else form.nombre = t;
  modal.value = true;
}

const duplicado = computed(() => {
  const doc = form.ciNit.trim().toUpperCase();
  return clientes.value.find((c) => doc.length >= 3 && c.ciNit.toUpperCase() === doc);
});

async function guardar(): Promise<void> {
  if (duplicado.value) return;
  guardando.value = true;
  try {
    const { data } = await http.post<Cliente>('/clientes', {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim() || undefined,
      tipoDocumento: form.tipoDocumento,
      ciNit: form.ciNit.trim(),
      telefono: form.telefono.trim() || undefined,
    });
    clientes.value.unshift(data);
    modal.value = false;
    elegir(data);
    toast.success('Cliente registrado y asignado');
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    guardando.value = false;
  }
}
function usarExistente(): void {
  if (!duplicado.value) return;
  modal.value = false;
  elegir(duplicado.value);
}
</script>

<template>
  <div ref="raiz" class="position-relative" @keyup.esc="abierto = false">
    <div class="d-flex align-items-center justify-content-between mb-1">
      <label for="cliente-buscar" class="form-label small mb-0">Cliente <span class="text-muted">(opcional)</span></label>
      <button type="button" class="btn btn-sm btn-soft py-0" @click="abrirNuevo()"><i class="bi bi-plus-lg"></i> Nuevo</button>
    </div>

    <!-- Cliente elegido -->
    <div v-if="modelo" class="sel-card">
      <div class="min-w-0">
        <div class="fw-semibold text-truncate">{{ nombreCliente(modelo) }}</div>
        <small class="text-muted">{{ documentoCliente(modelo) }}<template v-if="modelo.telefono"> · {{ modelo.telefono }}</template></small>
      </div>
      <button type="button" class="btn btn-sm btn-link text-secondary" title="Volver a «Sin cliente»" aria-label="Quitar cliente" @click="elegir(null)"><i class="bi bi-x-lg"></i></button>
    </div>

    <!-- Buscador -->
    <div v-else class="position-relative">
      <input
        id="cliente-buscar" v-model="consulta" class="form-control form-control-sm" autocomplete="off"
        placeholder="Sin cliente (venta al paso)… escriba para buscar" role="combobox" :aria-expanded="abierto"
        @focus="abierto = true" @input="abierto = true" @keyup.enter.prevent="elegirPrimero"
      />
      <i class="bi bi-chevron-expand sel-caret" aria-hidden="true"></i>
    </div>

    <div v-if="abierto && !modelo" class="sel-dropdown" role="listbox">
      <button type="button" class="sel-option sel-option--muted" @click="elegir(null)"><i class="bi bi-person-dash me-2"></i>Sin cliente (venta al paso)<span class="badge text-bg-light ms-auto">Actual</span></button>
      <button v-for="c in coincidencias" :key="c.id" type="button" class="sel-option" role="option" @click="elegir(c)">
        <span class="min-w-0">
          <span class="d-block fw-semibold text-truncate">{{ nombreCliente(c) }}</span>
          <small class="text-muted">{{ documentoCliente(c) }}<template v-if="c.telefono"> · {{ c.telefono }}</template></small>
        </span>
      </button>
      <div v-if="consulta.trim() && !coincidencias.length" class="px-3 py-2 small text-muted">No hay clientes con «{{ consulta.trim() }}».</div>
      <button type="button" class="sel-option sel-option--add" @click="abrirNuevo(consulta)"><i class="bi bi-person-plus me-2"></i>{{ consulta.trim() ? `Registrar «${consulta.trim()}»` : 'Registrar nuevo cliente' }}</button>
    </div>
  </div>

  <AppModal :show="modal" title="Registrar nuevo cliente" size="sm" @close="modal = false">
    <form id="form-cliente-rapido" @submit.prevent="guardar">
      <div v-if="duplicado" class="alert alert-warning py-2 small">
        <strong>Este documento ya está registrado.</strong><br />
        {{ nombreCliente(duplicado) }} ({{ documentoCliente(duplicado) }}).
        <button type="button" class="btn btn-link btn-sm p-0 align-baseline" @click="usarExistente">Seleccionar este cliente</button>
      </div>
      <div class="mb-3">
        <label class="form-label small">Nombre o razón social <span class="text-danger">*</span></label>
        <input v-model="form.nombre" class="form-control" required maxlength="100" placeholder="Ej. Carlos / Taller Mecánico Sucre" />
      </div>
      <div class="mb-3">
        <label class="form-label small">Apellido <span class="text-muted">(opcional)</span></label>
        <input v-model="form.apellido" class="form-control" maxlength="100" />
      </div>
      <div class="row g-2 mb-3">
        <div class="col-12">
          <label class="form-label small">Tipo de documento <span class="text-danger">*</span></label>
          <div class="btn-group w-100 flex-wrap" role="group" aria-label="Tipo de documento">
            <template v-for="t in TIPOS_DOCUMENTO" :key="t.value">
              <input :id="`td-${t.value}`" v-model="form.tipoDocumento" type="radio" class="btn-check" :value="t.value" />
              <label class="btn btn-outline-primary btn-sm" :for="`td-${t.value}`">{{ t.corto }}</label>
            </template>
          </div>
        </div>
        <div class="col-7">
          <label class="form-label small">Número <span class="text-danger">*</span></label>
          <input v-model="form.ciNit" class="form-control" required minlength="3" maxlength="30" :placeholder="tipoActual.placeholder" autocapitalize="characters" />
        </div>
        <div class="col-5">
          <label class="form-label small">Celular / WhatsApp</label>
          <input v-model="form.telefono" class="form-control" maxlength="30" inputmode="tel" />
        </div>
        <div v-if="form.tipoDocumento === 'CARNET_EXTRANJERO'" class="col-12 form-text mt-0">Escriba el número tal como figura en el carnet de extranjero (letras, números y guion).</div>
      </div>
    </form>
    <template #footer>
      <button class="btn btn-outline-secondary" type="button" @click="modal = false">Cancelar</button>
      <button class="btn btn-primary" type="submit" form="form-cliente-rapido" :disabled="guardando || !!duplicado">
        <span v-if="guardando" class="spinner-border spinner-border-sm me-1"></span>Guardar y asignar
      </button>
    </template>
  </AppModal>
</template>
