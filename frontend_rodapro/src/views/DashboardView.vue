<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import http from "../api/http";
import { useAuthStore } from "../stores/auth";
import { useToast } from "../composables/useToast";
import { bs, errorMessage } from "../utils/format";
import type { Producto, ReporteResumen, Rol } from "../types";

const auth = useAuthStore();
const toast = useToast();
const resumen = ref<ReporteResumen | null>(null);
const stockBajo = ref<Producto[]>([]);
const esAdmin = computed(() => auth.hasRole("ADMINISTRADOR"));

onMounted(async () => {
  try {
    const [bajo, res] = await Promise.all([
      http.get<Producto[]>("/productos/stock-bajo"),
      esAdmin.value
        ? http.get<ReporteResumen>("/reportes/resumen")
        : Promise.resolve(null),
    ]);
    stockBajo.value = bajo.data;
    resumen.value = res?.data ?? null;
  } catch (e) {
    toast.error(errorMessage(e));
  }
});

const maxDia = computed(() =>
  Math.max(1, ...(resumen.value?.ultimos7Dias ?? []).map((d) => d.total)),
);
const dia = (iso: string): string =>
  new Date(iso + "T12:00:00").toLocaleDateString("es-BO", {
    weekday: "short",
    day: "2-digit",
  });

interface Acceso {
  to: string;
  label: string;
  icon: string;
  roles: Rol[];
}
const accesos: Acceso[] = [
  {
    to: "/panel/ventas/nueva",
    label: "Nueva venta",
    icon: "bi-cart-plus",
    roles: ["ADMINISTRADOR", "VENDEDOR"],
  },
  {
    to: "/panel/compras/nueva",
    label: "Nueva compra",
    icon: "bi-bag-plus",
    roles: ["ADMINISTRADOR", "ALMACENERO"],
  },
  {
    to: "/panel/productos",
    label: "Productos",
    icon: "bi-gear-wide-connected",
    roles: ["ADMINISTRADOR", "VENDEDOR", "ALMACENERO"],
  },
  {
    to: "/panel/movimientos-inventario",
    label: "Inventario",
    icon: "bi-boxes",
    roles: ["ADMINISTRADOR", "ALMACENERO"],
  },
  {
    to: "/panel/clientes",
    label: "Clientes",
    icon: "bi-people",
    roles: ["ADMINISTRADOR", "VENDEDOR"],
  },
  {
    to: "/panel/proveedores",
    label: "Proveedores",
    icon: "bi-truck",
    roles: ["ADMINISTRADOR", "ALMACENERO"],
  },
];
const accesosVisibles = computed(() =>
  accesos.filter((a) => auth.rol && a.roles.includes(auth.rol)),
);
</script>

<template>
  <div>
    <p class="text-muted">
      Hola, <strong>{{ auth.user?.nombreCompleto }}</strong
      >. Este es el estado de la tienda.
    </p>

    <div class="d-flex flex-wrap gap-2 mb-3">
      <router-link
        v-for="a in accesosVisibles"
        :key="a.to"
        :to="a.to"
        class="btn btn-outline-primary"
      >
        <i class="bi me-1" :class="a.icon"></i>{{ a.label }}
      </router-link>
    </div>

    <template v-if="resumen">
      <div class="row g-3 mb-3">
        <div class="col-6 col-xl-3">
          <div class="rp-card rp-stat d-flex justify-content-between">
            <div>
              <div class="label">Ventas de hoy</div>
              <div class="value">{{ bs(resumen.ventasHoy.total) }}</div>
              <small class="text-muted"
                >{{ resumen.ventasHoy.cantidad }} ventas</small
              >
            </div>
            <div class="icon bg-success-subtle text-success">
              <i class="bi bi-cash-stack"></i>
            </div>
          </div>
        </div>
        <div class="col-6 col-xl-3">
          <div class="rp-card rp-stat d-flex justify-content-between">
            <div>
              <div class="label">Ventas del mes</div>
              <div class="value">{{ bs(resumen.ventasMes.total) }}</div>
              <small class="text-muted"
                >{{ resumen.ventasMes.cantidad }} ventas</small
              >
            </div>
            <div class="icon bg-primary-subtle text-primary">
              <i class="bi bi-graph-up-arrow"></i>
            </div>
          </div>
        </div>
        <div class="col-6 col-xl-3">
          <div class="rp-card rp-stat d-flex justify-content-between">
            <div>
              <div class="label">Compras del mes</div>
              <div class="value">{{ bs(resumen.comprasMes.total) }}</div>
              <small class="text-muted"
                >{{ resumen.comprasMes.cantidad }} compras</small
              >
            </div>
            <div class="icon bg-info-subtle text-info">
              <i class="bi bi-bag-check"></i>
            </div>
          </div>
        </div>
        <div class="col-6 col-xl-3">
          <div class="rp-card rp-stat d-flex justify-content-between">
            <div>
              <div class="label">Stock bajo</div>
              <div class="value" :class="{ 'text-danger': resumen.stockBajo }">
                {{ resumen.stockBajo }}
              </div>
              <small class="text-muted"
                >de {{ resumen.productosActivos }} productos</small
              >
            </div>
            <div class="icon bg-danger-subtle text-danger">
              <i class="bi bi-exclamation-triangle"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-lg-7">
          <div class="rp-card p-3 h-100">
            <h2 class="h6 mb-3">Ventas de los últimos 7 días</h2>
            <div class="rp-bars">
              <div
                v-for="d in resumen.ultimos7Dias"
                :key="d.fecha"
                class="rp-bar"
              >
                <span class="amt">{{
                  d.total > 0 ? Math.round(d.total) : ""
                }}</span>
                <div
                  class="bar"
                  :class="{ zero: d.total === 0 }"
                  :style="{ height: (d.total / maxDia) * 100 + '%' }"
                ></div>
                <small>{{ dia(d.fecha) }}</small>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="rp-card p-3 h-100">
            <h2 class="h6 mb-3">Más vendidos del mes</h2>
            <div v-if="!resumen.topProductos.length" class="text-muted">
              Aún no hay ventas este mes.
            </div>
            <table v-else class="table table-sm mb-3">
              <tbody>
                <tr v-for="p in resumen.topProductos" :key="p.nombre">
                  <td>{{ p.nombre }}</td>
                  <td class="num">{{ p.cantidad }} u.</td>
                  <td class="num">{{ bs(p.total) }}</td>
                </tr>
              </tbody>
            </table>
            <div
              v-for="m in resumen.ventasPorMetodo"
              :key="m.metodoPago"
              class="d-flex justify-content-between small"
            >
              <span class="badge text-bg-secondary">{{ m.metodoPago }}</span
              ><strong>{{ bs(m.total) }}</strong>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="rp-card">
      <div class="p-3 border-bottom d-flex align-items-center gap-2">
        <i class="bi bi-exclamation-triangle text-danger"></i>
        <h2 class="h6 mb-0">Productos con stock bajo</h2>
        <span class="badge text-bg-danger">{{ stockBajo.length }}</span>
      </div>
      <div v-if="!stockBajo.length" class="p-3 text-muted">
        Todo el stock está por encima del mínimo.
      </div>
      <div v-else class="table-responsive">
        <table class="table mb-0 align-middle">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th class="num">Stock</th>
              <th class="num">Mínimo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in stockBajo" :key="p.id">
              <td>{{ p.codigo }}</td>
              <td>{{ p.nombre }}</td>
              <td>{{ p.categoria?.nombre }}</td>
              <td class="num text-danger fw-bold">{{ p.stock }}</td>
              <td class="num">{{ p.stockMinimo }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
