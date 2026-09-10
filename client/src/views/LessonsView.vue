<template>
  <div class="lessons-wrapper">
    <div class="lessons-main">
      <h2>
        <IconLessons class="title-icon" />
        Учебный журнал
      </h2>
      <p>Управление занятиями</p>

      <ProblemLessonsAlert 
        :lessons="lessonsItems" 
        :equipment-list="allEquipment" 
        :on-replace-click="openEditForm" 
      />

      <div class="toolbar">
        <button class="btn btn-primary" @click="openCreateForm">
          <IconPlus class="btn-icon" />
          Создать занятие
        </button>
        <span class="hotkey-hint">
          Нажмите <kbd>Enter</kbd> для открытия/закрытия формы
        </span>
      </div>

      <!-- ФИЛЬТРЫ -->
      <div class="filters">
        <div class="filters-row">
          <div class="filter-group">
            <label>Статус</label>
            <select v-model="lessonsFilters.status" class="form-control">
              <option value="">Все статусы</option>
              <option value="Запланировано">Запланировано</option>
              <option value="Проведено">Проведено</option>
              <option value="Отменено">Отменено</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Группа</label>
            <select v-model="lessonsFilters.group" class="form-control">
              <option value="">Все группы</option>
              <option v-for="group in uniqueGroups" :key="group" :value="group">
                {{ group }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label>Поиск</label>
            <input v-model="lessonsFilters.search" type="text" class="form-control" placeholder="Поиск по названию..." />
          </div>

          <div class="filter-group date-filters">
            <label>Дата</label>
            <div class="date-inputs">
              <input 
                v-model="lessonsFilters.dateFrom" 
                type="date" 
                class="form-control date-input" 
                placeholder="От"
              />
              <span class="date-separator">—</span>
              <input 
                v-model="lessonsFilters.dateTo" 
                type="date" 
                class="form-control date-input" 
                placeholder="До"
              />
            </div>
          </div>

          <div class="filter-group actions">
            <button class="btn btn-outline-secondary" @click="resetAllFilters">
              <IconReset class="btn-icon" />
              Сбросить
            </button>
          </div>
        </div>
      </div>

      <!-- СПИСОК -->
      <div v-if="loading" class="text-center">
        <IconLoading class="loading-icon" />
        Загрузка...
      </div>
      <div v-else-if="filteredLessons.length === 0" class="empty-state">
        <IconList class="empty-icon" />
        <span>Нет занятий</span>
      </div>

      <!-- ТАБЛИЦА -->
      <div v-else class="table-container">
        <table class="lessons-table">
          <thead>
            <tr>
              <th style="width: 80px;">ID</th>
              <th style="min-width: 150px;">Название</th>
              <th style="min-width: 100px;">Группа</th>
              <th style="min-width: 120px;">Преподаватель</th>
              <th style="width: 110px;">Дата</th>
              <th style="width: 100px;">Время</th>
              <th style="width: 90px;">Студентов</th>
              <th style="width: 120px;">Статус</th>
              <th style="width: 160px;">Действия</th>
            </tr>
          </thead>
          <tbody>
            <LessonCard
              v-for="lesson in paginatedItems"
              :key="lesson.id"
              :lesson="lesson"
              @row-click="openEditForm"
              @complete="completeLesson"
              @edit="openEditForm"
              @delete="deleteLesson"
            />
          </tbody>
        </table>
      </div>

      <!-- ПАГИНАЦИЯ -->
      <Pagination 
        v-if="showPagination" 
        v-model:current-page="currentPage" 
        :total-pages="totalPages"
        :loading="loading" 
      />

      <!-- LessonFormDrawer -->
      <LessonFormDrawer 
        :visible="showForm" 
        :lesson="editingItem" 
        @close="closeForm" 
        @save="onSaved" 
      />

      <ConfirmModal
        v-model:visible="show"
        :title="config.title"
        :message="config.message"
        :confirm-text="config.confirmText"
        :cancel-text="config.cancelText"
        :confirm-variant="config.confirmVariant"
        @confirm="onConfirm"
        @cancel="onCancel"
      />
    </div>

    <div class="lessons-sidebar">
      <ProblemEquipmentSidebar 
        :lessons="lessonsItems" 
        :templates="templatesItems" 
        :equipment-list="allEquipment" 
        :limit="3" 
      />

      <div class="sidebar-card">
        <h4>
          <IconUsers class="h-icon" />
          Группы
        </h4>
        <div class="group-list">
          <div 
            v-for="group in uniqueGroups" 
            :key="group" 
            class="group-item"
            :class="{ active: lessonsFilters.group === group }" 
            @click="toggleGroup(group)"
          >
            <span class="group-name">{{ group }}</span>
            <span class="group-count">{{ getGroupCount(group) }}</span>
          </div>
          <div v-if="uniqueGroups.length === 0" class="group-item empty">
            Нет групп
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useLessonsStore, useTemplatesStore, useEquipmentStore } from '../stores';
import { useAppStore } from '../stores/appStore';
import { useToastStore } from '../stores/toastStore';
import { useConfirm } from '../composables/useConfirm';
import LessonCard from '../components/lessons/LessonCard.vue';
import LessonFormDrawer from '../components/lessons/LessonFormDrawer.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import ProblemLessonsAlert from '../components/ProblemLessonsAlert.vue';
import ProblemEquipmentSidebar from '../components/ProblemEquipmentSidebar.vue';
import Pagination from '../components/Pagination.vue';
import {
  IconLessons,
  IconPlus,
  IconReset,
  IconLoading,
  IconList,
  IconUsers
} from '../components/icons';

