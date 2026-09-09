import { ref, computed, watch } from 'vue';

export function usePagination(items, options = {}) {
  const { pageSize = 10, initialPage = 1 } = options;

  const currentPage = ref(initialPage);
  const itemsPerPage = ref(pageSize);

  // Пагинированные данные
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return items.value.slice(start, end);
  });

  // Общее количество страниц
  const totalPages = computed(() => 
    Math.ceil(items.value.length / itemsPerPage.value)
  );

  // Перейти на страницу
  const goToPage = (page) => {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
  };

  // Следующая страница
  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++;
    }
  };

  // Предыдущая страница
  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--;
    }
  };

  // Сброс на первую страницу (при изменении фильтров)
  const resetPage = () => {
    currentPage.value = 1;
  };

  // Автосброс при изменении исходных данных
  watch(items, resetPage, { deep: true });

  return {
    // Данные
    currentPage,
    itemsPerPage,
    paginatedItems,
    totalPages,

    // Методы
    goToPage,
    nextPage,
    prevPage,
    resetPage,

    // Вспомогательные
    isFirstPage: computed(() => currentPage.value === 1),
    isLastPage: computed(() => currentPage.value === totalPages.value),
    hasItems: computed(() => items.value.length > 0),
    showPagination: computed(() => items.value.length > itemsPerPage.value),
  };
}