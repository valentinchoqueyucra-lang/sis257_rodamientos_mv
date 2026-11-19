<script setup lang="ts">
import CrudView from '../components/CrudView.vue';
import type { CrudColumn, CrudField, CrudOption } from '../types';

const roles: CrudOption[] = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'VENDEDOR', label: 'Vendedor' },
  { value: 'ALMACENERO', label: 'Almacenero' },
];
const columns: CrudColumn[] = [
  { key: 'nombreCompleto', label: 'Nombre completo' },
  { key: 'nombreUsuario', label: 'Usuario' },
  { key: 'rol', label: 'Rol', format: (v: string) => roles.find((r) => r.value === v)?.label ?? v },
];
const fields: CrudField[] = [
  { key: 'nombreCompleto', label: 'Nombre completo', required: true, maxlength: 120, col: 'col-12' },
  { key: 'nombreUsuario', label: 'Usuario', required: true, minlength: 3, maxlength: 50, help: 'Letras, números, punto, guion y guion bajo.' },
  { key: 'rol', label: 'Rol', type: 'select', required: true, options: roles, default: 'VENDEDOR' },
  { key: 'password', label: 'Contraseña', type: 'password', required: 'create', minlength: 6, maxlength: 72, col: 'col-12', help: 'Dejar vacío para conservar la actual.', helpOnEdit: true },
];
</script>

<template>
  <CrudView endpoint="/usuarios" entidad="usuario" :columns="columns" :fields="fields" :nombre-fila="(r) => String(r.nombreCompleto)" />
</template>