// ============================================
//  ROUTER
// ============================================
const route = useRoute();
const router = useRouter();

// ============================================
//  STORE
// ============================================
const appStore = useAppStore();
const lessonsStore = useLessonsStore();
const templatesStore = useTemplatesStore();
const equipmentStore = useEquipmentStore();
const toast = useToastStore();

const { show, config, confirm, onConfirm, onCancel } = useConfirm();

const { items: lessonsItems } = storeToRefs(lessonsStore);
const { items: templatesItems } = storeToRefs(templatesStore);
const { allEquipment } = storeToRefs(equipmentStore);
const { filters, pagination } = storeToRefs(appStore);

// ============================================
//  СОСТОЯНИЕ
// ============================================
const loading = ref(true);
const showForm = ref(false);
const editingItem = ref(null);
let isUpdatingFromUrl = false;

// ============================================
//  ФИЛЬТРЫ ИЗ APPSTORE
// ============================================
const lessonsFilters = computed({
  get: () => filters.value.lessons || { status: '', group: '', search: '', dateFrom: '', dateTo: '' },
  set: (val) => {
    filters.value.lessons = val;
  }
});

// ============================================
//  ПАГИНАЦИЯ ИЗ APPSTORE
// ============================================
const lessonsPagination = computed({
  get: () => pagination.value.lessons || { page: 1, size: 7 },
  set: (val) => {
    pagination.value.lessons = val;
  }
});

const currentPage = computed({
  get: () => lessonsPagination.value.page || 1,
  set: (val) => {
    lessonsPagination.value = { ...lessonsPagination.value, page: val };
  }
});

// ============================================
//  ФИЛЬТРАЦИЯ
// ============================================
const filterConfig = {
  status: {
    filterFn: (item, value) => {
      if (!value) return true;
      return item.status === value;
    }
  },
  group: {
    filterFn: (item, value) => {
      if (!value) return true;
      return item.group === value;
    }
  },
  search: {
    filterFn: (item, value) => {
      if (!value) return true;
      const query = value.toLowerCase().trim();
      return item.title?.toLowerCase().includes(query) ||
             item.teacher?.toLowerCase().includes(query) ||
             item.group?.toLowerCase().includes(query);
    }
  },
  dateFrom: {
    filterFn: (item, value) => {
      if (!value) return true;
      const from = new Date(value);
      from.setHours(0, 0, 0, 0);
      return new Date(item.date) >= from;
    }
  },
  dateTo: {
    filterFn: (item, value) => {
      if (!value) return true;
      const to = new Date(value);
      to.setHours(23, 59, 59, 999);
      return new Date(item.date) <= to;
    }
  }
};

const filteredLessons = computed(() => {
  const list = [...lessonsItems.value];
  const allFilters = { ...lessonsFilters.value };

  return list.filter(item => {
    let result = true;
    for (const [key, config] of Object.entries(filterConfig)) {
      const filterValue = allFilters[key];
      if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
        if (Array.isArray(filterValue)) {
          if (filterValue.length > 0) {
            result = result && config.filterFn(item, filterValue);
          }
        } else {
          result = result && config.filterFn(item, filterValue);
        }
      }
    }
    return result;
  });
});

// ============================================
//  УНИКАЛЬНЫЕ ГРУППЫ
// ============================================
const uniqueGroups = computed(() => {
  const groups = lessonsItems.value
    .map(item => item.group)
    .filter(g => g && g.trim() !== '');
  return [...new Set(groups)].sort();
});

const getGroupCount = (groupName) => {
  return lessonsItems.value.filter(item => item.group === groupName).length;
};

const toggleGroup = (group) => {
  if (lessonsFilters.value.group === group) {
    lessonsFilters.value = { ...lessonsFilters.value, group: '' };
  } else {
    lessonsFilters.value = { ...lessonsFilters.value, group };
  }
  applyFilters();
};

