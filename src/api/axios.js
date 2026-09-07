import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL
});

// Adjunta el token JWT guardado en localStorage a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cerveloza_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el token expiró o es inválido, forzamos logout y redirigimos
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('cerveloza_token');
      localStorage.removeItem('cerveloza_usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;