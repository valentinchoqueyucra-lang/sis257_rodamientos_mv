<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import http from '../api/http';
import AppModal from '../components/AppModal.vue';
import ClienteSelector from '../components/ClienteSelector.vue';
import { useToast } from '../composables/useToast';
import { bs, errorMessage, nombreCliente, round2 } from '../utils/format';
import { imprimirDocumento } from '../utils/print';
import type { Cliente, MetodoPago, Producto, Venta } from '../types';

interface LineaCarrito {
  producto: Producto;
  cantidad: number;
  descuento: number;
}

const toast = useToast();
const productos = ref<Producto[]>([]);
const busqueda = ref('');
const buscador = ref<HTMLInputElement | null>(null);

const carrito = ref<LineaCarrito[]>([]);
const cliente = ref<Cliente | null>(null);
const descuentoGlobal = ref<number>(0);
const metodoPago = ref<MetodoPago>('EFECTIVO');
const referencia = ref('');
const observacion = ref('');
const recibido = ref<number | ''>('');
const guardando = ref(false);
const ventaCreada = ref<Venta | null>(null);

async function cargar(): Promise<void> {
  try {
    const { data } = await http.get<Producto[]>('/productos', { params: { soloActivos: true } });
    productos.value = data;
  } catch (e) {
    toast.error(errorMessage(e));
  }
}
onMounted(() => {
  void cargar();
  buscador.value?.focus();
});

const resultados = computed(() => {
  const t = busqueda.value.trim().toLowerCase();
  const lista = t
    ? productos.value.filter((p) => [p.codigo, p.nombre, p.marca, p.categoria?.nombre].some((x) => (x ?? '').toLowerCase().includes(t)))
    : productos.value;
  return lista.slice(0, 40);
});

const enCarrito = (id: number): LineaCarrito | undefined => carrito.value.find((l) => l.producto.id === id);

function agregar(p: Producto): void {
  if (p.stock <= 0) {
    toast.warning(`"${p.nombre}" no tiene stock`);
    return;
  }
  const linea = enCarrito(p.id);
  if (linea) {
    if (linea.cantidad >= p.stock) {
      toast.warning(`Stock máximo de "${p.nombre}": ${p.stock}`);
      return;
    }
    linea.cantidad++;
  } else {
    carrito.value.push({ producto: p, cantidad: 1, descuento: 0 });
  }
}

function agregarConEnter(): void {
  const t = busqueda.value.trim().toLowerCase();
  if (!t) return;
  const exacto = productos.value.find((p) => p.codigo.toLowerCase() === t);
  const elegido = exacto ?? (resultados.value.length === 1 ? resultados.value[0] : undefined);
  if (elegido) {
    agregar(elegido);
    busqueda.value = '';
  }
}

const bruto = (l: LineaCarrito): number => round2(l.producto.precioVenta * l.cantidad);
const subtotalLinea = (l: LineaCarrito): number => round2(bruto(l) - (Number(l.descuento) || 0));

function normalizar(l: LineaCarrito): void {
  l.cantidad = Math.min(Math.max(parseInt(String(l.cantidad)) || 1, 1), l.producto.stock);
  l.descuento = Math.min(Math.max(round2(Number(l.descuento) || 0), 0), bruto(l));
}

const quitar = (i: number): void => {
  carrito.value.splice(i, 1);
};
const subtotal = computed(() => round2(carrito.value.reduce((s, l) => s + subtotalLinea(l), 0)));
const descuentoAplicado = computed(() => Math.min(Math.max(round2(Number(descuentoGlobal.value) || 0), 0), subtotal.value));
const total = computed(() => round2(subtotal.value - descuentoAplicado.value));
const cambio = computed(() => round2((Number(recibido.value) || 0) - total.value));
const unidades = computed(() => carrito.value.reduce((s, l) => s + l.cantidad, 0));
const puedeCobrar = computed(() => carrito.value.length > 0 && !guardando.value);

