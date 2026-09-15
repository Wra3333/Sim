<template>
  <div class="lessons-wrapper">
    <div class="lessons-main">
      <h2>
        <IconLessons class="title-icon" />
        Учебный журнал
      </h2>
      <p>Управление занятиями</p>

      <ProblemLessonsAlert
        v-if="!loading"
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
            <input
              v-model="lessonsFilters.search"
              type="text"
              class="form-control"
              placeholder="Поиск по названию..."
            />
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

      <!-- СКЕЛЕТОН -->
      <LessonsTableSkeleton v-if="loading" />

      <!-- ПУСТО -->
      <div v-else-if="filteredLessons.length === 0" class="empty-state">
        <IconList class="empty-icon" />
        <span>Нет занятий</span>
      </div>

      <!-- ТАБЛИЦА -->
      <div v-else class="table-container">
        <table class="lessons-table">
          <thead>
            <tr>
              <th
                class="sortable"
                :class="{ 'sort-active': sortField === 'created_at' }"
                style="width: 110px;"
                @click="toggleSort('created_at')"
              >
                Дата создания
                <span class="sort-icon" v-if="sortField === 'created_at'">
                  {{ sortDirection === 'desc' ? '↓' : '↑' }}
                </span>
              </th>
              <th style="min-width: 180px;">Образование</th>
              <th
                class="sortable"
                :class="{ 'sort-active': sortField === 'title' }"
                style="min-width: 150px;"
                @click="toggleSort('title')"
              >
                Название
                <span class="sort-icon" v-if="sortField === 'title'">
                  {{ sortDirection === 'desc' ? '↓' : '↑' }}
                </span>
              </th>
              <th style="min-width: 130px;">Группа</th>
              <th style="min-width: 120px;">Преподаватель</th>
              <th
                class="sortable"
                :class="{ 'sort-active': sortField === 'date' }"
                style="width: 160px;"
                @click="toggleSort('date')"
              >
                Когда
                <span class="sort-icon" v-if="sortField === 'date'">
                  {{ sortDirection === 'desc' ? '↓' : '↑' }}
                </span>
              </th>
              <th style="width: 90px;">Студентов</th>
              <th
                class="sortable"
                :class="{ 'sort-active': sortField === 'status' }"
                style="width: 140px;"
                @click="toggleSort('status')"
              >
                Статус
                <span class="sort-icon" v-if="sortField === 'status'">
                  {{ sortDirection === 'desc' ? '↓' : '↑' }}
                </span>
              </th>
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
        v-if="!loading && showPagination"
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

      <LessonsAdvancedFilters />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { useLessonsStore, useTemplatesStore, useEquipmentStore } from '../stores';
import { useUiStore } from '../stores/ui.store';
import { useToastStore } from '../stores/toastStore';
import { useUrlSync } from '../composables/useUrlSync';
import { useConfirm } from '../composables/useConfirm';
import LessonCard from '../components/lessons/LessonCard.vue';
import LessonFormDrawer from '../components/lessons/LessonFormDrawer.vue';
import LessonsTableSkeleton from '../components/lessons/LessonsTableSkeleton.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import ProblemLessonsAlert from '../components/ProblemLessonsAlert.vue';
import ProblemEquipmentSidebar from '../components/ProblemEquipmentSidebar.vue';
import LessonsAdvancedFilters from '../components/lessons/LessonsAdvancedFilters.vue';
import Pagination from '../components/Pagination.vue';
import {
  IconLessons,
  IconPlus,
  IconReset,
  IconList
} from '../components/icons';

// ============================================
//  STORE
// ============================================
const uiStore = useUiStore();
const lessonsStore = useLessonsStore();
const templatesStore = useTemplatesStore();
const equipmentStore = useEquipmentStore();
const toast = useToastStore();

const { show, config, confirm, onConfirm, onCancel } = useConfirm();

const { items: lessonsItems } = storeToRefs(lessonsStore);
const { items: templatesItems } = storeToRefs(templatesStore);
const { allEquipment } = storeToRefs(equipmentStore);
const { filters, pagination, editing } = storeToRefs(uiStore);

// ============================================
//  URL ↔ STORE
// ============================================
const { openFromUrl } = useUrlSync({
  resolvers: {
    lesson: async (id) => {
      if (lessonsItems.value.length === 0) {
        await lessonsStore.fetchAll();
      }
      return lessonsItems.value.find((l) => l.id === id) ?? null;
    }
  }
});

// ============================================
//  СОСТОЯНИЕ
// ============================================
const loading = ref(true);

// ============================================
//  DRAWER
// ============================================
const editingItem = computed(() =>
  lessonsItems.value.find((l) => l.id === editing.value.lesson) || null
);

const showForm = computed({
  get: () =>
    (editing.value.lesson !== null && editingItem.value !== null)
    || uiStore.creating.lesson,
  set: (val) => {
    if (!val) uiStore.closeEdit('lesson');
  }
});

// ============================================
//  ФИЛЬТРЫ И СОРТИРОВКА
// ============================================
const lessonsFilters = computed({
  get: () => filters.value.lessons || {
    status: '',
    group: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    faculty: '',
    specialty: '',
    course: '',
    participant_type: '',
    teacher: '',
    sortField: 'created_at',
    sortDirection: 'desc'
  },
  set: (val) => { filters.value.lessons = val; }
});

const sortField = computed({
  get: () => lessonsFilters.value.sortField || 'created_at',
  set: (val) => {
    lessonsFilters.value = { ...lessonsFilters.value, sortField: val };
  }
});

