import { defineStore } from 'pinia';
import { equipmentApi, repairsApi, templatesApi, lessonsApi } from '../api';

// ============================================
// Store для оборудования
// ============================================
export const useEquipmentStore = defineStore('equipment', {
  state: () => ({
    items: [],
    loading: false,
    error: null
  }),
  
  getters: {
    getById: (state) => (id) => state.items.find(item => item.id === id)
  },
  
  actions: {
    async fetchAll(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await equipmentApi.getAll(params);
        this.items = response.data;
        return response.data;
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
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка создания';
        throw error;
      }
    },
    
    async update(id, data) {
      let response = null
      try {
        response = await equipmentApi.update(id, data);
        const index = this.items.findIndex(item => item.id === id);
        console.log(response)
        if (index !== -1) {
          this.items[index] = response.data;
        }
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
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка удаления';
        throw error;
      }
    }
  }
});

// ============================================
// Store для ремонтов (заглушка)
// ============================================
export const useRepairsStore = defineStore('repairs', {
  state: () => ({
    items: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchAll() {
      this.loading = true;
      try {
        const response = await repairsApi.getAll();
        this.items = response.data;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка загрузки';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});

// ============================================
// Store для шаблонов (заглушка)
// ============================================
export const useTemplatesStore = defineStore('templates', {
  state: () => ({
    items: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchAll() {
      this.loading = true;
      try {
        const response = await templatesApi.getAll();
        this.items = response.data;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка загрузки';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});

// ============================================
// Store для занятий (заглушка)
// ============================================
export const useLessonsStore = defineStore('lessons', {
  state: () => ({
    items: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchAll(params = {}) {
      this.loading = true;
      try {
        const response = await lessonsApi.getAll(params);
        this.items = response.data;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Ошибка загрузки';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});