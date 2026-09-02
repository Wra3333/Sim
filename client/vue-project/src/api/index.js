import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// ОБОРУДОВАНИЕ
// ============================================
export const equipmentApi = {
  getAll: (params) => api.get('/equipment', { params }),
  getById: (id) => api.get(`/equipment/${id}`),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
  deletePhoto: (id) => api.delete(`/equipment/${id}/photo`),
  uploadPhoto: (id, formData) => {
    return api.post(`/equipment/${id}/photo`, formData, {
      headers: {
        'Content-Type': undefined
      }
    });
  },
  // Импорт Excel
  importExcel: async (formData) => {
    return await api.post('/equipment/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  // Экспорт Excel (исправлено)
  exportExcel: async (fields) => {
    return await api.post('/equipment/export-excel', { fields });
  }
};

// ============================================
// НЕИСПРАВНОСТИ
// ============================================
export const repairsApi = {
  getAll: () => api.get('/repairs'),
  getByEquipment: (equipmentId) => api.get(`/repairs/equipment/${equipmentId}`),
  create: (data) => api.post('/repairs', data),
  update: (id, data) => api.put(`/repairs/${id}`, data),
  updateResolvedBy: (id, data) => api.patch(`/repairs/${id}/resolved-by`, data),
  resolve: (id, data) => api.put(`/repairs/${id}/resolve`, data),
  delete: (id) => api.delete(`/repairs/${id}`)
};

// ============================================
// ШАБЛОНЫ
// ============================================
export const templatesApi = {
  getAll: () => api.get('/templates'),
  getById: (id) => api.get(`/templates/${id}`),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
  syncLessons: (templateId) => api.post(`/templates/${templateId}/sync-lessons`),
};

// ============================================
// ЗАНЯТИЯ
// ============================================
export const lessonsApi = {
  getAll: (params) => api.get('/lessons', { params }),
  getById: (id) => api.get(`/lessons/${id}`),
  create: (data) => api.post('/lessons', data),
  update: (id, data) => api.put(`/lessons/${id}`, data),
  complete: (id) => api.put(`/lessons/${id}/complete`),
  delete: (id) => api.delete(`/lessons/${id}`)
};

// ============================================
// ВРЕМЯ РАБОТЫ (АНАЛИТИКА)
// ============================================
export const workTimeApi = {
  getAll: () => api.get('/worktime'),
  getByEquipment: (equipmentId) => api.get(`/worktime/equipment/${equipmentId}`),
  getReport: (params) => api.get('/worktime/report', { params }),
  getSummary: (equipmentId, params) => api.get(`/worktime/summary/${equipmentId}`, { params }),
  create: (data) => api.post('/worktime', data)
};

export default api;