import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('rodapro_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (error) => {
    const url: string = error.config?.url || '';
    // Sesión vencida o usuario desactivado: volver al login (salvo en el propio login).
    if (error.response?.status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('rodapro_token');
      localStorage.removeItem('rodapro_user');
      if (location.pathname !== '/login') location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default http;
