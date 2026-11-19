import { defineStore } from 'pinia';
import http from '../api/http';
import type { LoginResponse, Rol, SesionUsuario } from '../types';

const readUser = (): SesionUsuario | null => {
  try {
    return JSON.parse(localStorage.getItem('rodapro_user') || 'null') as SesionUsuario | null;
  } catch {
    return null;
  }
};

interface AuthState {
  token: string | null;
  user: SesionUsuario | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('rodapro_token'),
    user: readUser(),
  }),
  getters: {
    isAuthenticated: (s): boolean => !!s.token && !!s.user,
    rol: (s): Rol | undefined => s.user?.rol,
  },
  actions: {
    async login(nombreUsuario: string, password: string): Promise<void> {
      const { data } = await http.post<LoginResponse>('/auth/login', { nombreUsuario, password });
      this.token = data.accessToken;
      this.user = data.usuario;
      localStorage.setItem('rodapro_token', data.accessToken);
      localStorage.setItem('rodapro_user', JSON.stringify(data.usuario));
    },
    logout(): void {
      this.token = null;
      this.user = null;
      localStorage.removeItem('rodapro_token');
      localStorage.removeItem('rodapro_user');
    },
    hasRole(...roles: Rol[]): boolean {
      return !!this.user && roles.includes(this.user.rol);
    },
  },
});
