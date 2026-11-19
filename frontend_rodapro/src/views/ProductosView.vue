<script setup lang="ts">
import CrudView from '../components/CrudView.vue';
import { useAuthStore } from '../stores/auth';
import { bs } from '../utils/format';
import type { CrudColumn, CrudField, Producto } from '../types';

const auth = useAuthStore();
const unidades = ['UNIDAD', 'PAR', 'JUEGO', 'KIT', 'LITRO', 'GALÓN', 'METRO', 'CAJA'].map((u) => ({ value: u, label: u }));

const columns: CrudColumn[] = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'categoria.nombre', label: 'Categoría' },
  { key: 'marca', label: 'Marca' },
  { key: 'precioCompra', label: 'P. compra', num: true, format: (v: number) => bs(v) },
  { key: 'precioVenta', label: 'P. venta', num: true, format: (v: number) => bs(v) },
  { key: 'stock', label: 'Stock', num: true, cls: (r: Producto) => (r.stock <= r.stockMinimo ? 'text-danger fw-bold' : '') },
  { key: 'stockMinimo', label: 'Mínimo', num: true },
  { key: 'unidadMedida', label: 'Unidad' },
];
const fields: CrudField[] = [
  { key: 'codigo', label: 'Código', required: true, maxlength: 50, help: 'Debe ser único.' },
  { key: 'idCategoria', label: 'Categoría', type: 'select', required: true, optionsEndpoint: '/categorias' },
  { key: 'nombre', label: 'Nombre', required: true, maxlength: 150, col: 'col-12' },
  { key: 'descripcion', label: 'Descripción', type: 'textarea', maxlength: 255, col: 'col-12' },
  { key: 'marca', label: 'Marca', maxlength: 80 },
  { key: 'unidadMedida', label: 'Unidad de medida', type: 'select', options: unidades, default: 'UNIDAD' },
  { key: 'precioCompra', label: 'Precio de compra (Bs)', type: 'number', required: true, min: 0, step: '0.01' },
  { key: 'precioVenta', label: 'Precio de venta (Bs)', type: 'number', required: true, min: 0, step: '0.01' },
  { key: 'stock', label: 'Stock inicial', type: 'number', min: 0, step: '1', default: 0, createOnly: true, help: 'Luego el stock solo cambia con compras, ventas o ajustes de inventario.' },
  { key: 'stockMinimo', label: 'Stock mínimo', type: 'number', min: 0, step: '1', default: 0, help: 'Se alerta cuando el stock llega a este nivel.' },
];
</script>

<template>
  <CrudView endpoint="/productos" entidad="producto" :columns="columns" :fields="fields" :can-write="auth.hasRole('ADMINISTRADOR', 'ALMACENERO')" />
</template>
