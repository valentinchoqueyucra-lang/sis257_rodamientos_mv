<script setup lang="ts">
import { toasts, type ToastType } from './composables/useToast';

const icons: Record<ToastType, string> = {
  success: 'bi-check-circle-fill',
  danger: 'bi-exclamation-octagon-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};
</script>

<template>
  <router-view />
  <div class="rp-toasts">
    <div v-for="t in toasts" :key="t.id" class="alert shadow-sm mb-0 py-2 px-3 d-flex gap-2 align-items-start" :class="`alert-${t.type}`" role="alert">
      <i class="bi mt-1" :class="icons[t.type]"></i>
      <div class="flex-grow-1">{{ t.message }}</div>
    </div>
  </div>
</template>
