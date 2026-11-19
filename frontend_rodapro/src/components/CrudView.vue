<script setup lang="ts">
/**
 * Pantalla CRUD genérica para catálogos: tabla con búsqueda y filtro de estado,
 * formulario modal (crear/editar) y desactivar/restaurar (borrado lógico).
 * Se configura con `columns` y `fields` (ver CrudColumn y CrudField en types).
 */
import { computed, onMounted, reactive, ref } from 'vue';
import http from '../api/http';
import AppModal from './AppModal.vue';
import { useToast } from '../composables/useToast';
import { errorMessage, getPath } from '../utils/format';
import type { CrudColumn, CrudField, CrudOption } from '../types';

type Fila = { id: number; estado: boolean } & Record<string, unknown>;
type Valor = string | number | null | undefined;

const props = withDefaults(
  defineProps<{
    endpoint: string;
    entidad?: string;
    columns: CrudColumn[];
    fields: CrudField[];
    canWrite?: boolean;
    nombreFila?: (fila: Fila) => string;
  }>(),
  {
    entidad: 'registro',
    canWrite: true,
    nombreFila: (r: Fila) => String(r.nombre ?? `#${r.id}`),
  },
);

const toast = useToast();
const rows = ref<Fila[]>([]);
const loading = ref(true);
const q = ref('');
const filtroEstado = ref<'activos' | 'inactivos' | 'todos'>('activos');
const options = reactive<Record<string, CrudOption[]>>({});

const showForm = ref(false);
const editingId = ref<number | null>(null);
const form = reactive<Record<string, Valor>>({});
const saving = ref(false);
const target = ref<Fila | null>(null);
const confirmMode = ref<'desactivar' | 'restaurar' | null>(null);

const isEditing = computed(() => editingId.value !== null);
const visibleFields = computed(() => props.fields.filter((f) => !(isEditing.value && f.createOnly)));
const isRequired = (f: CrudField): boolean => f.required === true || (f.required === 'create' && !isEditing.value);

async function load(): Promise<void> {
  loading.value = true;
  try {
    rows.value = (await http.get<Fila[]>(props.endpoint)).data;
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    loading.value = false;
  }
}

async function loadOptions(): Promise<void> {
  for (const f of props.fields) {
    if (f.options) {
      options[f.key] = f.options;
    } else if (f.optionsEndpoint) {
      try {
        const { data } = await http.get<Array<Record<string, unknown> & { id: number }>>(f.optionsEndpoint, {
          params: { soloActivos: true },
        });
        options[f.key] = data.map((o) => ({ value: o.id, label: f.optionLabel ? f.optionLabel(o) : String(o.nombre) }));
      } catch (e) {
        toast.error(errorMessage(e));
      }
    }
  }
}

onMounted(() => {
  void load();
  void loadOptions();
});

const filtered = computed(() => {
  const t = q.value.trim().toLowerCase();
  return rows.value.filter((r) => {
    if (filtroEstado.value === 'activos' && !r.estado) return false;
    if (filtroEstado.value === 'inactivos' && r.estado) return false;
    if (!t) return true;
    return props.columns.some((c) => String(getPath(r, c.key) ?? '').toLowerCase().includes(t));
  });
});

function openCreate(): void {
  editingId.value = null;
  for (const k of Object.keys(form)) delete form[k];
  for (const f of props.fields) form[f.key] = f.default ?? '';
  showForm.value = true;
}

function openEdit(row: Fila): void {
  editingId.value = row.id;
  for (const f of props.fields) form[f.key] = f.type === 'password' ? '' : ((row[f.key] as Valor) ?? '');
  showForm.value = true;
}

const esNumerico = (f: CrudField): boolean =>
  f.type === 'number' || (f.type === 'select' && !!options[f.key]?.length && options[f.key].every((o) => typeof o.value === 'number'));

function buildPayload(): Record<string, string | number | null> {
  const payload: Record<string, string | number | null> = {};
  for (const f of visibleFields.value) {
    let v: Valor = form[f.key];
    if (esNumerico(f)) {
      v = v === '' || v === null || v === undefined ? undefined : Number(v);
    } else if (typeof v === 'string') {
      v = v.trim();
      if (v === '') v = f.type === 'password' ? undefined : isEditing.value ? null : undefined;
    }
    if (v !== undefined) payload[f.key] = v;
  }
  return payload;
}

async function save(): Promise<void> {
  saving.value = true;
  try {
    const payload = buildPayload();
    if (editingId.value !== null) await http.put(`${props.endpoint}/${editingId.value}`, payload);
    else await http.post(props.endpoint, payload);
    toast.success(`${props.entidad} ${isEditing.value ? 'actualizado/a' : 'creado/a'} correctamente`);
    showForm.value = false;
    await load();
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    saving.value = false;
  }
}

function ask(row: Fila, mode: 'desactivar' | 'restaurar'): void {
  target.value = row;
  confirmMode.value = mode;
}

