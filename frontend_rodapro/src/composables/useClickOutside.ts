import { onBeforeUnmount, onMounted, type Ref } from 'vue';

/** Ejecuta `alCerrar` cuando se hace clic fuera del elemento (útil para listas desplegables). */
export function useClickOutside(elemento: Ref<HTMLElement | null>, alCerrar: () => void): void {
  const detectar = (e: MouseEvent): void => {
    if (elemento.value && !elemento.value.contains(e.target as Node)) alCerrar();
  };
  onMounted(() => document.addEventListener('mousedown', detectar));
  onBeforeUnmount(() => document.removeEventListener('mousedown', detectar));
}