// ============================================
//  ПАГИНАЦИЯ
// ============================================
const pageSize = 7;

const totalPages = computed(() => {
  return Math.ceil(filteredLessons.value.length / pageSize) || 1;
});

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredLessons.value.slice(start, end);
});

const showPagination = computed(() => {
  return filteredLessons.value.length > pageSize;
});

const resetPage = () => {
  currentPage.value = 1;
};

// ============================================
//  ЗАГРУЗКА ДАННЫХ
// ============================================
const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      lessonsStore.fetchAll(),
      templatesStore.fetchAll(),
      equipmentStore.fetchAll()
    ]);
    resetPage();
  } catch (error) {
    console.error('Error loading data:', error);
    toast.error('Ошибка загрузки данных');
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  resetPage();
};

const resetAllFilters = () => {
  appStore.resetFilters('lessons');
  resetPage();
};

// ============================================
//  ХОТКЕЙ: ENTER
// ============================================
const handleKeydown = (e) => {
  if (e.key === 'Enter') {
    const tag = e.target.tagName.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
      e.preventDefault();
      if (showForm.value) {
        closeForm();
      } else {
        openCreateForm();
      }
    }
  }
};

// ============================================
//  МЕТОДЫ
// ============================================
const openCreateForm = () => {
  isUpdatingFromUrl = true;
  editingItem.value = null;
  showForm.value = true;
  appStore.closeEdit('lesson');
  const query = { ...route.query };
  delete query.lesson_edit;
  router.replace({ query });
  setTimeout(() => {
    isUpdatingFromUrl = false;
  }, 100);
};

const openEditForm = (lesson) => {
  if (!lesson) return;
  isUpdatingFromUrl = true;
  editingItem.value = lesson;
  showForm.value = true;
  if (lesson.id) {
    appStore.openEdit('lesson', lesson.id);
  }
  setTimeout(() => {
    isUpdatingFromUrl = false;
  }, 100);
};

const closeForm = () => {
  isUpdatingFromUrl = true;
  showForm.value = false;
  appStore.closeEdit('lesson');
  const query = { ...route.query };
  if (query.lesson_edit) {
    delete query.lesson_edit;
    router.replace({ query });
  }
  setTimeout(() => {
    isUpdatingFromUrl = false;
  }, 100);
};

const onSaved = () => {
  closeForm();
  loadData();
};

const completeLesson = async (id) => {
  const confirmed = await confirm({
    title: 'Завершить занятие?',
    message: 'Вы уверены, что хотите завершить это занятие?',
    confirmText: 'Да, завершить',
    confirmVariant: 'success'
  });

  if (confirmed) {
    try {
      await lessonsStore.complete(id);
      await loadData();
      toast.success('Занятие успешно завершено!');
    } catch (error) {
      toast.error('Ошибка завершения занятия');
    }
  }
};

const deleteLesson = async (id) => {
  const confirmed = await confirm({
    title: 'Удаление занятия',
    message: 'Вы уверены, что хотите удалить это занятие?',
    confirmText: 'Удалить',
    confirmVariant: 'danger'
  });

  if (confirmed) {
    try {
      await lessonsStore.delete(id);
      await loadData();
      toast.success('Занятие удалено');
    } catch (error) {
      toast.error('Ошибка удаления занятия');
    }
  }
};

// ============================================
//  ОТКРЫТИЕ ИЗ URL
// ============================================
const openFromUrl = async () => {
  if (isUpdatingFromUrl) return false;

  const lessonEdit = route.query.lesson_edit;

  if (lessonEdit) {
    const id = parseInt(lessonEdit, 10);
    if (!isNaN(id) && id > 0) {
      if (showForm.value && editingItem.value?.id === id) {
        return true;
      }

      if (lessonsItems.value.length === 0) {
        await lessonsStore.fetchAll();
      }
      const lesson = lessonsItems.value.find(l => l.id === id);
      if (lesson) {
        if (showForm.value && editingItem.value?.id !== id) {
          closeForm();
          await nextTick();
        }
        openEditForm(lesson);
        return true;
      } else {
        toast.warning(`Занятие с ID ${id} не найдено`);
        if (showForm.value) {
          closeForm();
        }
      }
    }
  }
  return false;
};

// ============================================
//  WATCH
// ============================================
watch(
  [() => lessonsFilters.value.status, () => lessonsFilters.value.group,
   () => lessonsFilters.value.search, () => lessonsFilters.value.dateFrom, () => lessonsFilters.value.dateTo],
  () => {
    resetPage();
  },
  { deep: true }
);

watch(currentPage, (newPage) => {
  const query = { ...route.query };
  query.l_p = newPage || 1;
  router.replace({ query });
});

