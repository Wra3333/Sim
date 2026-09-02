import { defineStore } from 'pinia';
import { 
  equipmentApi, 
  repairsApi, 
  templatesApi, 
  lessonsApi,
  workTimeApi
} from '../api';

// ============================================
// Store для оборудования
// ============================================
export const useEquipmentStore = defineStore('equipment', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
    lastFetched: null
  }),
  
  getters: {
    getById: (state) => (id) => state.items.find(item => item.id === id),
    getName: (state) => (id) => {
      const item = state.items.find(item => item.id === id);
      return item?.name || '❌ Оборудование не найдено';
    },
    getInventoryNumber: (state) => (id) => {
      const item = state.items.find(item => item.id === id);
      return item?.inventory_number || '—';
    },
    getStatus: (state) => (id) => {
      const item = state.items.find(item => item.id === id);
      return item?.working_status || null;
    },
    workingItems: (state) => {
      return state.items.filter(item => 
        item.working_status === 'Исправен' && 
        item.write_off_status === 'На балансе'
      );
    },
    groupedByStatus: (state) => {
      const groups = {};
      state.items.forEach(item => {
        const status = item.working_status || 'Неизвестно';
        if (!groups[status]) groups[status] = [];
        groups[status].push(item);
      });
      return groups;
    }
  },
  
  actions: {
    // ✅ УБРАНО КЕШИРОВАНИЕ - ВСЕГДА ЗАГРУЖАЕМ СВЕЖИЕ ДАННЫЕ
    async fetchAll(params = {}, force = false) {
      // ❌ УБРАТЬ ЭТОТ БЛОК
      // if (this.items.length > 0 && !force) {
      //   return this.items;
      // }
      
      this.loading = true;
      this.error = null;
      try {
        const response = await equipmentApi.getAll(params);
        this.items = response.data || [];
        this.lastFetched = Date.now();
        return this.items;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка загрузки';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async create(data) {
      try {
        const response = await equipmentApi.create(data);
        this.items.push(response.data);
        this.lastFetched = Date.now();
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка создания';
        throw error;
      }
    },
    
    async update(id, data) {
      try {
        const response = await equipmentApi.update(id, data);
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
          this.items[index] = response.data;
        }
        this.lastFetched = Date.now();
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка обновления';
        throw error;
      }
    },
    
    async delete(id) {
      try {
        await equipmentApi.delete(id);
        this.items = this.items.filter(item => item.id !== id);
        this.lastFetched = Date.now();
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка удаления';
        throw error;
      }
    },
    
    clearCache() {
      this.items = [];
      this.lastFetched = null;
    },
    
    isStale(maxAge = 300000) {
      if (!this.lastFetched) return true;
      return Date.now() - this.lastFetched > maxAge;
    }
  }
});

// ============================================
// Store для ремонтов
// ============================================
export const useRepairsStore = defineStore('repairs', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
    lastFetched: null
  }),
  
  getters: {
    activeRepairs: (state) => state.items.filter(item => !item.is_resolved),
    resolvedRepairs: (state) => state.items.filter(item => item.is_resolved),
    getByEquipment: (state) => (equipmentId) => {
      return state.items.filter(item => item.equipment_id === equipmentId);
    }
  },
  
  actions: {
    // ✅ УБРАНО КЕШИРОВАНИЕ
    async fetchAll(force = false) {
      // ❌ УБРАТЬ ЭТОТ БЛОК
      // if (this.items.length > 0 && !force) {
      //   return this.items;
      // }
      
      this.loading = true;
      try {
        const response = await repairsApi.getAll();
        this.items = response.data || [];
        this.lastFetched = Date.now();
        return this.items;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка загрузки';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async fetchByEquipment(equipmentId, force = false) {
      const existing = this.getByEquipment(equipmentId);
      if (existing.length > 0 && !force) {
        return existing;
      }
      
      this.loading = true;
      try {
        const response = await repairsApi.getByEquipment(equipmentId);
        const newItems = response.data || [];
        this.items = this.items.filter(item => item.equipment_id !== equipmentId);
        this.items = [...this.items, ...newItems];
        this.lastFetched = Date.now();
        return newItems;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка загрузки';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async create(data) {
      try {
        const response = await repairsApi.create(data);
        this.items.push(response.data);
        this.lastFetched = Date.now();
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка создания';
        throw error;
      }
    },
    
    async resolve(id, data) {
      try {
        const response = await repairsApi.resolve(id, data);
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
          this.items[index] = response.data;
        }
        this.lastFetched = Date.now();
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка закрытия';
        throw error;
      }
    },
    
    async update(id, data) {
      try {
        const response = await repairsApi.update(id, data);
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
          this.items[index] = response.data;
        }
        this.lastFetched = Date.now();
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка обновления';
        throw error;
      }
    },
    
    async delete(id) {
      try {
        await repairsApi.delete(id);
        this.items = this.items.filter(item => item.id !== id);
        this.lastFetched = Date.now();
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка удаления';
        throw error;
      }
    }
  }
});

