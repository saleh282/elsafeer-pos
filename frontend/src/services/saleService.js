import api from './api';

export const createSale = (payload) => api.post('/sales', payload).then((res) => res.data);

export const getSales = (params) => api.get('/sales', { params }).then((res) => res.data);

export const getSaleById = (id) => api.get(`/sales/${id}`).then((res) => res.data);
