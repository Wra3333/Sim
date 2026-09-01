<template>
  <div class="lessons-wrapper">
    <!-- ОСНОВНАЯ ЧАСТЬ -->
    <div class="lessons-main">
      <h2>📚 Учебный журнал</h2>
      <p>Управление занятиями</p>

      <!-- ✅ КОМПОНЕНТ ПРОБЛЕМНЫХ ЗАНЯТИЙ -->
      <ProblemLessonsAlert :lessons="lessons" :equipment-list="equipmentList" :on-replace-click="openEditForm" />

      <div class="toolbar">
        <button class="btn btn-primary" @click="openCreateForm">Создать занятие</button>
      </div>

      <div class="filters">
        <select v-model="filters.status" class="form-control">
          <option value="">Все статусы</option>
          <option value="Запланировано">Запланировано</option>
          <option value="Проведено">Проведено</option>
          <option value="Отменено">Отменено</option>
        </select>

        <!-- ✅ ГРУППИРОВКА ПО ГРУППАМ -->
        <select v-model="filters.group" class="form-control">
          <option value="">Все группы</option>
          <option v-for="group in uniqueGroups" :key="group" :value="group">
            {{ group }}
          </option>
        </select>

        <input v-model="filters.search" type="text" class="form-control" placeholder="Поиск по названию..." />
        <button class="btn btn-primary" @click="applyFilters">Обновить</button>
        <button class="btn btn-secondary" @click="resetFilters">Сбросить</button>
      </div>

      <div v-if="loading" class="text-center">Загрузка...</div>
      <div v-else-if="filteredLessons.length === 0" class="empty-state">
        Нет занятий
      </div>
      <div v-else class="lessons-list">
        <!-- ✅ ГРУППИРОВКА -->
        <template v-for="(group, index) in groupedLessons" :key="index">
          <div class="group-header">
            <span class="group-title">📚 {{ group.group || 'Без группы' }}</span>
            <span class="group-count">{{ group.items.length }} занятий</span>
          </div>
          <div class="lessons-list">
            <LessonCard v-for="lesson in paginatedItems" :key="lesson.id" :lesson="lesson" :templates="templates"
              @complete="completeLesson" @edit="openEditForm" @delete="confirmDelete" />
          </div>
        </template>
      </div>

      <Pagination v-if="showPagination" v-model:current-page="currentPage" :total-pages="totalPages"
        :loading="loading" />

      <LessonForm v-if="showForm" :visible="showForm" :lesson="editingItem" @close="closeForm" @save="onSaved" />

      <ConfirmModal v-model:visible="showDeleteModal" title="Удаление занятия"
        message="Вы уверены, что хотите удалить это занятие?" confirm-text="Удалить" confirm-variant="danger"
        @confirm="handleDelete" />
    </div>

    <!-- ✅ ПРАВАЯ КОЛОНКА -->
    <div class="lessons-sidebar">
      <ProblemEquipmentSidebar :lessons="lessons" :templates="templates" :equipment-list="equipmentList" :limit="3" />

      <!-- ✅ СПИСОК ГРУПП -->
      <div class="sidebar-card">
        <h4>👥 Группы</h4>
        <div class="group-list">
          <div v-for="group in uniqueGroups" :key="group" class="group-item"
            :class="{ active: filters.group === group }" @click="filters.group = group; applyFilters()">
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
import { ref, computed, onMounted, watch } from 'vue';
import { lessonsApi, templatesApi, equipmentApi } from '../api';
import LessonForm from '../components/lessons/LessonForm.vue';
import LessonCard from '../components/lessons/LessonCard.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import ProblemLessonsAlert from '../components/ProblemLessonsAlert.vue';
import ProblemEquipmentSidebar from '../components/ProblemEquipmentSidebar.vue';
import { useFilters } from '../composables/useFilters';
import { useFilteredItems } from '../composables/useFilteredItems';
import { usePagination } from '../composables/usePagination';
import { useToastStore } from '../stores/toastStore';
import Pagination from '../components/Pagination.vue';

const toast = useToastStore();

const lessons = ref([]);
const templates = ref([]);
const equipmentList = ref([]);
const loading = ref(false);
const showForm = ref(false);
const editingItem = ref(null);
const showDeleteModal = ref(false);
const deleteLessonId = ref(null);

const { filters, resetFilters } = useFilters({
  status: '',
  group: '',
  search: ''
});

