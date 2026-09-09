// composables/useGroupedPagination.js
import { ref, computed } from 'vue';

/**
 * Композабл для пагинации с группировкой
 * @param {Ref<Array>} items - реактивный массив элементов
 * @param {Object} options - настройки
 * @param {string} options.groupBy - поле для группировки (по умолчанию 'group')
 * @param {number} options.pageSize - размер страницы (по умолчанию 6)
 * @param {string} options.defaultGroup - название для элементов без группы (по умолчанию 'Без группы')
 */
export function useGroupedPagination(items, options = {}) {
  const {
    groupBy = 'group',
    pageSize = 6,
    defaultGroup = 'Без группы'
  } = options;

  //  Уникальные группы
  const uniqueGroups = computed(() => {
    const groups = items.value
      .map(item => item[groupBy])
      .filter(g => g && g.trim() !== '');
    return [...new Set(groups)].sort();
  });

  //  Количество элементов в группе
  const getGroupCount = (groupName) => {
    return items.value.filter(item => item[groupBy] === groupName).length;
  };

  //  Группировка элементов
  const groupedItems = computed(() => {
    const groups = {};

    for (const item of items.value) {
      const groupName = item[groupBy] || defaultGroup;
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(item);
    }

    const sortedGroups = Object.keys(groups).sort();
    return sortedGroups.map(group => ({
      group,
      items: groups[group]
    }));
  });

  //  Состояние пагинации для каждой группы
  const groupPaginationState = ref({});

  //  Получить или создать состояние пагинации для группы
  const getGroupState = (groupName) => {
    if (!groupPaginationState.value[groupName]) {
      groupPaginationState.value[groupName] = {
        currentPage: 1,
        pageSize: pageSize
      };
    }
    return groupPaginationState.value[groupName];
  };

  //  Получить пагинированные элементы для группы
  const getPaginatedGroupItems = (group) => {
    const state = getGroupState(group.group);
    const start = (state.currentPage - 1) * pageSize;
    const end = start + pageSize;
    return group.items.slice(start, end);
  };

  //  Получить общее количество страниц для группы
  const getGroupTotalPages = (group) => {
    return Math.ceil(group.items.length / pageSize);
  };

  //  Получить текущую страницу группы
  const getGroupPage = (groupName) => {
    return getGroupState(groupName).currentPage;
  };

  //  Установить страницу группы
  const setGroupPage = (groupName, page) => {
    const state = getGroupState(groupName);
    state.currentPage = page;
  };

  //  Показать пагинацию для группы
  const getGroupShowPagination = (group) => {
    return group.items.length > pageSize;
  };

  //  Сбросить все страницы групп
  const resetGroupPages = () => {
    for (const key in groupPaginationState.value) {
      groupPaginationState.value[key].currentPage = 1;
    }
  };

  //  Сбросить состояние групп
  const resetGroups = () => {
    groupPaginationState.value = {};
  };

  return {
    // Данные
    uniqueGroups,
    groupedItems,
    
    // Методы для получения данных
    getGroupCount,
    getPaginatedGroupItems,
    getGroupTotalPages,
    getGroupPage,
    getGroupShowPagination,
    
    // Методы управления
    setGroupPage,
    resetGroupPages,
    resetGroups
  };
}