import { defineStore } from 'pinia';
import { 
  equipmentApi, 
  repairsApi, 
  templatesApi, 
  lessonsApi,
  workTimeApi
} from '../api';
import { tabSync } from '../utils/tabSync';

// ============================================
// Store для оборудования (С ПОДДЕРЖКОЙ АРХИВА)
// ============================================
export const useEquipmentStore = defineStore('equipment', {
  state: () => ({
    allEquipment: [], // ✅ ВСЁ оборудование (включая архивное)
    loading: false,
    error: null,
    lastFetched: null
  }),
  
  getters: {
    // ✅ ТОЛЬКО АКТИВНОЕ (не в архиве)
    items: (state) => {
      return state.allEquipment.filter(item => !item.is_archived);
    },
    
    // ✅ ТОЛЬКО АРХИВНОЕ
    archivedItems: (state) => {
      return state.allEquipment.filter(item => item.is_archived === true);
    },
    
    // ✅ Количество активного
    activeCount: (state) => {
      return state.allEquipment.filter(item => !item.is_archived).length;
    },
    
    // ✅ Количество архивного
    archivedCount: (state) => {
      return state.allEquipment.filter(item => item.is_archived === true).length;
    },
    
    getById: (state) => (id) => {
      return state.allEquipment.find(item => item.id === id);
    },
    
    getName: (state) => (id) => {
      const item = state.allEquipment.find(item => item.id === id);
      return item?.name || 'Оборудование не найдено';
    },
    
    getInventoryNumber: (state) => (id) => {
      const item = state.allEquipment.find(item => item.id === id);
      return item?.inventory_number || '—';
    },
    
    getStatus: (state) => (id) => {
      const item = state.allEquipment.find(item => item.id === id);
      return item?.working_status || null;
    },
    
    workingItems: (state) => {
      return state.allEquipment.filter(item => 
        !item.is_archived &&
        item.working_status === 'Исправен' && 
        item.write_off_status === 'На балансе'
      );
    },
    
    groupedByStatus: (state) => {
      const groups = {};
      state.allEquipment.forEach(item => {
        if (item.is_archived) return; // ✅ СКРЫВАЕМ АРХИВНОЕ
        const status = item.working_status || 'Неизвестно';
        if (!groups[status]) groups[status] = [];
        groups[status].push(item);
      });
      return groups;
    }
  },
  
  actions: {
    async fetchAll(params = {}, force = false) {
      this.loading = true;
      this.error = null;
      try {
        const response = await equipmentApi.getAll(params);
        this.allEquipment = response.data || [];
        this.lastFetched = Date.now();
        return this.allEquipment;
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
        this.allEquipment.push(response.data);
        this.lastFetched = Date.now();
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('equipment:created', { id: response.data.id });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка создания';
        throw error;
      }
    },
    
    async update(id, data) {
      try {
        const response = await equipmentApi.update(id, data);
        const index = this.allEquipment.findIndex(item => item.id === id);
        if (index !== -1) {
          this.allEquipment[index] = response.data;
        }
        this.lastFetched = Date.now();
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('equipment:updated', { id });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка обновления';
        throw error;
      }
    },
    
    // ✅ ОТПРАВКА В АРХИВ
    async delete(id) {
      try {
        await equipmentApi.delete(id);
        // Обновляем список
        await this.fetchAll();
        this.lastFetched = Date.now();
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('equipment:deleted', { id });
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка архивации';
        throw error;
      }
    },
    
    // ✅ ВОССТАНОВЛЕНИЕ ИЗ АРХИВА
    async restore(id) {
      try {
        await equipmentApi.restore(id);
        await this.fetchAll();
        this.lastFetched = Date.now();
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('equipment:restored', { id });
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка восстановления';
        throw error;
      }
    },
    
    // ✅ УДАЛЕНИЕ ДОПОЛНИТЕЛЬНОГО ФАЙЛА (ОБНОВЛЕН)
    async deleteFile(equipmentId, fileId) {
      try {
        console.log('🗑️ [Store] Удаление файла:', { equipmentId, fileId });
        
        // 1. Удаляем файл через API
        await equipmentApi.deleteAdditionalFile(equipmentId, fileId);
        console.log('✅ [Store] Файл удален из БД');
        
        // 2. Обновляем конкретное оборудование в сторе
        const index = this.allEquipment.findIndex(item => item.id === equipmentId);
        if (index !== -1) {
          // Получаем свежие данные с сервера для этого оборудования
          const response = await equipmentApi.getById(equipmentId);
          if (response.data) {
            this.allEquipment[index] = response.data;
            console.log('✅ [Store] Оборудование обновлено в сторе');
          }
        }
        
        // 3. Обновляем archivedItems и items (getters автоматически обновятся)
        // Но для уверенности можно перезагрузить все данные
        // await this.fetchAll();
        
        this.lastFetched = Date.now();
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('equipment:updated', { id: equipmentId });
        return { success: true };
      } catch (error) {
        console.error('❌ [Store] Ошибка удаления файла:', error);
        this.error = error.response?.data?.message || 'Ошибка удаления файла';
        throw error;
      }
    },
    
    // ✅ УДАЛЕНИЕ ФАЙЛА С ПЕРЕЗАГРУЗКОЙ ВСЕХ ДАННЫХ
    async deleteFileAndReload(equipmentId, fileId) {
      try {
        console.log('🗑️ [Store] Удаление файла с перезагрузкой:', { equipmentId, fileId });
        
        await equipmentApi.deleteAdditionalFile(equipmentId, fileId);
        console.log('✅ [Store] Файл удален из БД');
        
        // Перезагружаем все данные
        await this.fetchAll();
        console.log('✅ [Store] Все данные перезагружены');
        
        this.lastFetched = Date.now();
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('equipment:updated', { id: equipmentId });
        return { success: true };
      } catch (error) {
        console.error('❌ [Store] Ошибка удаления файла:', error);
        this.error = error.response?.data?.message || 'Ошибка удаления файла';
        throw error;
      }
    },
    
    clearCache() {
      this.allEquipment = [];
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
    async fetchAll(force = false) {
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
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('repair:created', { id: response.data.id });
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
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('repair:resolved', { id });
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
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('repair:updated', { id });
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
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('repair:deleted', { id });
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
    async fetchAll(force = false) {
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
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('template:created', { id: response.data.id });
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
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('template:updated', { id });
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
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('template:deleted', { id });
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка удаления';
        throw error;
      }
    },
    
    async syncLessons(templateId, lessonIds = null) {
      try {
        const response = await templatesApi.syncLessons(templateId, lessonIds);   
        this.lastFetched = Date.now();
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('template:synced', { templateId, lessonIds });
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
    async fetchAll(params = {}, force = false) {
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
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('lesson:created', { id: response.data.id });
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
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('lesson:updated', { id });
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
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('lesson:completed', { id });
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
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('lesson:deleted', { id });
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка удаления';
        throw error;
      }
    }
  }
});

// ============================================
// Store для учета времени работы
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
    async fetchAll(force = false) {
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
        // ✅ Синхронизация между вкладками
        tabSync.broadcast('worktime:created', { id: response.data.id });
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