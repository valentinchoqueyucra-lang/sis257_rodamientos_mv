<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { errorMessage } from '../utils/format';

const auth = useAuthStore();
const router = useRouter();
const nombreUsuario = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const ver = ref(false);

async function entrar(): Promise<void> {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(nombreUsuario.value.trim(), password.value);
    await router.push({ name: 'dashboard' });
  } catch (e) {
    error.value = errorMessage(e);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="rp-login">
    <form class="rp-login-card" @submit.prevent="entrar">
      <div class="text-center mb-4">
        <div class="rounded-3 mb-2" style="width: 58px; height: 58px; background: #1b1f24; display: inline-grid; place-items: center">
          <i class="bi bi-gear-wide-connected fs-2" style="color: #e8590c"></i>
        </div>
        <h1 class="h3 fw-bold mb-0" style="letter-spacing: 0.08em">RODAPRO</h1>
        <div class="text-muted small">Ingreso del personal</div>
      </div>

      <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>

      <div class="mb-3">
        <label class="form-label">Usuario</label>
        <div class="input-group">
          <span class="input-group-text"><i class="bi bi-person"></i></span>
          <input v-model="nombreUsuario" class="form-control" autocomplete="username" autofocus required />
        </div>
      </div>
      <div class="mb-4">
        <label class="form-label">Contraseña</label>
        <div class="input-group">
          <span class="input-group-text"><i class="bi bi-lock"></i></span>
          <input v-model="password" :type="ver ? 'text' : 'password'" class="form-control" autocomplete="current-password" required />
          <button type="button" class="btn btn-outline-secondary" tabindex="-1" @click="ver = !ver"><i class="bi" :class="ver ? 'bi-eye-slash' : 'bi-eye'"></i></button>
        </div>
      </div>
      <button class="btn btn-primary w-100 py-2 fw-semibold" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>Ingresar
      </button>
      <div class="text-center mt-3"><router-link to="/" class="small"><i class="bi bi-arrow-left"></i> Volver al sitio</router-link></div>
    </form>
  </div>
</template>
