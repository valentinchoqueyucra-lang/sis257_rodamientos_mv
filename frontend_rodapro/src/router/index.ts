import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import type { Rol } from '../types';

const ADMIN: Rol = 'ADMINISTRADOR';
const VEND: Rol = 'VENDEDOR';
const ALM: Rol = 'ALMACENERO';

const routes: RouteRecordRaw[] = [
  // ---- Vista pública para el cliente ----
  {
    path: '/',
    component: () => import('../components/PublicLayout.vue'),
    meta: { public: true },
    children: [
      { path: '', name: 'landing', component: () => import('../views/LandingView.vue'), meta: { title: 'Repuestos mecánicos en Sucre' } },
      { path: 'catalogo', name: 'catalogo', component: () => import('../views/CatalogoView.vue'), meta: { title: 'Catálogo de repuestos' } },
    ],
  },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { public: true, title: 'Ingreso del personal' } },

  // ---- Panel interno (personal) ----
  {
    path: '/panel',
    component: () => import('../components/MainLayout.vue'),
    children: [
      { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue'), meta: { title: 'Tablero' } },
      { path: 'ventas/nueva', name: 'venta-nueva', component: () => import('../views/PuntoVentaView.vue'), meta: { title: 'Punto de venta', roles: [ADMIN, VEND] } },
      { path: 'ventas', name: 'ventas', component: () => import('../views/VentasView.vue'), meta: { title: 'Ventas', roles: [ADMIN, VEND] } },
      { path: 'clientes', name: 'clientes', component: () => import('../views/ClientesView.vue'), meta: { title: 'Clientes', roles: [ADMIN, VEND] } },
      { path: 'compras/nueva', name: 'compra-nueva', component: () => import('../views/NuevaCompraView.vue'), meta: { title: 'Nueva compra', roles: [ADMIN, ALM] } },
      { path: 'compras', name: 'compras', component: () => import('../views/ComprasView.vue'), meta: { title: 'Compras', roles: [ADMIN, ALM] } },
      { path: 'proveedores', name: 'proveedores', component: () => import('../views/ProveedoresView.vue'), meta: { title: 'Proveedores', roles: [ADMIN, ALM] } },
      { path: 'productos', name: 'productos', component: () => import('../views/ProductosView.vue'), meta: { title: 'Productos' } },
      { path: 'categorias', name: 'categorias', component: () => import('../views/CategoriasView.vue'), meta: { title: 'Categorías' } },
      { path: 'movimientos-inventario', name: 'movimientos-inventario', component: () => import('../views/MovimientosInventarioView.vue'), meta: { title: 'Inventario', roles: [ADMIN, ALM] } },
      { path: 'pagos', name: 'pagos', component: () => import('../views/PagosView.vue'), meta: { title: 'Pagos', roles: [ADMIN, VEND] } },
      { path: 'usuarios', name: 'usuarios', component: () => import('../views/UsuariosView.vue'), meta: { title: 'Usuarios', roles: [ADMIN] } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => {
    if (saved) return saved;
    if (to.hash) return { el: to.hash, top: 72, behavior: 'smooth' };
    return to.path === from.path ? undefined : { top: 0 };
  },
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.public) {
    return auth.isAuthenticated && to.name === 'login' ? { name: 'dashboard' } : true;
  }
  if (!auth.isAuthenticated) return { name: 'login' };
  const roles = to.meta.roles;
  if (roles && auth.rol && !roles.includes(auth.rol)) {
    useToast().warning('No tiene permisos para acceder a esa sección');
    return { name: 'dashboard' };
  }
  return true;
});

router.afterEach((to) => {
  document.title = `${to.meta.title ? to.meta.title + ' · ' : ''}RODAPRO`;
});

export default router;