// ✅ УНИКАЛЬНЫЕ ГРУППЫ
const uniqueGroups = computed(() => {
  const groups = lessons.value
    .map(l => l.group)
    .filter(g => g && g.trim() !== '');
  return [...new Set(groups)].sort();
});

// ✅ КОЛИЧЕСТВО ЗАНЯТИЙ В ГРУППЕ
const getGroupCount = (group) => {
  return lessons.value.filter(l => l.group === group).length;
};

// ✅ ФИЛЬТРАЦИЯ
const filteredLessons = computed(() => {
  let items = lessons.value;

  if (filters.value.status) {
    items = items.filter(item => item.status === filters.value.status);
  }

  if (filters.value.group) {
    items = items.filter(item => item.group === filters.value.group);
  }

  if (filters.value.search.trim()) {
    const query = filters.value.search.toLowerCase().trim();
    items = items.filter(item =>
      item.title?.toLowerCase().includes(query) ||
      item.teacher?.toLowerCase().includes(query) ||
      item.group?.toLowerCase().includes(query)
    );
  }

  return items;
});

// ✅ ГРУППИРОВКА
const groupedLessons = computed(() => {
  const items = filteredLessons.value;

  if (filters.value.group) {
    // Если выбрана конкретная группа, показываем без группировки
    return [{ group: filters.value.group, items }];
  }

  const groups = {};

  for (const lesson of items) {
    const groupName = lesson.group || 'Без группы';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(lesson);
  }

  // Сортируем группы
  const sortedGroups = Object.keys(groups).sort();
  return sortedGroups.map(group => ({
    group,
    items: groups[group]
  }));
});

const {
  currentPage,
  paginatedItems,
  totalPages,
  resetPage,
  showPagination
} = usePagination(filteredLessons, { pageSize: 6 });

const loadData = async () => {
  loading.value = true;
  try {
    const [lessonsRes, templatesRes, equipmentRes] = await Promise.all([
      lessonsApi.getAll(),
      templatesApi.getAll(),
      equipmentApi.getAll()
    ]);
    lessons.value = lessonsRes.data || [];
    templates.value = templatesRes.data || [];
    equipmentList.value = equipmentRes.data || [];
    resetPage();
  } catch (error) {
    console.error('Error loading data:', error);
    toast.error('❌ Ошибка загрузки данных');
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  resetPage();
  loadData();
};

const openCreateForm = () => {
  editingItem.value = null;
  showForm.value = true;
};

const openEditForm = (lesson) => {
  editingItem.value = lesson;
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  editingItem.value = null;
};

const onSaved = () => {
  closeForm();
  loadData();
};

const completeLesson = async (id) => {
  if (confirm('✅ Завершить занятие?')) {
    try {
      await lessonsApi.complete(id);
      await loadData();
      toast.success('✅ Занятие успешно завершено!');
    } catch (error) {
      toast.error('❌ Ошибка завершения занятия');
    }
  }
};

const confirmDelete = (id) => {
  deleteLessonId.value = id;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!deleteLessonId.value) return;

  try {
    await lessonsApi.delete(deleteLessonId.value);
    await loadData();
    toast.success('✅ Занятие удалено');
  } catch (error) {
    toast.error('❌ Ошибка удаления занятия');
  } finally {
    showDeleteModal.value = false;
    deleteLessonId.value = null;
  }
};

watch([() => filters.value.status, () => filters.value.group, () => filters.value.search], () => {
  resetPage();
}, { deep: true });

onMounted(loadData);
</script>

<style scoped>
/* ✅ ОСНОВНОЙ КОНТЕЙНЕР */
.lessons-wrapper {
  display: flex;
  gap: 20px;
}

.lessons-main {
  flex: 1;
  min-width: 0;
}

/* ✅ ПРАВАЯ КОЛОНКА */
.lessons-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

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
}

/* ✅ ГРУППЫ В САЙДБАРЕ */
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

/* ✅ ГРУППИРОВКА В ОСНОВНОМ СПИСКЕ */
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 8px;
  border-left: 4px solid #0d6efd;
}

.group-title {
  font-weight: 600;
  font-size: 15px;
  color: #212529;
}

.group-count {
  font-size: 13px;
  color: #6c757d;
}

/* Остальные стили */
h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #212529;
}

p {
  color: #6c757d;
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filters .form-control {
  width: 180px;
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.btn {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
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

.btn-secondary {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn-secondary:hover {
  background: #5c636a;
  border-color: #565e64;
}

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
  border-color: #ffc107;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.text-center {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}

.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Адаптивность */
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
</style>