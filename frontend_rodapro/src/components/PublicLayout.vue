<script setup lang="ts">
import { computed } from 'vue';
import ListaModal from './ListaModal.vue';
import { useListaStore } from '../stores/lista';
import { useTienda } from '../composables/useTienda';
import { useAuthStore } from '../stores/auth';

const lista = useListaStore();
const tienda = useTienda();
const auth = useAuthStore();
const telefonoHref = computed(() => (tienda.value?.telefono ?? '').replace(/[^\d+]/g, ''));
</script>

<template>
  <div class="rp-public">
    <header class="rp-public-header">
      <div class="container d-flex align-items-center gap-2 py-2">
        <router-link to="/" class="brand"><i class="bi bi-gear-wide-connected"></i>{{ tienda?.nombre ?? 'RODAPRO' }}</router-link>
        <nav class="lp-nav d-none d-md-flex ms-3" aria-label="Principal">
          <router-link :to="{ name: 'landing' }">Inicio</router-link>
          <router-link :to="{ name: 'catalogo' }">Catálogo</router-link>
          <router-link :to="{ name: 'landing', hash: '#nosotros' }" active-class="" exact-active-class="">Nosotros</router-link>
          <router-link :to="{ name: 'landing', hash: '#como-pedir' }" active-class="" exact-active-class="">Cómo pedir</router-link>
          <router-link :to="{ name: 'landing', hash: '#visitenos' }" active-class="" exact-active-class="">Visítenos</router-link>
        </nav>
        <div class="ms-auto d-flex gap-2">
          <button class="btn btn-primary position-relative" @click="lista.abierta = true">
            <i class="bi bi-list-check"></i> <span class="d-none d-sm-inline">Mi lista</span>
            <span v-if="lista.cantidadTotal" class="badge text-bg-light ms-1">{{ lista.cantidadTotal }}</span>
          </button>
          <router-link :to="auth.isAuthenticated ? '/panel' : '/login'" class="btn btn-ghost">
            <i class="bi bi-person-lock"></i> <span class="d-none d-md-inline">{{ auth.isAuthenticated ? 'Ir al panel' : 'Acceso personal' }}</span>
          </router-link>
        </div>
      </div>
    </header>

    <main class="flex-grow-1"><router-view /></main>

    <footer class="rp-footer mt-5 py-4">
      <div class="container">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="fw-bold text-white fs-5">{{ tienda?.nombre ?? 'RODAPRO' }}</div>
            <div>Repuestos mecánicos · Sucre, Bolivia</div>
          </div>
          <div class="col-md-4">
            <div v-if="tienda?.direccion"><i class="bi bi-geo-alt me-2"></i>{{ tienda.direccion }}</div>
            <div v-for="h in tienda?.horarios ?? []" :key="h"><i class="bi bi-clock me-2"></i>{{ h }}</div>
          </div>
          <div class="col-md-4">
            <div v-if="tienda?.telefono"><i class="bi bi-telephone me-2"></i><a :href="`tel:${telefonoHref}`">{{ tienda.telefono }}</a></div>
            <div v-if="tienda?.whatsapp"><i class="bi bi-whatsapp me-2"></i><a :href="`https://wa.me/${tienda.whatsapp.replace(/\D/g, '')}`" target="_blank" rel="noopener">Escribirnos por WhatsApp</a></div>
          </div>
        </div>
        <hr class="border-secondary" />
        <small>Los precios están en bolivianos (Bs). La disponibilidad se confirma al momento de la consulta.</small>
      </div>
    </footer>

    <button v-if="lista.cantidadTotal" class="btn btn-primary rp-fab" @click="lista.abierta = true">
      <i class="bi bi-list-check"></i> Mi lista <span class="badge text-bg-light">{{ lista.cantidadTotal }}</span>
    </button>
    <ListaModal />
  </div>
</template>