// ============================================
// Store для шаблонов
// ============================================
export const useTemplatesStore = defineStore('templates', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
    lastFetched: null
  }),
  
  getters: {
    activeTemplates: (state) => state.items.filter(item => item.is_active === true),
    getById: (state) => (id) => state.items.find(item => item.id === id),
    getEquipmentList: (state) => (id) => {
      const template = state.items.find(item => item.id === id);
      return template?.equipment_list || [];
    }
  },
  
  actions: {
    // ✅ УБРАНО КЕШИРОВАНИЕ
    async fetchAll(force = false) {
      // ❌ УБРАТЬ ЭТОТ БЛОК
      // if (this.items.length > 0 && !force) {
      //   return this.items;
      // }
      
      this.loading = true;
      try {
        const response = await templatesApi.getAll();
        this.items = response.data || [];
        this.lastFetched = Date.now();
        return this.items;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка загрузки';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async create(data) {
      try {
        const response = await templatesApi.create(data);
        this.items.push(response.data);
        this.lastFetched = Date.now();
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка создания';
        throw error;
      }
    },
    
    async update(id, data) {
      try {
        const response = await templatesApi.update(id, data);
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
          this.items[index] = response.data;
        }
        this.lastFetched = Date.now();
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка обновления';
        throw error;
      }
    },
    
    async delete(id) {
      try {
        await templatesApi.delete(id);
        this.items = this.items.filter(item => item.id !== id);
        this.lastFetched = Date.now();
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка удаления';
        throw error;
      }
    },
    
    async syncLessons(templateId) {
      try {
        const response = await templatesApi.syncLessons(templateId);
        this.lastFetched = Date.now();
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка синхронизации';
        throw error;
      }
    }
  }
});

// ============================================
// Store для занятий
// ============================================
export const useLessonsStore = defineStore('lessons', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
    lastFetched: null
  }),
  
  getters: {
    byStatus: (state) => (status) => {
      return state.items.filter(item => item.status === status);
    },
    completedLessons: (state) => {
      return state.items.filter(item => item.status === 'Проведено');
    },
    plannedLessons: (state) => {
      return state.items.filter(item => item.status === 'Запланировано');
    },
    byGroup: (state) => (group) => {
      return state.items.filter(item => item.group === group);
    },
    byTemplate: (state) => (templateId) => {
      return state.items.filter(item => item.template_id === templateId);
    }
  },
  
  actions: {
    // ✅ УБРАНО КЕШИРОВАНИЕ
    async fetchAll(params = {}, force = false) {
      // ❌ УБРАТЬ ЭТОТ БЛОК
      // if (this.items.length > 0 && !force) {
      //   return this.items;
      // }
      
      this.loading = true;
      try {
        const response = await lessonsApi.getAll(params);
        this.items = response.data || [];
        this.lastFetched = Date.now();
        return this.items;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка загрузки';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async create(data) {
      try {
        const response = await lessonsApi.create(data);
        this.items.push(response.data);
        this.lastFetched = Date.now();
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка создания';
        throw error;
      }
    },
    
    async update(id, data) {
      try {
        const response = await lessonsApi.update(id, data);
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
          this.items[index] = response.data;
        }
        this.lastFetched = Date.now();
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка обновления';
        throw error;
      }
    },
    
    async complete(id) {
      try {
        const response = await lessonsApi.complete(id);
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
          this.items[index] = response.data;
        }
        this.lastFetched = Date.now();
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка завершения';
        throw error;
      }
    },
    
    async delete(id) {
      try {
        await lessonsApi.delete(id);
        this.items = this.items.filter(item => item.id !== id);
        this.lastFetched = Date.now();
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка удаления';
        throw error;
      }
    }
  }
});

// ============================================
// ✅ Store для учета времени (WorkTime)
// ============================================
export const useWorkTimeStore = defineStore('worktime', {
  state: () => ({
    items: [],
    totalHours: 0,
    loading: false,
    error: null,
    lastFetched: null
  }),

  getters: {
    getByEquipment: (state) => (equipmentId) => {
      return state.items.filter(item => item.equipment_id === equipmentId);
    },
    getHoursByEquipment: (state) => (equipmentId) => {
      const items = state.items.filter(item => item.equipment_id === equipmentId);
      return items.reduce((sum, item) => sum + Number(item.total_hours || 0), 0);
    },
    totalHours: (state) => {
      return state.items.reduce((sum, item) => sum + Number(item.total_hours || 0), 0);
    }
  },

  actions: {
    // ✅ УБРАНО КЕШИРОВАНИЕ
    async fetchAll(force = false) {
      // ❌ УБРАТЬ ЭТОТ БЛОК
      // if (this.items.length > 0 && !force) {
      //   return this.items;
      // }

      this.loading = true;
      this.error = null;
      try {
        const response = await workTimeApi.getAll();
        this.items = response.data || [];
        this.totalHours = this.items.reduce((sum, item) => sum + Number(item.total_hours || 0), 0);
        this.lastFetched = Date.now();
        return this.items;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка загрузки';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchReport(params = {}) {
      this.loading = true;
      try {
        const response = await workTimeApi.getReport(params);
        this.items = response.data || [];
        this.totalHours = this.items.reduce((sum, item) => sum + Number(item.total_hours || 0), 0);
        this.lastFetched = Date.now();
        return this.items;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка загрузки отчета';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchByEquipment(equipmentId, force = false) {
      const existing = this.getByEquipment(equipmentId);
      if (existing.length > 0 && !force) {
        return existing;
      }

      this.loading = true;
      try {
        const response = await workTimeApi.getByEquipment(equipmentId);
        const newItems = response.data || [];
        this.items = this.items.filter(item => item.equipment_id !== equipmentId);
        this.items = [...this.items, ...newItems];
        this.lastFetched = Date.now();
        return newItems;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка загрузки';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async create(data) {
      try {
        const response = await workTimeApi.create(data);
        this.items.push(response.data);
        this.lastFetched = Date.now();
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка создания';
        throw error;
      }
    },

    clearCache() {
      this.items = [];
      this.totalHours = 0;
      this.lastFetched = null;
    }
  }
});