<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import http from '../api/http';
import AppModal from './AppModal.vue';
import { useClickOutside } from '../composables/useClickOutside';
import { useToast } from '../composables/useToast';
import { errorMessage } from '../utils/format';
import type { Proveedor } from '../types';

/**
 * Proveedor de una compra: buscar uno existente o registrar uno nuevo.
 * Uso: <ProveedorSelector v-model="proveedor" />   (null = aún sin elegir)
 */
const modelo = defineModel<Proveedor | null>({ default: null });

const toast = useToast();
const proveedores = ref<Proveedor[]>([]);
const consulta = ref('');
const abierto = ref(false);
const raiz = ref<HTMLElement | null>(null);
useClickOutside(raiz, () => (abierto.value = false));

onMounted(async () => {
  try {
    const { data } = await http.get<Proveedor[]>('/proveedores', { params: { soloActivos: true } });
    proveedores.value = data;
  } catch (e) {
    toast.error(errorMessage(e));
  }
});

const coincidencias = computed(() => {
  const t = consulta.value.trim().toLowerCase();
  if (!t) return proveedores.value.slice(0, 8);
  return proveedores.value.filter((p) => [p.nombreEmpresa, p.nit].some((x) => x.toLowerCase().includes(t))).slice(0, 8);
});

function elegir(p: Proveedor | null): void {
  modelo.value = p;
  consulta.value = '';
  abierto.value = false;
}
const elegirPrimero = (): void => {
  if (coincidencias.value.length) elegir(coincidencias.value[0]);
};
/** Lo usa la pantalla padre para pedir el foco cuando falta elegir proveedor. */
const buscador = ref<HTMLInputElement | null>(null);
defineExpose({
  enfocar: () => {
    abierto.value = true;
    buscador.value?.focus();
  },
});

// ---- Registro rápido ----
const modal = ref(false);
const guardando = ref(false);
const form = reactive({ nombreEmpresa: '', nit: '', telefono: '', direccion: '' });

function abrirNuevo(texto = ''): void {
  abierto.value = false;
  const t = texto.trim();
  Object.assign(form, { nombreEmpresa: '', nit: '', telefono: '', direccion: '' });
  if (/^\d+$/.test(t)) form.nit = t;
  else form.nombreEmpresa = t;
  modal.value = true;
}

const duplicado = computed(() => {
  const nit = form.nit.trim().toUpperCase();
  const nombre = form.nombreEmpresa.trim().toLowerCase();
  return proveedores.value.find(
    (p) => (nit.length >= 3 && p.nit.toUpperCase() === nit) || (nombre.length >= 4 && p.nombreEmpresa.toLowerCase() === nombre),
  );
});

async function guardar(): Promise<void> {
  if (duplicado.value) return;
  guardando.value = true;
  try {
    const { data } = await http.post<Proveedor>('/proveedores', {
      nombreEmpresa: form.nombreEmpresa.trim(),
      nit: form.nit.trim(),
      telefono: form.telefono.trim() || undefined,
      direccion: form.direccion.trim() || undefined,
    });
    proveedores.value.unshift(data);
    modal.value = false;
    elegir(data);
    toast.success('Proveedor registrado y seleccionado');
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
      <label for="proveedor-buscar" class="form-label mb-0">Proveedor <span class="text-danger">*</span></label>
      <button type="button" class="btn btn-sm btn-soft py-0" @click="abrirNuevo()"><i class="bi bi-plus-lg"></i> Nuevo proveedor</button>
    </div>

    <div v-if="modelo" class="sel-card">
      <div class="min-w-0">
        <div class="fw-semibold text-truncate"><span class="sel-dot"></span>{{ modelo.nombreEmpresa }}</div>
        <small class="text-muted">NIT: {{ modelo.nit }}<template v-if="modelo.telefono"> · Tel: {{ modelo.telefono }}</template></small>
      </div>
      <button type="button" class="btn btn-sm btn-link text-secondary" title="Cambiar proveedor" aria-label="Cambiar proveedor" @click="elegir(null)"><i class="bi bi-x-lg"></i></button>
    </div>

    <div v-else class="position-relative">
      <i class="bi bi-search sel-lead" aria-hidden="true"></i>
      <input
        id="proveedor-buscar" ref="buscador" v-model="consulta" class="form-control ps-5" autocomplete="off"
        placeholder="Buscar por nombre o NIT…" role="combobox" :aria-expanded="abierto"
        @focus="abierto = true" @input="abierto = true" @keyup.enter.prevent="elegirPrimero"
      />
    </div>

    <div v-if="abierto && !modelo" class="sel-dropdown" role="listbox">
      <button v-for="p in coincidencias" :key="p.id" type="button" class="sel-option" role="option" @click="elegir(p)">
        <span class="min-w-0">
          <span class="d-block fw-semibold text-truncate">{{ p.nombreEmpresa }}</span>
          <small class="text-muted">NIT: {{ p.nit }}<template v-if="p.direccion"> · {{ p.direccion }}</template></small>
        </span>
        <span class="badge text-bg-success-subtle ms-auto">Existente</span>
      </button>
      <div v-if="!coincidencias.length" class="px-3 py-2 small text-muted">
        {{ consulta.trim() ? `No hay proveedores con «${consulta.trim()}».` : 'Aún no hay proveedores registrados.' }}
      </div>
      <button type="button" class="sel-option sel-option--add" @click="abrirNuevo(consulta)"><i class="bi bi-plus-circle me-2"></i>{{ consulta.trim() ? `Registrar «${consulta.trim()}»` : 'Registrar nuevo proveedor' }}</button>
    </div>
  </div>

  <AppModal :show="modal" title="Registrar nuevo proveedor" size="sm" @close="modal = false">
    <form id="form-proveedor-rapido" @submit.prevent="guardar">
      <div v-if="duplicado" class="alert alert-warning py-2 small">
        <strong>Posible proveedor ya registrado.</strong><br />
        {{ duplicado.nombreEmpresa }} (NIT: {{ duplicado.nit }}).
        <button type="button" class="btn btn-link btn-sm p-0 align-baseline" @click="usarExistente">Usar el proveedor existente</button>
      </div>
      <div class="mb-3">
        <label class="form-label small">Razón social o nombre <span class="text-danger">*</span></label>
        <input v-model="form.nombreEmpresa" class="form-control" required maxlength="150" placeholder="Ej. Importadora Rodamientos del Sur S.R.L." />
      </div>
      <div class="row g-2 mb-3">
        <div class="col-6">
          <label class="form-label small">NIT <span class="text-danger">*</span></label>
          <input v-model="form.nit" class="form-control" required minlength="3" maxlength="30" placeholder="Ej. 1029384021" autocapitalize="characters" />
        </div>
        <div class="col-6">
          <label class="form-label small">Teléfono / WhatsApp</label>
          <input v-model="form.telefono" class="form-control" maxlength="30" inputmode="tel" />
        </div>
      </div>
      <div class="mb-1">
        <label class="form-label small">Ciudad o dirección <span class="text-muted">(opcional)</span></label>
        <input v-model="form.direccion" class="form-control" maxlength="255" placeholder="Ej. Sucre, Av. Hernando Siles" />
      </div>
    </form>
    <template #footer>
      <button class="btn btn-outline-secondary" type="button" @click="modal = false">Cancelar</button>
      <button class="btn btn-primary" type="submit" form="form-proveedor-rapido" :disabled="guardando || !!duplicado">
        <span v-if="guardando" class="spinner-border spinner-border-sm me-1"></span>Guardar y seleccionar
      </button>
    </template>
  </AppModal>
</template>
