import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// ============================================
// ПЕРЕХВАТЧИК: ДОБАВЛЯЕМ ТОКЕН К ЗАПРОСАМ
// ============================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    console.log('🔍 [api] Запрос:', config.method?.toUpperCase(), config.url);
    console.log('🔍 [api] Токен в localStorage:', token ? 'ЕСТЬ' : 'НЕТ');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ [api] Authorization заголовок добавлен');
    } else {
      console.log('⚠️ [api] Токен отсутствует');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// ПЕРЕХВАТЧИК: ОБРАБОТКА 401
// ============================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ НЕ перехватываем 401 от logout (иначе — попытка refresh при выходе)
    if (originalRequest.url?.includes('/auth/logout')) {
      return Promise.reject(error);
    }

    // ✅ НЕ перехватываем 401 от refresh (иначе — бесконечная рекурсия)
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('Нет refresh токена');
        }

        console.log('🔄 [api] Попытка обновить токен...');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        console.log('✅ [api] Токен обновлен');

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ [api] Не удалось обновить токен:', refreshError.message);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// API АВТОРИЗАЦИИ
// ============================================
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  refresh: () => api.post('/auth/refresh'),
  validate: () => {
    const token = localStorage.getItem('accessToken');
    console.log('🔍 [authApi.validate] Токен:', token ? 'ЕСТЬ' : 'НЕТ');
    return api.get('/auth/validate', { params: { token } });
  },
  me: (userId) => api.get(`/auth/me/${userId}`)
};

// ============================================
// ОБОРУДОВАНИЕ
// ============================================
export const equipmentApi = {
  getAll: (params) => api.get('/equipment', { params }),
  getById: (id) => api.get(`/equipment/${id}`),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
  deletePermanent: (id) => api.delete(`/equipment/${id}/permanent`),
  restore: (id) => api.post(`/equipment/${id}/restore`),
  archiveProblematics: () => api.post('/equipment/archive-problematics'),
  deletePhoto: (id) => api.delete(`/equipment/${id}/photo`),
  uploadPhoto: (id, formData) => {
    return api.post(`/equipment/${id}/photo`, formData, {
      headers: { 'Content-Type': undefined }
    });
  },
  importExcel: async (formData) => {
    return await api.post('/equipment/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  exportExcel: async (fields) => {
    return await api.post('/equipment/export-excel', { fields });
  },
  getTags: () => api.get('/equipment/tags'),
  updateTags: (id, tags) => api.put(`/equipment/${id}/tags`, { tags }),
  uploadAdditionalFile: (id, formData) => {
    return api.post(`/equipment/${id}/additional-file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteAdditionalFile: (id, fileId) => {
    return api.delete(`/equipment/${id}/additional-file/${fileId}`);
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
  syncLessons: (templateId, lessonIds = null) => {
    const body = {};
    if (Array.isArray(lessonIds) && lessonIds.length > 0) {
      body.lessonIds = lessonIds;
    }
    return api.post(`/templates/${templateId}/sync-lessons`, body);
  }
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
  delete: (id) => api.delete(`/lessons/${id}`),
  getParticipantStats: (params = {}) => {
    return api.get('/lessons/stats/participants', { params });
  }
};

// ============================================
// ВРЕМЯ РАБОТЫ
// ============================================
export const workTimeApi = {
  getAll: () => api.get('/worktime'),
  getByEquipment: (equipmentId) => api.get(`/worktime/equipment/${equipmentId}`),
  getReport: (params) => api.get('/worktime/report', { params }),
  getSummary: (equipmentId, params) => api.get(`/worktime/summary/${equipmentId}`, { params }),
  create: (data) => api.post('/worktime', data)
};

// ============================================
// ЛОГИ
// ============================================
export const logsApi = {
  getAll: (params) => api.get('/logs', { params }),
  getByUser: (userId, params) => api.get(`/logs/user/${userId}`, { params }),
  getByEntity: (entity, entityId, params) => api.get(`/logs/entity/${entity}/${entityId}`, { params }),
  cleanup: (params) => api.delete('/logs/cleanup', { params }),
  getStats: () => api.get('/logs/stats')
};

export default api;