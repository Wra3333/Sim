// ============================================
// УПРАВЛЕНИЕ ФИЛЬТРАМИ
// ============================================

import { ref, computed } from 'vue';

export function useFilters(defaultFilters = {}) {
  const filters = ref({ ...defaultFilters });

  const resetFilters = () => {
    filters.value = { ...defaultFilters };
  };

  const setFilter = (key, value) => {
    filters.value[key] = value;
  };

  const clearFilters = () => {
    Object.keys(filters.value).forEach(key => {
      filters.value[key] = '';
    });
  };

  return {
    filters,
    resetFilters,
    setFilter,
    clearFilters
  };
}