async function cobrar(): Promise<void> {
  carrito.value.forEach(normalizar);
  if (metodoPago.value === 'EFECTIVO' && recibido.value !== '' && cambio.value < 0) {
    toast.warning('El monto recibido es menor al total');
    return;
  }
  guardando.value = true;
  try {
    const { data } = await http.post<Venta>('/ventas', {
      idCliente: cliente.value?.id ?? null,
      descuento: descuentoAplicado.value,
      metodoPago: metodoPago.value,
      referencia: referencia.value.trim() || undefined,
      observacion: observacion.value.trim() || undefined,
      detalles: carrito.value.map((l) => ({ idProducto: l.producto.id, cantidad: l.cantidad, descuento: Number(l.descuento) || 0 })),
    });
    ventaCreada.value = data;
    toast.success(`Venta #${data.id} registrada`);
    nueva(true);
    await cargar(); // refresca el stock
  } catch (e) {
    toast.error(errorMessage(e));
    await cargar();
  } finally {
    guardando.value = false;
  }
}

function nueva(soloLimpiar = false): void {
  carrito.value = [];
  cliente.value = null;
  descuentoGlobal.value = 0;
  metodoPago.value = 'EFECTIVO';
  referencia.value = '';
  observacion.value = '';
  recibido.value = '';
  busqueda.value = '';
  if (!soloLimpiar) ventaCreada.value = null;
  buscador.value?.focus();
}
</script>

