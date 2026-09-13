import api from './api';

export const getCategories = () => api.get('/categories').then((res) => res.data);

export const getProducts = (categoryId) =>
  api.get('/products', { params: categoryId ? { categoryId } : {} }).then((res) => res.data);
