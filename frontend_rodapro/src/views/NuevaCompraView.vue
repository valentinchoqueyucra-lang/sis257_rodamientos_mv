<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import ProveedorSelector from '../components/ProveedorSelector.vue';
import http from '../api/http';
import { useToast } from '../composables/useToast';
import { bs, errorMessage, round2 } from '../utils/format';
import type { Compra, MetodoPago, Producto, Proveedor } from '../types';

interface LineaCompra {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
}

const router = useRouter();
const toast = useToast();
const productos = ref<Producto[]>([]);
const busqueda = ref('');

const proveedor = ref<Proveedor | null>(null);
const selectorProveedor = ref<InstanceType<typeof ProveedorSelector> | null>(null);
const lineas = ref<LineaCompra[]>([]);
const descuentoGlobal = ref<number>(0);
const metodoPago = ref<MetodoPago>('EFECTIVO');
const referencia = ref('');
const observacion = ref('');
const guardando = ref(false);

onMounted(async () => {
  try {
    const { data } = await http.get<Producto[]>('/productos', { params: { soloActivos: true } });
    productos.value = data;
  } catch (e) {
    toast.error(errorMessage(e));
  }
});

const resultados = computed(() => {
  const t = busqueda.value.trim().toLowerCase();
  if (!t) return [];
  return productos.value
    .filter((p) => !lineas.value.some((l) => l.producto.id === p.id))
    .filter((p) => [p.codigo, p.nombre, p.marca].some((x) => (x ?? '').toLowerCase().includes(t)))
    .slice(0, 8);
});

function agregar(p: Producto): void {
  lineas.value.push({ producto: p, cantidad: 1, precioUnitario: p.precioCompra, descuento: 0 });
  busqueda.value = '';
}

const bruto = (l: LineaCompra): number => round2((Number(l.precioUnitario) || 0) * (Number(l.cantidad) || 0));
const subtotalLinea = (l: LineaCompra): number => round2(bruto(l) - (Number(l.descuento) || 0));
const subtotal = computed(() => round2(lineas.value.reduce((s, l) => s + subtotalLinea(l), 0)));
const descuentoAplicado = computed(() => Math.min(Math.max(round2(Number(descuentoGlobal.value) || 0), 0), subtotal.value));
const total = computed(() => round2(subtotal.value - descuentoAplicado.value));
const valido = computed(
  () => lineas.value.length > 0 && lineas.value.every((l) => l.cantidad >= 1 && l.precioUnitario >= 0 && subtotalLinea(l) >= 0),
);

async function guardar(): Promise<void> {
  if (!proveedor.value) {
    toast.warning('Seleccione o registre el proveedor de la compra');
    selectorProveedor.value?.enfocar();
    return;
  }
  guardando.value = true;
  try {
    const { data } = await http.post<Compra>('/compras', {
      idProveedor: proveedor.value.id,
      descuento: descuentoAplicado.value,
      metodoPago: metodoPago.value,
      referencia: referencia.value.trim() || undefined,
      observacion: observacion.value.trim() || undefined,
      detalles: lineas.value.map((l) => ({
        idProducto: l.producto.id,
        cantidad: Math.floor(Number(l.cantidad)),
        precioUnitario: Number(l.precioUnitario),
        descuento: Number(l.descuento) || 0,
      })),
    });
    toast.success(`Compra #${data.id} registrada: stock actualizado`);
    await router.push('/panel/compras');
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    guardando.value = false;
  }
}
</script>