<template>
  <div class="row g-3">
    <!-- Catálogo -->
    <div class="col-xl-6">
      <div class="rp-card">
        <div class="p-3 border-bottom">
          <div class="input-group">
            <span class="input-group-text bg-white"><i class="bi bi-upc-scan"></i></span>
            <input ref="buscador" v-model="busqueda" class="form-control form-control-lg" placeholder="Buscar por código, nombre o marca (Enter para agregar)" @keyup.enter="agregarConEnter" />
          </div>
        </div>
        <div class="pos-results">
          <div v-if="!resultados.length" class="p-4 text-center text-muted">Sin productos</div>
          <div v-for="p in resultados" :key="p.id" class="pos-item d-flex align-items-center gap-3 px-3 py-2 border-bottom" :class="{ disabled: p.stock <= 0 }" @click="agregar(p)">
            <div class="flex-grow-1">
              <div class="fw-semibold">{{ p.nombre }}</div>
              <small class="text-muted">{{ p.codigo }} · {{ p.marca || 'Sin marca' }} · {{ p.categoria?.nombre }}</small>
            </div>
            <div class="text-end">
              <div class="fw-bold">{{ bs(p.precioVenta) }}</div>
              <small :class="p.stock <= p.stockMinimo ? 'text-danger fw-semibold' : 'text-muted'">Stock: {{ p.stock }}</small>
            </div>
            <span v-if="enCarrito(p.id)" class="badge text-bg-primary">{{ enCarrito(p.id)?.cantidad }}</span>
            <i v-else class="bi bi-plus-circle text-primary fs-5"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Carrito -->
    <div class="col-xl-6">
      <div class="rp-card">
        <div class="p-3 border-bottom d-flex align-items-center">
          <h2 class="h6 mb-0"><i class="bi bi-cart3 me-1"></i> Carrito <span class="badge text-bg-secondary">{{ unidades }}</span></h2>
          <button v-if="carrito.length" class="btn btn-sm btn-link text-danger ms-auto" @click="nueva(true)">Vaciar</button>
        </div>

        <div v-if="!carrito.length" class="p-4 text-center text-muted">Agregue productos desde el catálogo.</div>
        <div v-else class="table-responsive">
          <table class="table table-sm align-middle mb-0">
            <thead><tr><th>Producto</th><th class="num">P. unit.</th><th>Cant.</th><th>Desc. (Bs)</th><th class="num">Subtotal</th><th></th></tr></thead>
            <tbody>
              <tr v-for="(l, i) in carrito" :key="l.producto.id">
                <td><div class="fw-semibold">{{ l.producto.nombre }}</div><small class="text-muted">Disp.: {{ l.producto.stock }}</small></td>
                <td class="num">{{ bs(l.producto.precioVenta) }}</td>
                <td><input v-model.number="l.cantidad" type="number" min="1" :max="l.producto.stock" class="form-control form-control-sm pos-qty" @change="normalizar(l)" /></td>
                <td><input v-model.number="l.descuento" type="number" min="0" step="0.01" class="form-control form-control-sm pos-disc" @change="normalizar(l)" /></td>
                <td class="num fw-semibold">{{ bs(subtotalLinea(l)) }}</td>
                <td><button class="btn btn-sm btn-outline-danger" @click="quitar(i)"><i class="bi bi-x-lg"></i></button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-3 border-top">
          <div class="row g-2 mb-3">
            <div class="col-md-7">
              <ClienteSelector v-model="cliente" />
            </div>
            <div class="col-md-5">
              <label class="form-label small mb-1">Descuento general (Bs)</label>
              <input v-model.number="descuentoGlobal" type="number" min="0" step="0.01" class="form-control form-control-sm" />
            </div>
            <div class="col-12">
              <label class="form-label small mb-1 d-block">Método de pago</label>
              <div class="btn-group w-100" role="group">
                <input id="mp-ef" v-model="metodoPago" type="radio" class="btn-check" value="EFECTIVO" />
                <label class="btn btn-outline-primary" for="mp-ef"><i class="bi bi-cash"></i> Efectivo</label>
                <input id="mp-qr" v-model="metodoPago" type="radio" class="btn-check" value="QR" />
                <label class="btn btn-outline-primary" for="mp-qr"><i class="bi bi-qr-code"></i> QR</label>
              </div>
            </div>
            <div v-if="metodoPago === 'EFECTIVO'" class="col-md-6">
              <label class="form-label small mb-1">Monto recibido (Bs)</label>
              <input v-model.number="recibido" type="number" min="0" step="0.01" class="form-control form-control-sm" />
            </div>
            <div v-if="metodoPago === 'EFECTIVO'" class="col-md-6 d-flex align-items-end">
              <div v-if="recibido !== ''" class="small">Cambio: <strong :class="cambio < 0 ? 'text-danger' : 'text-success'">{{ bs(cambio) }}</strong></div>
            </div>
            <div v-if="metodoPago === 'QR'" class="col-12">
              <label class="form-label small mb-1">Referencia / N° de transacción QR</label>
              <input v-model="referencia" class="form-control form-control-sm" maxlength="100" />
            </div>
            <div class="col-12">
              <input v-model="observacion" class="form-control form-control-sm" maxlength="255" placeholder="Observación (opcional)" />
            </div>
          </div>

          <div class="d-flex justify-content-between small text-muted"><span>Subtotal</span><span>{{ bs(subtotal) }}</span></div>
          <div class="d-flex justify-content-between small text-muted"><span>Descuento general</span><span>- {{ bs(descuentoAplicado) }}</span></div>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="fw-semibold">TOTAL</span><span class="pos-total">{{ bs(total) }}</span>
          </div>
          <button class="btn btn-primary btn-lg w-100" :disabled="!puedeCobrar" @click="cobrar">
            <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span><i v-else class="bi bi-check2-circle me-1"></i>Cobrar y registrar venta
          </button>
        </div>
      </div>
    </div>
  </div>

  <AppModal :show="!!ventaCreada" :title="`Venta #${ventaCreada?.id ?? ''} registrada`" size="sm" @close="nueva()">
    <div v-if="ventaCreada" class="text-center">
      <i class="bi bi-check-circle-fill text-success" style="font-size: 3rem"></i>
      <div class="display-6 fw-bold my-2">{{ bs(ventaCreada.total) }}</div>
      <div class="text-muted">{{ ventaCreada.pagos?.[0]?.metodoPago }} · {{ nombreCliente(ventaCreada.cliente) }}</div>
    </div>
    <template #footer>
      <button class="btn btn-outline-secondary" @click="imprimirDocumento('venta', ventaCreada)"><i class="bi bi-printer"></i> Imprimir</button>
      <button class="btn btn-primary" @click="nueva()">Nueva venta</button>
    </template>
  </AppModal>
</template>
