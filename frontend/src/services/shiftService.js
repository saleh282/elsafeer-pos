import api from './api';

export const getCurrentShift = (branchId) =>
  api.get('/shifts/current', { params: branchId ? { branchId } : {} }).then((res) => res.data);

export const openShift = (shiftType) => api.post('/shifts/open', { shiftType }).then((res) => res.data);

export const closeShift = (shiftId) => api.post('/shifts/close', { shiftId }).then((res) => res.data);

export const getShiftSummaryPreview = (shiftId) =>
  api.get(`/shifts/${shiftId}/summary`).then((res) => res.data);