<template>
  <div class="row g-3">
    <div class="col-xl-8">
      <div class="rp-card">
        <div class="p-3 border-bottom">
          <label class="form-label small mb-1">Agregar producto</label>
          <div class="position-relative">
            <input v-model="busqueda" class="form-control" placeholder="Buscar por código, nombre o marca…" />
            <div v-if="resultados.length" class="list-group position-absolute w-100 shadow" style="z-index: 10">
              <button v-for="p in resultados" :key="p.id" type="button" class="list-group-item list-group-item-action d-flex justify-content-between" @click="agregar(p)">
                <span>{{ p.codigo }} · {{ p.nombre }} <small class="text-muted">{{ p.marca }}</small></span>
                <small class="text-muted">Stock {{ p.stock }}</small>
              </button>
            </div>
          </div>
        </div>
        <div v-if="!lineas.length" class="p-4 text-center text-muted">Busque y agregue los productos que ingresan.</div>
        <div v-else class="table-responsive">
          <table class="table align-middle mb-0">
            <thead><tr><th>Producto</th><th style="width: 110px">Cantidad</th><th style="width: 140px">Costo unit. (Bs)</th><th style="width: 130px">Desc. (Bs)</th><th class="num">Subtotal</th><th></th></tr></thead>
            <tbody>
              <tr v-for="(l, i) in lineas" :key="l.producto.id">
                <td><div class="fw-semibold">{{ l.producto.nombre }}</div><small class="text-muted">{{ l.producto.codigo }} · stock actual {{ l.producto.stock }}</small></td>
                <td><input v-model.number="l.cantidad" type="number" min="1" step="1" class="form-control form-control-sm" /></td>
                <td><input v-model.number="l.precioUnitario" type="number" min="0" step="0.01" class="form-control form-control-sm" /></td>
                <td><input v-model.number="l.descuento" type="number" min="0" step="0.01" class="form-control form-control-sm" /></td>
                <td class="num fw-semibold" :class="{ 'text-danger': subtotalLinea(l) < 0 }">{{ bs(subtotalLinea(l)) }}</td>
                <td><button class="btn btn-sm btn-outline-danger" @click="lineas.splice(i, 1)"><i class="bi bi-x-lg"></i></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="col-xl-4">
      <div class="rp-card p-3">
        <div class="mb-3"><ProveedorSelector ref="selectorProveedor" v-model="proveedor" /></div>
        <div class="mb-3">
          <label class="form-label d-block">Método de pago</label>
          <div class="btn-group w-100">
            <input id="cmp-ef" v-model="metodoPago" type="radio" class="btn-check" value="EFECTIVO" />
            <label class="btn btn-outline-primary" for="cmp-ef"><i class="bi bi-cash"></i> Efectivo</label>
            <input id="cmp-qr" v-model="metodoPago" type="radio" class="btn-check" value="QR" />
            <label class="btn btn-outline-primary" for="cmp-qr"><i class="bi bi-qr-code"></i> QR</label>
          </div>
        </div>
        <div v-if="metodoPago === 'QR'" class="mb-3"><label class="form-label">Referencia</label><input v-model="referencia" class="form-control" maxlength="100" /></div>
        <div class="mb-3"><label class="form-label">Descuento general (Bs)</label><input v-model.number="descuentoGlobal" type="number" min="0" step="0.01" class="form-control" /></div>
        <div class="mb-3"><label class="form-label">Observación</label><input v-model="observacion" class="form-control" maxlength="255" /></div>

        <div class="d-flex justify-content-between small text-muted"><span>Subtotal</span><span>{{ bs(subtotal) }}</span></div>
        <div class="d-flex justify-content-between small text-muted"><span>Descuento</span><span>- {{ bs(descuentoAplicado) }}</span></div>
        <div class="d-flex justify-content-between align-items-center mb-3"><span class="fw-semibold">TOTAL</span><span class="pos-total">{{ bs(total) }}</span></div>
        <button class="btn btn-primary w-100 btn-lg" :disabled="!valido || guardando" @click="guardar">
          <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>Registrar compra
        </button>
        <div class="form-text mt-2">Al registrar, el stock de cada producto aumenta, se actualiza su precio de compra y se genera el movimiento de inventario y el pago.</div>
      </div>
    </div>
  </div>
</template>
