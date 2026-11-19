<script setup lang="ts">
import CrudView from '../components/CrudView.vue';
import { useAuthStore } from '../stores/auth';
import type { CrudColumn, CrudField } from '../types';

const auth = useAuthStore();
const columns: CrudColumn[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'descripcion', label: 'Descripción' },
];
const fields: CrudField[] = [
  { key: 'nombre', label: 'Nombre', required: true, maxlength: 100, col: 'col-12' },
  { key: 'descripcion', label: 'Descripción', type: 'textarea', maxlength: 255, col: 'col-12' },
];
</script>

<template>
  <CrudView endpoint="/categorias" entidad="categoría" :columns="columns" :fields="fields" :can-write="auth.hasRole('ADMINISTRADOR', 'ALMACENERO')" />
</template>