async function confirm(): Promise<void> {
  const row = target.value;
  if (!row) return;
  try {
    if (confirmMode.value === 'desactivar') await http.delete(`${props.endpoint}/${row.id}`);
    else await http.patch(`${props.endpoint}/${row.id}/restaurar`);
    toast.success(`${props.entidad} ${confirmMode.value === 'desactivar' ? 'desactivado/a' : 'restaurado/a'}`);
    await load();
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    confirmMode.value = null;
  }
}

const celda = (c: CrudColumn, r: Fila): string => {
  const v = getPath(r, c.key);
  return c.format ? c.format(v, r) : String(v ?? '—');
};
</script>

<template>
  <div class="rp-card">
    <div class="p-3 d-flex flex-wrap gap-2 align-items-center border-bottom">
      <div class="input-group" style="max-width: 320px">
        <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
        <input v-model="q" class="form-control" placeholder="Buscar…" />
      </div>
      <select v-model="filtroEstado" class="form-select" style="max-width: 170px">
        <option value="activos">Solo activos</option>
        <option value="inactivos">Solo inactivos</option>
        <option value="todos">Todos</option>
      </select>
      <button v-if="canWrite" class="btn btn-primary ms-auto" @click="openCreate">
        <i class="bi bi-plus-lg"></i> Nuevo/a {{ entidad }}
      </button>
    </div>

    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr>
            <th style="width: 60px">#</th>
            <th v-for="c in columns" :key="c.key" :class="{ num: c.num }">{{ c.label }}</th>
            <th>Estado</th>
            <th v-if="canWrite" class="text-end">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td :colspan="columns.length + 3" class="text-center py-4 text-muted">Cargando…</td></tr>
          <tr v-else-if="!filtered.length"><td :colspan="columns.length + 3" class="text-center py-4 text-muted">Sin resultados</td></tr>
          <tr v-for="r in filtered" :key="r.id" :class="{ 'table-light text-muted': !r.estado }">
            <td class="text-muted">{{ r.id }}</td>
            <td v-for="c in columns" :key="c.key" :class="[{ num: c.num }, c.cls ? c.cls(r) : '']">{{ celda(c, r) }}</td>
            <td><span class="badge" :class="r.estado ? 'text-bg-success' : 'text-bg-secondary'">{{ r.estado ? 'Activo' : 'Inactivo' }}</span></td>
            <td v-if="canWrite" class="text-end text-nowrap">
              <button class="btn btn-sm btn-outline-primary me-1" title="Editar" @click="openEdit(r)"><i class="bi bi-pencil"></i></button>
              <button v-if="r.estado" class="btn btn-sm btn-outline-danger" title="Desactivar" @click="ask(r, 'desactivar')"><i class="bi bi-slash-circle"></i></button>
              <button v-else class="btn btn-sm btn-outline-success" title="Restaurar" @click="ask(r, 'restaurar')"><i class="bi bi-arrow-counterclockwise"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="px-3 py-2 border-top text-muted small">{{ filtered.length }} de {{ rows.length }} registros</div>
  </div>

  <AppModal :show="showForm" :title="(isEditing ? 'Editar ' : 'Nuevo/a ') + entidad" size="lg" @close="showForm = false">
    <form id="crud-form" class="row g-3" @submit.prevent="save">
      <div v-for="f in visibleFields" :key="f.key" :class="f.col || 'col-md-6'">
        <label class="form-label">{{ f.label }} <span v-if="isRequired(f)" class="text-danger">*</span></label>
        <textarea v-if="f.type === 'textarea'" v-model="form[f.key]" class="form-control" rows="2" :maxlength="f.maxlength" :required="isRequired(f)"></textarea>
        <select v-else-if="f.type === 'select'" v-model="form[f.key]" class="form-select" :required="isRequired(f)">
          <option value="" disabled>Seleccione…</option>
          <option v-for="o in options[f.key] || []" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <input v-else v-model="form[f.key]" :type="f.type || 'text'" class="form-control" :required="isRequired(f)"
          :maxlength="f.maxlength" :min="f.min" :step="f.step" :minlength="f.minlength"
          :autocomplete="f.type === 'password' ? 'new-password' : 'off'" />
        <div v-if="f.help && (!f.helpOnEdit || isEditing)" class="form-text">{{ f.help }}</div>
      </div>
    </form>
    <template #footer>
      <button class="btn btn-light" @click="showForm = false">Cancelar</button>
      <button class="btn btn-primary" form="crud-form" :disabled="saving">
        <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>Guardar
      </button>
    </template>
  </AppModal>

  <AppModal :show="!!confirmMode" :title="confirmMode === 'desactivar' ? 'Desactivar' : 'Restaurar'" size="sm" @close="confirmMode = null">
    <p v-if="target" class="mb-0">
      ¿{{ confirmMode === 'desactivar' ? 'Desactivar' : 'Restaurar' }} <strong>{{ nombreFila(target) }}</strong>?
      <span v-if="confirmMode === 'desactivar'" class="d-block text-muted small mt-1">No se elimina: podrá restaurarlo después.</span>
    </p>
    <template #footer>
      <button class="btn btn-light" @click="confirmMode = null">Cancelar</button>
      <button class="btn" :class="confirmMode === 'desactivar' ? 'btn-danger' : 'btn-success'" @click="confirm">Confirmar</button>
    </template>
  </AppModal>
</template>
