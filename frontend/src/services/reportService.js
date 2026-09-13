import api from './api';

export const getSalesReport = (params) => api.get('/reports/sales', { params }).then((res) => res.data);
