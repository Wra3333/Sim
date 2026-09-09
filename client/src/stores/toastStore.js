import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([]);

  const add = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    toasts.value.push({ id, message, type, duration });
    
    // Автоудаление через duration
    setTimeout(() => {
      remove(id);
    }, duration);
  };

  const remove = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  };

  const clear = () => {
    toasts.value = [];
  };

  // Удобные методы для разных типов
  const success = (message, duration) => add(message, 'success', duration);
  const error = (message, duration) => add(message, 'error', duration);
  const warning = (message, duration) => add(message, 'warning', duration);
  const info = (message, duration) => add(message, 'info', duration);

  return {
    toasts,
    add,
    remove,
    clear,
    success,
    error,
    warning,
    info
  };
});