watch(
  () => route.query.lesson_edit,
  async (newVal) => {
    if (isUpdatingFromUrl) return;

    if (newVal) {
      await openFromUrl();
    } else {
      if (showForm.value && !isUpdatingFromUrl) {
        isUpdatingFromUrl = true;
        showForm.value = false;
        setTimeout(() => {
          isUpdatingFromUrl = false;
        }, 500);
        appStore.closeEdit('lesson');
      }
    }
  }
);

// ============================================
//  LIFECYCLE
// ============================================
onMounted(async () => {
  await loadData();

  if (route.query.l_p) {
    const page = parseInt(route.query.l_p, 10);
    if (!isNaN(page) && page > 0) {
      currentPage.value = page;
    }
  }

  await openFromUrl();

  document.addEventListener('keydown', handleKeydown);
});

onActivated(() => {
  loadData();
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.lessons-wrapper {
  display: flex;
  gap: 20px;
}

.lessons-main {
  flex: 1;
  min-width: 0;
}

.lessons-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ============================================
   ЗАГОЛОВКИ
   ============================================ */
h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 8px;
}

h2 .title-icon {
  width: 24px;
  height: 24px;
  stroke: #212529;
}

p {
  color: #6c757d;
  margin-bottom: 16px;
}

/* ============================================
   ТУЛБАР
   ============================================ */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
}

.hotkey-hint {
  font-size: 12px;
  color: #6c757d;
}

.hotkey-hint kbd {
  background: #f1f3f5;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11px;
  border: 1px solid #dee2e6;
  font-family: inherit;
}

/* ============================================
   КНОПКИ (используются в родителе)
   ============================================ */
.btn {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn .btn-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.btn-primary {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
}

.btn-primary:hover {
  background: #0b5ed7;
  border-color: #0a58ca;
}

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline-secondary:hover {
  background: #6c757d;
  color: white;
}

/* ============================================
   ФИЛЬТРЫ
   ============================================ */
.filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.filters-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 140px;
}

.filter-group label {
  font-size: 13px;
  font-weight: 500;
  color: #495057;
  margin: 0;
}

.filter-group .form-control {
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  width: 100%;
}

.filter-group .form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.date-filters {
  min-width: 200px;
  flex: 0 0 auto;
}

.date-filters label {
  white-space: nowrap;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-input {
  min-width: 120px;
  padding: 6px 8px;
  font-size: 13px;
}

.date-separator {
  color: #6c757d;
  font-size: 14px;
  font-weight: 500;
}

.actions {
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
  flex: 0 0 auto;
}

/* ============================================
   ТАБЛИЦА
   ============================================ */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
  overflow-x: auto;
}

.lessons-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.lessons-table thead {
  background: #f8f9fa;
}

.lessons-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

/* ============================================
   САЙДБАР
   ============================================ */
.sidebar-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.sidebar-card h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sidebar-card h4 .h-icon {
  width: 16px;
  height: 16px;
  stroke: #212529;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 170px;
  overflow-y: auto;
}

.group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 13px;
  border: 1px solid transparent;
}

.group-item:hover {
  background: #f8f9fa;
  border-color: #e9ecef;
}

.group-item.active {
  background: #e7f1ff;
  border-color: #0d6efd;
  color: #0d6efd;
}

.group-item .group-name {
  font-weight: 500;
}

.group-item .group-count {
  font-size: 12px;
  color: #6c757d;
  background: #e9ecef;
  padding: 0 8px;
  border-radius: 10px;
}

.group-item.active .group-count {
  background: #0d6efd;
  color: white;
}

.group-item.empty {
  cursor: default;
  color: #6c757d;
  justify-content: center;
}

/* ============================================
   ПУСТЫЕ СОСТОЯНИЯ
   ============================================ */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-state .empty-icon {
  width: 32px;
  height: 32px;
  stroke: #6c757d;
}

.text-center {
  text-align: center;
  padding: 20px;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.text-center .loading-icon {
  width: 20px;
  height: 20px;
  stroke: #6c757d;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 1200px) {
  .lessons-sidebar {
    width: 250px;
  }
}

@media (max-width: 992px) {
  .lessons-wrapper {
    flex-direction: column;
  }

  .lessons-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .lessons-sidebar .sidebar-card {
    flex: 1;
    min-width: 200px;
  }
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: 100%;
  }

  .date-filters {
    min-width: 100%;
    flex: 1;
  }

  .date-inputs {
    flex-wrap: wrap;
  }

  .date-input {
    flex: 1;
    min-width: 80px;
  }

  .actions {
    flex-direction: row;
  }

  .lessons-table {
    font-size: 13px;
  }

  .lessons-table th {
    padding: 8px 10px;
  }
}
</style>