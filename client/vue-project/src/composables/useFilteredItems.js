import { computed } from 'vue';

export function useFilteredItems(items, filters, filterConfig) {
  return computed(() => {

    const source = items.value !== undefined ? items.value : items;
    
    if (!Array.isArray(source)) {
      return [];
    }
    
    let result = source;

    for (const [key, config] of Object.entries(filterConfig)) {
      const filterValue = filters.value[key];
      if (!filterValue) continue;

      result = result.filter(item => {
        if (config.filterFn) {
          return config.filterFn(item, filterValue);
        }

        if (config.type === 'exact') {
          return item[config.field] === filterValue;
        }

        if (config.type === 'search') {
          const q = filterValue.toLowerCase();
          return config.fields.some(field =>
            String(item[field] || '').toLowerCase().includes(q)
          );
        }

        return true;
      });
    }

    return result;
  });
}