<script setup lang="ts">
import CrudView from '../components/CrudView.vue';
import { documentoCliente, nombreCliente, OPCIONES_DOCUMENTO } from '../utils/format';
import type { CrudColumn, CrudField } from '../types';

const columns: CrudColumn[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'apellido', label: 'Apellido' },
  { key: 'ciNit', label: 'Documento', format: (_v, f) => documentoCliente(f) },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'direccion', label: 'Dirección' },
];
const fields: CrudField[] = [
  { key: 'nombre', label: 'Nombre', required: true, maxlength: 100 },
  { key: 'apellido', label: 'Apellido', maxlength: 100 },
  { key: 'tipoDocumento', label: 'Tipo de documento', type: 'select', required: true, default: 'CI', options: OPCIONES_DOCUMENTO },
  { key: 'ciNit', label: 'Número de documento', required: true, maxlength: 30, help: 'Debe ser único. Solo letras, números y guion.' },
  { key: 'telefono', label: 'Teléfono', maxlength: 30 },
  { key: 'direccion', label: 'Dirección', type: 'textarea', maxlength: 255, col: 'col-12' },
];
</script>

<template>
  <CrudView
    endpoint="/clientes" entidad="cliente" :columns="columns" :fields="fields"
    :nombre-fila="(r) => nombreCliente({ nombre: String(r.nombre), apellido: (r.apellido as string | null) ?? null })"
  />
</template>
