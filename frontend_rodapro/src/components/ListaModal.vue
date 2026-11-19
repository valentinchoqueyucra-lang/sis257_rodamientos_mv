<script setup lang="ts">
import { computed, ref } from 'vue';
import AppModal from './AppModal.vue';
import { useListaStore } from '../stores/lista';
import { useTienda } from '../composables/useTienda';
import { useToast } from '../composables/useToast';
import { bs } from '../utils/format';

const lista = useListaStore();
const tienda = useTienda();
const toast = useToast();
const nombre = ref('');

const mensaje = computed(() => lista.mensaje(tienda.value, nombre.value));
const whatsappUrl = computed(() => {
  const numero = (tienda.value?.whatsapp ?? '').replace(/\D/g, '');
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(mensaje.value)}` : '';
});

async function copiar(): Promise<void> {
  try {
    await navigator.clipboard.writeText(mensaje.value);
    toast.success('Lista copiada. Puede pegarla en un mensaje.');
  } catch {
    toast.error('No se pudo copiar automáticamente.');
  }
}

function vaciar(): void {
  lista.vaciar();
  lista.abierta = false;
}
</script>

<template>
  <AppModal :show="lista.abierta" title="Mi lista de consulta" size="lg" @close="lista.abierta = false">
    <div v-if="!lista.items.length" class="text-center text-muted py-4">
      <i class="bi bi-list-check fs-1 d-block mb-2"></i>
      Aún no agregó productos. Use el botón «Agregar a mi lista» en el catálogo.
    </div>

    <template v-else>
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Producto</th><th class="num">Precio</th><th style="width: 130px">Cantidad</th><th class="num">Subtotal</th><th></th></tr></thead>
          <tbody>
            <tr v-for="i in lista.items" :key="i.producto.id">
              <td>
                <div class="fw-semibold">{{ i.producto.nombre }}</div>
                <small class="text-muted">{{ i.producto.codigo }}<span v-if="i.producto.marca"> · {{ i.producto.marca }}</span></small>
              </td>
              <td class="num">{{ bs(i.producto.precioVenta) }}</td>
              <td>
                <div class="input-group input-group-sm">
                  <button class="btn btn-outline-secondary" aria-label="Disminuir" @click="lista.cambiarCantidad(i.producto.id, i.cantidad - 1)"><i class="bi bi-dash"></i></button>
                  <input :value="i.cantidad" type="number" min="1" max="99" class="form-control text-center" @change="lista.cambiarCantidad(i.producto.id, Number(($event.target as HTMLInputElement).value))" />
                  <button class="btn btn-outline-secondary" aria-label="Aumentar" @click="lista.cambiarCantidad(i.producto.id, i.cantidad + 1)"><i class="bi bi-plus"></i></button>
                </div>
              </td>
              <td class="num fw-semibold">{{ bs(i.cantidad * i.producto.precioVenta) }}</td>
              <td><button class="btn btn-sm btn-outline-danger" aria-label="Quitar" @click="lista.quitar(i.producto.id)"><i class="bi bi-trash"></i></button></td>
            </tr>
          </tbody>
          <tfoot><tr class="fw-bold fs-5"><td colspan="3" class="num">Total estimado</td><td class="num">{{ bs(lista.totalEstimado) }}</td><td></td></tr></tfoot>
        </table>
      </div>

      <div class="mb-3">
        <label class="form-label">Su nombre (opcional)</label>
        <input v-model="nombre" class="form-control" maxlength="80" placeholder="Para que la tienda sepa con quién hablar" />
      </div>

      <div class="alert alert-info py-2 small mb-0">
        <i class="bi bi-info-circle me-1"></i>
        Esta lista <strong>no reserva</strong> los productos ni es una compra. La tienda confirmará disponibilidad y precio final
        cuando la reciba.
      </div>
    </template>

    <template v-if="lista.items.length" #footer>
      <button class="btn btn-link text-danger me-auto" @click="vaciar">Vaciar lista</button>
      <button class="btn btn-outline-secondary" @click="copiar"><i class="bi bi-clipboard"></i> Copiar</button>
      <a v-if="whatsappUrl" :href="whatsappUrl" target="_blank" rel="noopener" class="btn btn-success"><i class="bi bi-whatsapp"></i> Enviar por WhatsApp</a>
    </template>
  </AppModal>
</template>
