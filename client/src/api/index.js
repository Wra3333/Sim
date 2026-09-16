import axios from 'axios';
import { API_URL } from '../config';

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Если FormData — удаляем Content-Type, чтобы axios сам выставил boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
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

    // Не перехватываем 401 от logout
    if (originalRequest.url?.includes('/auth/logout')) {
      return Promise.reject(error);
    }

    // Не перехватываем 401 от refresh (иначе — рекурсия)
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

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
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
// API АВТОРИЗАЦИИ И ПОЛЬЗОВАТЕЛЕЙ
// ============================================
export const authApi = {
  // Публичные
  login: (data) => api.post('/auth/login', data),
  logout: (data) => api.post('/auth/logout', data),
  refresh: () => api.post('/auth/refresh'),
  validate: () => {
    const token = localStorage.getItem('accessToken');
    return api.get('/auth/validate', { params: { token } });
  },
  me: (userId) => api.get(`/auth/me/${userId}`),

  // Управление пользователями (только админ)
  register: (data) => api.post('/auth/register', data),
  getUsers: (params) => api.get('/auth/users', { params }),
  getUser: (id) => api.get(`/auth/users/${id}`),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  changePassword: (id, data) => api.put(`/auth/users/${id}/password`, data),
  resetPassword: (id, data) => api.put(`/auth/users/${id}/reset-password`, data),
  toggleActive: (id) => api.put(`/auth/users/${id}/toggle-active`)
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

  // ✅ Без ручного Content-Type — axios сам выставит multipart/form-data с boundary
  uploadPhoto: (id, formData) => api.post(`/equipment/${id}/photo`, formData),

  // ✅ То же самое
  importExcel: (formData) => api.post('/equipment/import-excel', formData),

  exportExcel: (fields, equipmentIds = null) =>
    api.post('/equipment/export-excel', { fields, equipmentIds }),

  getTags: () => api.get('/equipment/tags'),
  updateTags: (id, tags) => api.put(`/equipment/${id}/tags`, { tags }),

  // ✅ То же самое
  uploadAdditionalFile: (id, formData) => api.post(`/equipment/${id}/additional-file`, formData),
  deleteAdditionalFile: (id, fileId) => api.delete(`/equipment/${id}/additional-file/${fileId}`)
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

// ============================================
// РЕЭКСПОРТ УТИЛИТ ИЗ КОНФИГА
// ============================================
export {
  API_URL,
  UPLOADS_URL,
  getUploadsUrl,
  getPhotoUrl,
  getAdditionalFileUrl
} from '../config';

export default api;