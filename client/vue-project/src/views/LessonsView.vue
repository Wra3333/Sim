<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useLessonsStore, useTemplatesStore, useEquipmentStore } from '../stores';
import { useFilters } from '../composables/useFilters';
import { useFilteredItems } from '../composables/useFilteredItems';
import { usePagination } from '../composables/usePagination';
import { useGroupedPagination } from '../composables/useGroupedPagination';
import { useToastStore } from '../stores/toastStore';
import { useConfirm } from '../composables/useConfirm';
import LessonForm from '../components/lessons/LessonForm.vue';
import LessonCard from '../components/lessons/LessonCard.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import ProblemLessonsAlert from '../components/ProblemLessonsAlert.vue';
import ProblemEquipmentSidebar from '../components/ProblemEquipmentSidebar.vue';
import Pagination from '../components/Pagination.vue';

// ============================================
// ✅ STORE
// ============================================
const lessonsStore = useLessonsStore();
const templatesStore = useTemplatesStore();
const equipmentStore = useEquipmentStore();
const toast = useToastStore();

const { items: lessonsItems } = storeToRefs(lessonsStore);
const { items: templatesItems } = storeToRefs(templatesStore);
const { items: equipmentItems } = storeToRefs(equipmentStore);

// ============================================
// ✅ КОМПОЗАБЛЫ
// ============================================
const { show, config, confirm, onConfirm, onCancel } = useConfirm();

// ============================================
// ✅ СОСТОЯНИЕ
// ============================================
const loading = ref(true);
const showForm = ref(false);
const editingItem = ref(null);

// ============================================
// ✅ ФИЛЬТРЫ
// ============================================
const { filters, resetFilters, setFilter } = useFilters({
  status: '',
  group: '',
  search: ''
});

// ============================================
// ✅ КОНФИГУРАЦИЯ ФИЛЬТРОВ
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
  }
};

// ============================================
// ✅ ФИЛЬТРАЦИЯ
// ============================================
const filteredLessons = useFilteredItems(lessonsItems, filters, filterConfig);

// ============================================
// ✅ ГРУППИРОВАННАЯ ПАГИНАЦИЯ
// ============================================
const {
  uniqueGroups,
  groupedItems: groupedLessons,
  getGroupCount,
  getPaginatedGroupItems,
  getGroupTotalPages,
  getGroupPage,
  getGroupShowPagination,
  setGroupPage,
  resetGroupPages,
  resetGroups
} = useGroupedPagination(filteredLessons, {
  groupBy: 'group',
  pageSize: 6,
  defaultGroup: 'Без группы'
});

// ============================================
// ✅ ПАГИНАЦИЯ ДЛЯ ВСЕГО СПИСКА
// ============================================
const {
  currentPage,
  paginatedItems,
  totalPages,
  resetPage,
  showPagination
} = usePagination(filteredLessons, { pageSize: 6 });

// ============================================
// ✅ ЗАГРУЗКА ДАННЫХ
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
    resetGroupPages();
    resetGroups();
  } catch (error) {
    console.error('Error loading data:', error);
    toast.error('❌ Ошибка загрузки данных');
  } finally {
    loading.value = false;
  }
};

// ============================================
// ✅ ПРИМЕНЕНИЕ ФИЛЬТРОВ
// ============================================
const applyFilters = () => {
  resetPage();
  resetGroupPages();
  resetGroups();
};

// ============================================
// ✅ СБРОС ФИЛЬТРОВ
// ============================================
const resetAllFilters = () => {
  resetFilters();
  resetPage();
  resetGroupPages();
  resetGroups();
};

// ============================================
// ✅ МЕТОДЫ
// ============================================
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
  const confirmed = await confirm({
    title: '✅ Завершить занятие?',
    message: 'Вы уверены, что хотите завершить это занятие?',
    confirmText: 'Да, завершить',
    confirmVariant: 'success'
  });
  
  if (confirmed) {
    try {
      await lessonsStore.complete(id);
      await loadData();
      toast.success('✅ Занятие успешно завершено!');
    } catch (error) {
      toast.error('❌ Ошибка завершения занятия');
    }
  }
};

const deleteLesson = async (id) => {
  const confirmed = await confirm({
    title: '🗑️ Удаление занятия',
    message: 'Вы уверены, что хотите удалить это занятие?',
    confirmText: 'Удалить',
    confirmVariant: 'danger'
  });
  
  if (confirmed) {
    try {
      await lessonsStore.delete(id);
      await loadData();
      toast.success('✅ Занятие удалено');
    } catch (error) {
      toast.error('❌ Ошибка удаления занятия');
    }
  }
};

// ============================================
// ✅ WATCH
// ============================================
watch(
  [() => filters.value.status, () => filters.value.group, () => filters.value.search],
  () => {
    resetPage();
    resetGroupPages();
    resetGroups();
  },
  { deep: true }
);

// ============================================
// ✅ LIFECYCLE
// ============================================
onMounted(loadData);
onActivated(loadData);
</script>

