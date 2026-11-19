<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    show: boolean;
    title?: string;
    size?: '' | 'sm' | 'lg' | 'xl';
  }>(),
  { title: '', size: '' },
);
const emit = defineEmits<{ (e: 'close'): void }>();

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close');
};
watch(
  () => props.show,
  (v) => {
    document.body.classList.toggle('modal-open', v);
    if (v) document.addEventListener('keydown', onKey);
    else document.removeEventListener('keydown', onKey);
  },
);
onBeforeUnmount(() => {
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', onKey);
});
</script>

<template>
  <teleport to="body">
    <div v-if="show">
      <div class="modal-backdrop fade show"></div>
      <div class="modal fade show d-block" tabindex="-1" role="dialog" @mousedown.self="emit('close')">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" :class="size && `modal-${size}`">
          <div class="modal-content border-0 shadow">
            <div class="modal-header">
              <h5 class="modal-title">{{ title }}</h5>
              <button type="button" class="btn-close" aria-label="Cerrar" @click="emit('close')"></button>
            </div>
            <div class="modal-body"><slot /></div>
            <div v-if="$slots.footer" class="modal-footer"><slot name="footer" /></div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>
