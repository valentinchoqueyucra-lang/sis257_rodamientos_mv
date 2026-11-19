<script setup lang="ts">
import CrudView from '../components/CrudView.vue';
import type { CrudColumn, CrudField } from '../types';

const columns: CrudColumn[] = [
  { key: 'nombreEmpresa', label: 'Empresa' },
  { key: 'nit', label: 'NIT' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'email', label: 'Email' },
  { key: 'direccion', label: 'Dirección' },
];
const fields: CrudField[] = [
  { key: 'nombreEmpresa', label: 'Nombre de la empresa', required: true, maxlength: 150 },
  { key: 'nit', label: 'NIT', required: true, maxlength: 30, help: 'Debe ser único.' },
  { key: 'telefono', label: 'Teléfono', maxlength: 30 },
  { key: 'email', label: 'Email', type: 'email', maxlength: 120 },
  { key: 'direccion', label: 'Dirección', type: 'textarea', maxlength: 255, col: 'col-12' },
];
</script>

<template>
  <CrudView endpoint="/proveedores" entidad="proveedor" :columns="columns" :fields="fields" :nombre-fila="(r) => String(r.nombreEmpresa)" />
</template>