<template>
  <div class="lessons-wrapper">
    <div class="lessons-main">
      <h2>📚 Учебный журнал</h2>
      <p>Управление занятиями</p>

      <ProblemLessonsAlert 
        :lessons="lessonsItems" 
        :equipment-list="equipmentItems" 
        :on-replace-click="openEditForm" 
      />

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

        <select v-model="filters.group" class="form-control">
          <option value="">Все группы</option>
          <option v-for="group in uniqueGroups" :key="group" :value="group">
            {{ group }}
          </option>
        </select>

        <input v-model="filters.search" type="text" class="form-control" placeholder="Поиск по названию..." />

        <button class="btn btn-outline-secondary" @click="resetAllFilters">Сбросить</button>
      </div>

      <div v-if="loading" class="text-center">Загрузка...</div>
      <div v-else-if="filteredLessons.length === 0" class="empty-state">
        Нет занятий
      </div>

      <div v-else-if="!filters.group" class="lessons-list">
        <template v-for="(group, index) in groupedLessons" :key="index">
          <div class="group-header">
            <span class="group-title">📚 {{ group.group || 'Без группы' }}</span>
            <span class="group-count">{{ group.items.length }} занятий</span>
          </div>

          <div class="group-items">
            <LessonCard 
              v-for="lesson in getPaginatedGroupItems(group)" 
              :key="lesson.id" 
              :lesson="lesson"
              :templates="templatesItems" 
              @complete="completeLesson" 
              @edit="openEditForm" 
              @delete="deleteLesson" 
            />
          </div>

          <Pagination 
            v-if="getGroupShowPagination(group)"
            :current-page="getGroupPage(group.group)"
            @update:current-page="(page) => setGroupPage(group.group, page)"
            :total-pages="getGroupTotalPages(group)"
            :loading="loading"
            class="group-pagination"
          />
        </template>
      </div>

      <div v-else class="lessons-list">
        <LessonCard 
          v-for="lesson in paginatedItems" 
          :key="lesson.id" 
          :lesson="lesson" 
          :templates="templatesItems"
          @complete="completeLesson" 
          @edit="openEditForm" 
          @delete="deleteLesson" 
        />
        <Pagination 
          v-if="showPagination" 
          v-model:current-page="currentPage" 
          :total-pages="totalPages"
          :loading="loading" 
        />
      </div>

      <LessonForm 
        v-if="showForm" 
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
        :equipment-list="equipmentItems" 
        :limit="3" 
      />

      <div class="sidebar-card">
        <h4>👥 Группы</h4>
        <div class="group-list">
          <div 
            v-for="group in uniqueGroups" 
            :key="group" 
            class="group-item"
            :class="{ active: filters.group === group }" 
            @click="filters.group = group; applyFilters()"
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

<style scoped>
/* все стили без изменений */
.lessons-wrapper { display: flex; gap: 20px; }
.lessons-main { flex: 1; min-width: 0; }
.lessons-sidebar { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }
.sidebar-card { background: white; border-radius: 8px; padding: 16px; border: 1px solid #e9ecef; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06); }
.sidebar-card h4 { font-size: 14px; font-weight: 600; margin: 0 0 10px 0; color: #212529; }
.group-list { display: flex; flex-direction: column; gap: 4px; max-height: 170px; overflow-y: auto; }
.group-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-radius: 4px; cursor: pointer; transition: all 0.15s; font-size: 13px; border: 1px solid transparent; }
.group-item:hover { background: #f8f9fa; border-color: #e9ecef; }
.group-item.active { background: #e7f1ff; border-color: #0d6efd; color: #0d6efd; }
.group-item .group-name { font-weight: 500; }
.group-item .group-count { font-size: 12px; color: #6c757d; background: #e9ecef; padding: 0 8px; border-radius: 10px; }
.group-item.active .group-count { background: #0d6efd; color: white; }
.group-item.empty { cursor: default; color: #6c757d; justify-content: center; }
.group-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px; border-left: 4px solid #0d6efd; }
.group-title { font-weight: 600; font-size: 15px; color: #212529; }
.group-count { font-size: 13px; color: #6c757d; }
.group-pagination { margin: 8px 0 16px 0; }
h2 { font-size: 24px; font-weight: 600; margin-bottom: 4px; color: #212529; }
p { color: #6c757d; margin-bottom: 16px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin: 16px 0; }
.filters { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.filters .form-control { width: 180px; padding: 6px 12px; border: 1px solid #ced4da; border-radius: 4px; font-size: 14px; }
.btn { padding: 6px 16px; border: 1px solid transparent; border-radius: 4px; font-size: 14px; cursor: pointer; transition: all 0.15s; }
.btn-primary { background: #0d6efd; color: white; border-color: #0d6efd; }
.btn-primary:hover { background: #0b5ed7; border-color: #0a58ca; }
.btn-outline-secondary { background: transparent; color: #6c757d; border: 1px solid #6c757d; }
.btn-outline-secondary:hover { background: #6c757d; color: white; }
.btn-sm { padding: 4px 10px; font-size: 13px; }
.empty-state { text-align: center; padding: 40px; color: #6c757d; }
.text-center { text-align: center; padding: 20px; color: #6c757d; }
.lessons-list { display: flex; flex-direction: column; gap: 12px; }
@media (max-width: 1200px) { .lessons-sidebar { width: 250px; } }
@media (max-width: 992px) {
  .lessons-wrapper { flex-direction: column; }
  .lessons-sidebar { width: 100%; flex-direction: row; flex-wrap: wrap; }
  .lessons-sidebar .sidebar-card { flex: 1; min-width: 200px; }
}
</style>