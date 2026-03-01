import axios from 'axios';

// Crea la instancia base para las llamadas al backend
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Agrega el token JWT a cada request automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Maneja errores de autenticación globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si ya estamos en /login, dejamos que el componente maneje el error
    if (window.location.pathname === '/login') {
      return Promise.reject(error);
    }

    // Si el token expiró en cualquier otra página, sacamos al usuario
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;