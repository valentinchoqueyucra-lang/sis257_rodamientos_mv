<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "../api/http";
import { useAuthStore } from "../stores/auth";
import { useToast } from "../composables/useToast";
import { errorMessage } from "../utils/format";
import type { Rol } from "../types";
import AppModal from "./AppModal.vue";

interface MenuItem {
  to?: string;
  label?: string;
  icon?: string;
  section?: string;
  roles?: Rol[];
}

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();
const open = ref(false);

const ADMIN: Rol = "ADMINISTRADOR";
const VEND: Rol = "VENDEDOR";
const ALM: Rol = "ALMACENERO";

const menu: MenuItem[] = [
  { to: "/panel", label: "Tablero", icon: "bi-speedometer2" },
  { section: "Ventas", roles: [ADMIN, VEND] },
  {
    to: "/panel/ventas/nueva",
    label: "Punto de venta",
    icon: "bi-cart-plus",
    roles: [ADMIN, VEND],
  },
  {
    to: "/panel/ventas",
    label: "Historial de ventas",
    icon: "bi-receipt",
    roles: [ADMIN, VEND],
  },
  {
    to: "/panel/clientes",
    label: "Clientes",
    icon: "bi-people",
    roles: [ADMIN, VEND],
  },
  {
    to: "/panel/pagos",
    label: "Pagos",
    icon: "bi-cash-coin",
    roles: [ADMIN, VEND],
  },
  { section: "Abastecimiento", roles: [ADMIN, ALM] },
  {
    to: "/panel/compras/nueva",
    label: "Nueva compra",
    icon: "bi-bag-plus",
    roles: [ADMIN, ALM],
  },
  {
    to: "/panel/compras",
    label: "Historial de compras",
    icon: "bi-bag-check",
    roles: [ADMIN, ALM],
  },
  {
    to: "/panel/proveedores",
    label: "Proveedores",
    icon: "bi-truck",
    roles: [ADMIN, ALM],
  },
  {
    to: "/panel/movimientos-inventario",
    label: "Inventario / Kardex",
    icon: "bi-boxes",
    roles: [ADMIN, ALM],
  },
  { section: "Catálogo" },
  {
    to: "/panel/productos",
    label: "Productos",
    icon: "bi-gear-wide-connected",
  },
  { to: "/panel/categorias", label: "Categorías", icon: "bi-tags" },
  { section: "Administración", roles: [ADMIN] },
  {
    to: "/panel/usuarios",
    label: "Usuarios",
    icon: "bi-person-badge",
    roles: [ADMIN],
  },
];
const items = computed(() =>
  menu.filter((m) => !m.roles || (auth.rol && m.roles.includes(auth.rol))),
);

// Rutas "padre" que no deben resaltarse cuando se está en una subruta (p. ej. /panel/ventas/nueva).
const exactas = new Set(["/panel", "/panel/ventas", "/panel/compras"]);
const activo = (to: string): boolean =>
  exactas.has(to) ? route.path === to : route.path.startsWith(to);

const rolLabel: Record<Rol, string> = {
  ADMINISTRADOR: "Administrador",
  VENDEDOR: "Vendedor",
  ALMACENERO: "Almacenero",
};

function salir(): void {
  auth.logout();
  router.push({ name: "login" });
}

// Cambio de contraseña
const showPwd = ref(false);
const pwd = reactive({ passwordActual: "", passwordNueva: "", confirmar: "" });
const saving = ref(false);
async function cambiarPassword(): Promise<void> {
  if (pwd.passwordNueva !== pwd.confirmar) {
    toast.error("La confirmación no coincide");
    return;
  }
  saving.value = true;
  try {
    await http.post("/auth/cambiar-password", {
      passwordActual: pwd.passwordActual,
      passwordNueva: pwd.passwordNueva,
    });
    toast.success("Contraseña actualizada");
    showPwd.value = false;
    Object.assign(pwd, {
      passwordActual: "",
      passwordNueva: "",
      confirmar: "",
    });
  } catch (e) {
    toast.error(errorMessage(e));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="rp-shell">
    <div
      class="rp-backdrop no-print"
      :class="{ open }"
      @click="open = false"
    ></div>
    <aside class="rp-sidebar no-print" :class="{ open }">
      <div class="rp-brand">
        <i class="bi bi-gear-wide-connected"></i>
        <div>RODAPRO<small>Repuestos mecánicos · Sucre</small></div>
      </div>
      <nav class="rp-nav" @click="open = false">
        <template v-for="(m, i) in items" :key="i">
          <div v-if="m.section" class="rp-section">{{ m.section }}</div>
          <router-link
            v-else-if="m.to"
            :to="m.to"
            :class="{ active: activo(m.to) }"
          >
            <i class="bi" :class="m.icon"></i>{{ m.label }}
          </router-link>
        </template>
      </nav>
    </aside>

    <div class="rp-main">
      <header class="rp-topbar no-print">
        <button
          class="btn btn-light rp-sidebar-toggle"
          aria-label="Menú"
          @click="open = true"
        >
          <i class="bi bi-list fs-5"></i>
        </button>
        <h1 class="rp-page-title">{{ route.meta.title }}</h1>
        <div class="ms-auto d-flex align-items-center gap-2">
          <div class="text-end d-none d-sm-block lh-sm">
            <div class="fw-semibold">{{ auth.user?.nombreCompleto }}</div>
            <span v-if="auth.rol" class="badge text-bg-dark">{{
              rolLabel[auth.rol]
            }}</span>
          </div>
          <button
            class="btn btn-outline-secondary btn-sm"
            title="Cambiar contraseña"
            @click="showPwd = true"
          >
            <i class="bi bi-key"></i>
          </button>
          <button
            class="btn btn-outline-danger btn-sm"
            title="Cerrar sesión"
            @click="salir"
          >
            <i class="bi bi-box-arrow-right"></i>
            <span class="d-none d-md-inline">Salir</span>
          </button>
        </div>
      </header>
      <main class="rp-content"><router-view /></main>
    </div>

    <AppModal
      :show="showPwd"
      title="Cambiar contraseña"
      size="sm"
      @close="showPwd = false"
    >
      <form id="form-pwd" @submit.prevent="cambiarPassword">
        <div class="mb-3">
          <label class="form-label">Contraseña actual</label
          ><input
            v-model="pwd.passwordActual"
            type="password"
            class="form-control"
            required
            autocomplete="current-password"
          />
        </div>
        <div class="mb-3">
          <label class="form-label">Nueva contraseña</label
          ><input
            v-model="pwd.passwordNueva"
            type="password"
            class="form-control"
            minlength="6"
            required
            autocomplete="new-password"
          />
        </div>
        <div>
          <label class="form-label">Confirmar nueva contraseña</label
          ><input
            v-model="pwd.confirmar"
            type="password"
            class="form-control"
            minlength="6"
            required
            autocomplete="new-password"
          />
        </div>
      </form>
      <template #footer>
        <button class="btn btn-light" @click="showPwd = false">Cancelar</button>
        <button class="btn btn-primary" form="form-pwd" :disabled="saving">
          Guardar
        </button>
      </template>
    </AppModal>
  </div>
</template>
