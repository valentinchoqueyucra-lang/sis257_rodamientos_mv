import { reactive } from 'vue';

export type ToastType = 'success' | 'danger' | 'warning' | 'info';
export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export const toasts = reactive<Toast[]>([]);
let seq = 0;

function push(message: string, type: ToastType, ms: number): void {
  const t: Toast = { id: ++seq, message, type };
  toasts.push(t);
  setTimeout(() => {
    const i = toasts.findIndex((x) => x.id === t.id);
    if (i > -1) toasts.splice(i, 1);
  }, ms);
}

export const useToast = () => ({
  success: (m: string) => push(m, 'success', 3500),
  error: (m: string) => push(m, 'danger', 7000),
  warning: (m: string) => push(m, 'warning', 5000),
  info: (m: string) => push(m, 'info', 4000),
});
