<script setup lang="ts">
import { ref, watch } from 'vue';
import AppModal from './AppModal.vue';
import type { Documento } from '../types';

const props = defineProps<{
  doc: Documento | null;
  etiqueta: string;
  loading?: boolean;
}>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', motivo: string): void;
}>();

const motivo = ref('');
watch(
  () => props.doc,
  () => {
    motivo.value = '';
  },
);
</script>

<template>
  <AppModal :show="!!doc" :title="`Anular ${etiqueta} #${doc?.id ?? ''}`" size="sm" @close="emit('close')">
    <div class="alert alert-warning py-2 small">
      Se revertirá el stock y se registrará un movimiento inverso en el inventario. Esta acción no se puede deshacer.
    </div>
    <form id="form-anular" @submit.prevent="emit('confirm', motivo.trim())">
      <label class="form-label">Motivo de la anulación <span class="text-danger">*</span></label>
      <textarea v-model="motivo" class="form-control" rows="2" minlength="3" maxlength="255" required></textarea>
    </form>
    <template #footer>
      <button class="btn btn-light" @click="emit('close')">Volver</button>
      <button class="btn btn-danger" form="form-anular" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>Anular
      </button>
    </template>
  </AppModal>
</template>
