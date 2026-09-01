// ============================================
// БАЗОВЫЕ CRUD-ОПЕРАЦИИ
// ============================================

import { ref, onMounted } from 'vue';

export function useCrud(fetchFn, createFn, updateFn, deleteFn) {
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // Загрузка данных
  const load = async () => {
    loading.value = true;
    error.value = null;
    try {
      const data = await fetchFn();
      items.value = data;
      return data;
    } catch (err) {
      error.value = err;
      console.error('❌ Error loading:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Создание
  const create = async (data) => {
    try {
      const result = await createFn(data);
      await load();
      return result;
    } catch (err) {
      error.value = err;
      throw err;
    }
  };

  // Обновление
  const update = async (id, data) => {
    try {
      const result = await updateFn(id, data);
      await load();
      return result;
    } catch (err) {
      error.value = err;
      throw err;
    }
  };

  // Удаление
  const remove = async (id, confirmMessage = 'Удалить?') => {
    if (!confirm(confirmMessage)) return;
    try {
      await deleteFn(id);
      await load();
    } catch (err) {
      error.value = err;
      throw err;
    }
  };

  // Автозагрузка при монтировании
  onMounted(load);

  return {
    items,
    loading,
    error,
    load,
    create,
    update,
    remove
  };
}