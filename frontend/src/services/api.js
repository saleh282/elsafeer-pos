import axios from 'axios';

const api = axios.create({
  // Production uses the same domain for the site and API. Vite's dev proxy
  // keeps the exact same path working on the local development machine.
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('elsafeer_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('elsafeer_token');
      localStorage.removeItem('elsafeer_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