const sortDirection = computed({
  get: () => lessonsFilters.value.sortDirection || 'desc',
  set: (val) => {
    lessonsFilters.value = { ...lessonsFilters.value, sortDirection: val };
  }
});

const toggleSort = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc';
  } else {
    sortField.value = field;
    sortDirection.value = 'desc';
  }
  resetPage();
};

// ============================================
//  ПАГИНАЦИЯ
// ============================================
const lessonsPagination = computed({
  get: () => pagination.value.lessons || { page: 1, size: 7 },
  set: (val) => { pagination.value.lessons = val; }
});

const currentPage = computed({
  get: () => lessonsPagination.value.page || 1,
  set: (val) => { lessonsPagination.value = { ...lessonsPagination.value, page: val }; }
});

// ============================================
//  ФИЛЬТРАЦИЯ + СОРТИРОВКА
// ============================================
const filterConfig = {
  status: {
    filterFn: (item, value) => !value || item.status === value
  },
  group: {
    filterFn: (item, value) => !value || item.group === value
  },
  faculty: {
    filterFn: (item, value) => !value || item.faculty === value
  },
  specialty: {
    filterFn: (item, value) => !value || item.specialty === value
  },
  course: {
    filterFn: (item, value) => !value || String(item.course) === String(value)
  },
  participant_type: {
    filterFn: (item, value) => !value || item.participant_type === value
  },
  teacher: {
    filterFn: (item, value) => !value || item.teacher === value
  },
  search: {
    filterFn: (item, value) => {
      if (!value) return true;
      const query = value.toLowerCase().trim();
      return item.title?.toLowerCase().includes(query)
          || item.teacher?.toLowerCase().includes(query)
          || item.group?.toLowerCase().includes(query);
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

  const field = sortField.value;
  const dir = sortDirection.value === 'desc' ? -1 : 1;

  list.sort((a, b) => {
    let va, vb;

    if (field === 'created_at') {
      va = new Date(a.created_at).getTime() || 0;
      vb = new Date(b.created_at).getTime() || 0;
      return (va - vb) * dir;
    }

    if (field === 'date') {
      va = new Date(a.date).getTime() || 0;
      vb = new Date(b.date).getTime() || 0;
      return (va - vb) * dir;
    }

    if (field === 'title') {
      va = (a.title || '').toLowerCase();
      vb = (b.title || '').toLowerCase();
    } else if (field === 'status') {
      const order = { 'Запланировано': 0, 'Проведено': 1, 'Отменено': 2 };
      va = order[a.status] ?? 99;
      vb = order[b.status] ?? 99;
    } else {
      return 0;
    }

    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });

  const allFilters = { ...lessonsFilters.value };

  return list.filter(item => {
    let result = true;
    for (const [key, cfg] of Object.entries(filterConfig)) {
      const filterValue = allFilters[key];
      if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
        if (Array.isArray(filterValue)) {
          if (filterValue.length > 0) {
            result = result && cfg.filterFn(item, filterValue);
          }
        } else {
          result = result && cfg.filterFn(item, filterValue);
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
    .map((item) => item.group)
    .filter((g) => g && g.trim() !== '');
  return [...new Set(groups)].sort();
});

// ============================================
//  ПАГИНАЦИЯ
// ============================================
const pageSize = 7;
const resetPage = () => { currentPage.value = 1; };

const totalPages = computed(() =>
  Math.ceil(filteredLessons.value.length / pageSize) || 1
);

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredLessons.value.slice(start, start + pageSize);
});

const showPagination = computed(() => filteredLessons.value.length > pageSize);

// ============================================
//  ЗАГРУЗКА
// ============================================
const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      lessonsStore.fetchAll(),
      templatesStore.fetchAll(),
      equipmentStore.fetchAll()
    ]);
  } catch (error) {
    console.error('Error loading data:', error);
    toast.error('Ошибка загрузки данных');
  } finally {
    loading.value = false;
  }
};

const resetAllFilters = () => {
  uiStore.resetFilters('lessons');
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
      if (showForm.value) closeForm();
      else openCreateForm();
    }
  }
};

// ============================================
//  МЕТОДЫ
// ============================================
const openCreateForm = () => uiStore.openCreate('lesson');

const openEditForm = (lesson) => {
  if (!lesson?.id) return;
  uiStore.openEdit('lesson', lesson.id);
};

const closeForm = () => uiStore.closeEdit('lesson');

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
//  WATCH
// ============================================
watch(
  [
    () => lessonsFilters.value.status,
    () => lessonsFilters.value.group,
    () => lessonsFilters.value.faculty,
    () => lessonsFilters.value.specialty,
    () => lessonsFilters.value.course,
    () => lessonsFilters.value.participant_type,
    () => lessonsFilters.value.teacher,
    () => lessonsFilters.value.search,
    () => lessonsFilters.value.dateFrom,
    () => lessonsFilters.value.dateTo
  ],
  () => {
    resetPage();
  },
  { deep: true }
);

// ============================================
//  LIFECYCLE
// ============================================
onMounted(async () => {
  await loadData();

  const { found, item, id } = await openFromUrl('lesson');
  if (found) openEditForm(item);
  else if (id) toast.warning(`Занятие с ID ${id} не найдено`);

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
   КНОПКИ
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
   СОРТИРУЕМЫЕ ЗАГОЛОВКИ
   ============================================ */
.lessons-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.lessons-table th.sortable:hover {
  background: #e9ecef;
}

.lessons-table th.sort-active {
  color: #0d6efd;
}

.sort-icon {
  display: inline-block;
  margin-left: 4px;
  font-size: 12px;
  color: #0d6efd;
  font-weight: 700;
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