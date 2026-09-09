<template>
  <div class="templates-wrapper">
    <div class="templates-main">
      <h2>
        <IconTemplates class="title-icon" />
        Перечень оборудования для занятий
      </h2>
      <p>Управление шаблонами занятий</p>

      <ProblemTemplatesAlert 
        :templates="templatesItems" 
        :equipment-list="equipmentItems" 
        :on-edit-click="openEditForm" 
      />

      <div class="toolbar">
        <button class="btn btn-primary" @click="openCreateForm">
          <IconPlus class="btn-icon" />
          Создать шаблон
        </button>
        <span class="hotkey-hint">
          <kbd>Enter</kbd> для открытия/закрытия формы
        </span>
      </div>

      <!-- ФИЛЬТРЫ -->
      <div class="filters">
        <div class="filter-group">
          <label>Статус</label>
          <select v-model="templatesFilters.status" class="form-control">
            <option value="">Все шаблоны</option>
            <option value="active">Активные</option>
            <option value="inactive">Неактивные</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Дисциплина</label>
          <select v-model="templatesFilters.discipline" class="form-control">
            <option value="">Все дисциплины</option>
            <option v-for="discipline in uniqueDisciplines" :key="discipline" :value="discipline">
              {{ discipline }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>Поиск</label>
          <input v-model="templatesFilters.search" type="text" class="form-control" placeholder="Поиск по названию..." />
        </div>

        <div class="filter-group actions">
          <button class="btn btn-outline-secondary" @click="resetAllFilters">
            <IconReset class="btn-icon" />
            Сбросить
          </button>
        </div>
      </div>

      <!-- СПИСОК -->
      <div v-if="loading" class="text-center">
        <IconLoading class="loading-icon" />
        Загрузка...
      </div>
      <div v-else-if="filteredTemplates.length === 0" class="empty-state">
        <IconList class="empty-icon" />
        <span>Нет шаблонов</span>
      </div>

      <!-- ТАБЛИЦА -->
      <div v-else class="table-container">
        <table class="templates-table">
          <thead>
            <tr>
              <th style="width: 80px;">ID</th>
              <th style="min-width: 150px;">Название</th>
              <th style="min-width: 120px;">Дисциплина</th>
              <th style="min-width: 150px;">Оборудование</th>
              <th style="width: 100px;">Статус</th>
              <th style="width: 130px;">Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="template in paginatedItems" 
              :key="template.id"
              @click="handleRowClick(template)"
            >
              <td class="template-id">#{{ template.id }}</td>
              <td>
                <strong>{{ template.title }}</strong>
                <span v-if="template.description" class="template-desc">{{ template.description }}</span>
              </td>
              <td>{{ template.discipline || '—' }}</td>
              <td>
                <div class="equipment-preview">
                  <span 
                    v-for="(item, index) in getEquipmentPreview(template)" 
                    :key="index"
                    class="equipment-tag"
                  >
                    {{ item }}
                  </span>
                  <span v-if="getEquipmentCount(template) > 3" class="equipment-tag more">
                    +{{ getEquipmentCount(template) - 3 }}
                  </span>
                  <span v-if="getEquipmentCount(template) === 0" class="no-equipment">—</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="template.is_active ? 'badge-success' : 'badge-secondary'">
                  <IconCheck v-if="template.is_active" class="badge-icon" />
                  <IconAlert v-else class="badge-icon" />
                  {{ template.is_active ? 'Активен' : 'Неактивен' }}
                </span>
              </td>
              <td @click.stop>
                <div class="table-actions">
                  <button 
                    class="btn btn-sm btn-outline-primary" 
                    @click="openEditForm(template)" 
                    title="Редактировать"
                  >
                    <IconEdit class="btn-icon" />
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-danger" 
                    @click="deleteTemplate(template.id)" 
                    title="Удалить"
                  >
                    <IconTrash class="btn-icon" />
                  </button>
                </div>
              </td>
            </tr>
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

      <!-- ФОРМА -->
      <TemplateFormDrawer 
        :visible="showForm" 
        :template="editingItem" 
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

    <div class="templates-sidebar">
      <ProblemEquipmentSidebar 
        :lessons="lessonsItems" 
        :templates="templatesItems" 
        :equipment-list="equipmentItems" 
        :limit="3" 
        :show-actions="false" 
        :on-lesson-click="(id) => router.push(`/lessons/${id}`)"
        :on-equipment-click="(id) => router.push(`/equipment/${id}`)"
        :on-template-click="(id) => router.push(`/templates/${id}`)" 
      />

      <div class="sidebar-card">
        <h4>
          <IconList class="h-icon" />
          Дисциплины
        </h4>
        <div class="filter-list">
          <div 
            v-for="discipline in uniqueDisciplines" 
            :key="discipline" 
            class="filter-item"
            :class="{ active: templatesFilters.discipline === discipline }"
            @click="templatesFilters.discipline = discipline; applyFilters()"
          >
            <span class="filter-name">{{ discipline }}</span>
            <span class="filter-count">{{ getDisciplineCount(discipline) }}</span>
          </div>
          <div v-if="uniqueDisciplines.length === 0" class="filter-item empty">
            Нет дисциплин
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
import { useTemplatesStore, useLessonsStore, useEquipmentStore } from '../stores';
import { useAppStore } from '../stores/appStore';
import { useToastStore } from '../stores/toastStore';
import { useConfirm } from '../composables/useConfirm';
import TemplateFormDrawer from '../components/templates/TemplateFormDrawer.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import ProblemEquipmentSidebar from '../components/ProblemEquipmentSidebar.vue';
import ProblemTemplatesAlert from '../components/ProblemTemplatesAlert.vue';
import Pagination from '../components/Pagination.vue';
import {
  IconTemplates,
  IconPlus,
  IconReset,
  IconList,
  IconLoading,
  IconCheck,
  IconAlert,
  IconEdit,
  IconTrash,
  IconUsers
} from '../components/icons';

// ============================================
// ROUTER
// ============================================
const router = useRouter();
const route = useRoute();

// ============================================
// STORE
// ============================================
const appStore = useAppStore();
const templatesStore = useTemplatesStore();
const lessonsStore = useLessonsStore();
const equipmentStore = useEquipmentStore();
const toast = useToastStore();

const { show, config, confirm, onConfirm, onCancel } = useConfirm();

const { items: templatesItems } = storeToRefs(templatesStore);
const { items: lessonsItems } = storeToRefs(lessonsStore);
const { items: equipmentItems } = storeToRefs(equipmentStore);
const { filters, pagination, editing } = storeToRefs(appStore);

// ============================================
// СОСТОЯНИЕ
// ============================================
const loading = ref(true);
const showForm = ref(false);
const editingItem = ref(null);
let isUpdatingFromUrl = false;

// ============================================
// ФИЛЬТРЫ ИЗ APPSTORE
// ============================================
const templatesFilters = computed({
  get: () => filters.value.templates || { status: '', discipline: '', search: '' },
  set: (val) => {
    filters.value.templates = val;
  }
});

// ============================================
// ПАГИНАЦИЯ ИЗ APPSTORE
// ============================================
const templatesPagination = computed({
  get: () => pagination.value.templates || { page: 1, size: 7 },
  set: (val) => {
    pagination.value.templates = val;
  }
});

// Текущая страница
const currentPage = computed({
  get: () => templatesPagination.value.page || 1,
  set: (val) => {
    templatesPagination.value = { ...templatesPagination.value, page: val };
  }
});

// ============================================
// ФИЛЬТРАЦИЯ
// ============================================
const filterConfig = {
  status: {
    filterFn: (item, value) => {
      if (!value) return true;
      if (value === 'active') return item.is_active === true;
      if (value === 'inactive') return item.is_active === false;
      return true;
    }
  },
  discipline: {
    filterFn: (item, value) => {
      if (!value) return true;
      return item.discipline === value;
    }
  },
  search: {
    filterFn: (item, value) => {
      if (!value) return true;
      const query = value.toLowerCase().trim();
      return item.title?.toLowerCase().includes(query) ||
             item.discipline?.toLowerCase().includes(query);
    }
  }
};

const filteredTemplates = computed(() => {
  const list = [...templatesItems.value];
  const allFilters = { ...templatesFilters.value };
  
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
// УНИКАЛЬНЫЕ ЗНАЧЕНИЯ
// ============================================
const uniqueDisciplines = computed(() => {
  const disciplines = templatesItems.value
    .map(t => t.discipline)
    .filter(d => d && d.trim() !== '');
  return [...new Set(disciplines)].sort();
});

const getDisciplineCount = (discipline) => {
  return templatesItems.value.filter(t => t.discipline === discipline).length;
};

// ============================================
// ОБОРУДОВАНИЕ В ШАБЛОНЕ
// ============================================
const getEquipmentList = (template) => {
  if (!template.equipment_list) return [];
  try {
    return typeof template.equipment_list === 'string' 
      ? JSON.parse(template.equipment_list) 
      : template.equipment_list;
  } catch {
    return [];
  }
};

const getEquipmentCount = (template) => {
  return getEquipmentList(template).length;
};

const getEquipmentPreview = (template) => {
  const list = getEquipmentList(template);
  return list.slice(0, 3).map(item => {
    const eq = equipmentItems.value.find(e => e.id === item.equipment_id);
    return eq ? eq.name : 'Оборудование #' + item.equipment_id;
  });
};

// ============================================
// ПАГИНАЦИЯ
// ============================================
const pageSize = 7;

const totalPages = computed(() => {
  return Math.ceil(filteredTemplates.value.length / pageSize) || 1;
});

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredTemplates.value.slice(start, end);
});

const showPagination = computed(() => {
  return filteredTemplates.value.length > pageSize;
});

const resetPage = () => {
  currentPage.value = 1;
};

// ============================================
// ЗАГРУЗКА ДАННЫХ
// ============================================
const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      templatesStore.fetchAll(),
      lessonsStore.fetchAll(),
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
  appStore.resetFilters('templates');
  resetPage();
};

// ============================================
// ХОТКЕЙ: ENTER
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
// МЕТОДЫ
// ============================================
const openCreateForm = () => {
  isUpdatingFromUrl = true;
  editingItem.value = null;
  showForm.value = true;
  appStore.closeEdit('template');
  const query = { ...route.query };
  delete query.template_edit;
  router.replace({ query });
  setTimeout(() => {
    isUpdatingFromUrl = false;
  }, 100);
};

const openEditForm = (template) => {
  if (!template) return;
  isUpdatingFromUrl = true;
  editingItem.value = template;
  showForm.value = true;
  if (template.id) {
    appStore.openEdit('template', template.id);
  }
  setTimeout(() => {
    isUpdatingFromUrl = false;
  }, 100);
};

const closeForm = () => {
  isUpdatingFromUrl = true;
  showForm.value = false;
  setTimeout(() => {
    editingItem.value = null;
  }, 500);
  appStore.closeEdit('template');
  const query = { ...route.query };
  if (query.template_edit) {
    delete query.template_edit;
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

const handleRowClick = (template) => {
  openEditForm(template);
};

const deleteTemplate = async (id) => {
  const confirmed = await confirm({
    title: 'Удаление шаблона',
    message: 'Вы уверены, что хотите удалить этот шаблон?',
    confirmText: 'Удалить',
    confirmVariant: 'danger'
  });

  if (confirmed) {
    try {
      await templatesStore.delete(id);
      await loadData();
      toast.success('Шаблон удалён');
    } catch (error) {
      toast.error('Ошибка: ' + (error.response?.data?.message || error.message));
    }
  }
};

// ============================================
// ОТКРЫТИЕ ИЗ URL
// ============================================
const openFromUrl = async () => {
  if (isUpdatingFromUrl) return false;
  
  const templateEdit = route.query.template_edit;
  
  if (templateEdit) {
    const id = parseInt(templateEdit, 10);
    if (!isNaN(id) && id > 0) {
      if (showForm.value && editingItem.value?.id === id) {
        return true;
      }

      if (templatesItems.value.length === 0) {
        await templatesStore.fetchAll();
      }
      const template = templatesItems.value.find(t => t.id === id);
      if (template) {
        if (showForm.value && editingItem.value?.id !== id) {
          closeForm();
          await nextTick();
        }
        openEditForm(template);
        return true;
      } else {
        toast.warning(`Шаблон с ID ${id} не найден`);
        if (showForm.value) {
          closeForm();
        }
      }
    }
  }
  return false;
};

// ============================================
// WATCH
// ============================================
watch(
  [() => templatesFilters.value.status, () => templatesFilters.value.discipline, () => templatesFilters.value.search],
  () => {
    resetPage();
  },
  { deep: true }
);

// При изменении страницы - сохраняем в URL
watch(currentPage, (newPage) => {
  const query = { ...route.query };
  query.t_p = newPage || 1;
  router.replace({ query });
});

// Исправленный watch для URL параметра
watch(
  () => route.query.template_edit,
  async (newVal) => {
    if (isUpdatingFromUrl) return;
    
    if (newVal) {
      await openFromUrl();
    } else {
      if (showForm.value && !isUpdatingFromUrl) {
        isUpdatingFromUrl = true;
        showForm.value = false;
        setTimeout(() => {
          editingItem.value = null;
          isUpdatingFromUrl = false;
        }, 500);
        appStore.closeEdit('template');
      }
    }
  }
);

// ============================================
// LIFECYCLE
// ============================================
onMounted(async () => {
  await loadData();
  
  if (route.query.t_p) {
    const page = parseInt(route.query.t_p, 10);
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
.templates-wrapper {
  display: flex;
  gap: 20px;
}

.templates-main {
  flex: 1;
  min-width: 0;
}

.templates-sidebar {
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
  font-size: 13px;
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

.btn-sm {
  padding: 4px 10px;
  font-size: 13px;
}

.btn-outline-primary {
  background: transparent;
  color: #0d6efd;
  border: 1px solid #0d6efd;
}

.btn-outline-primary:hover {
  background: #0d6efd;
  color: white;
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

/* ============================================
   ФИЛЬТРЫ
   ============================================ */
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
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

.actions {
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
  padding-top: 0;
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

.templates-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.templates-table thead {
  background: #f8f9fa;
}

.templates-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.templates-table td {
  padding: 10px 16px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

.templates-table tbody tr {
  cursor: pointer;
  transition: background 0.15s;
}

.templates-table tbody tr:hover {
  background: #f0f7ff;
}

.templates-table td:last-child {
  cursor: default;
}

.template-id {
  font-weight: 600;
  color: #0d6efd;
}

.template-desc {
  display: block;
  font-size: 12px;
  color: #6c757d;
}

.equipment-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.equipment-tag {
  display: inline-block;
  background: #e8f0fe;
  color: #1a73e8;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 11px;
  white-space: nowrap;
}

.equipment-tag.more {
  background: #e9ecef;
  color: #495057;
}

.no-equipment {
  color: #adb5bd;
  font-size: 13px;
}

/* ============================================
   БЕЙДЖИ
   ============================================ */
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge .badge-icon {
  width: 12px;
  height: 12px;
  stroke: currentColor;
}

.badge-success {
  background: #d4edda;
  color: #155724;
}

.badge-secondary {
  background: #e9ecef;
  color: #495057;
}

/* ============================================
   ДЕЙСТВИЯ В ТАБЛИЦЕ
   ============================================ */
.table-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.table-actions .btn {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.table-actions .btn .btn-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
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

.filter-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 150px;
  overflow-y: auto;
}

.filter-item {
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

.filter-item:hover {
  background: #f8f9fa;
  border-color: #e9ecef;
}

.filter-item.active {
  background: #e7f1ff;
  border-color: #0d6efd;
  color: #0d6efd;
}

.filter-item .filter-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-item .filter-count {
  font-size: 12px;
  color: #6c757d;
  background: #e9ecef;
  padding: 0 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

.filter-item.active .filter-count {
  background: #0d6efd;
  color: white;
}

.filter-item.empty {
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
  .templates-sidebar {
    width: 250px;
  }
}

@media (max-width: 992px) {
  .templates-wrapper {
    flex-direction: column;
  }
  
  .templates-sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .templates-sidebar .sidebar-card {
    flex: 1;
    min-width: 200px;
  }
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .actions {
    flex-direction: row;
  }
  
  .templates-table {
    font-size: 13px;
  }
  
  .templates-table th,
  .templates-table td {
    padding: 8px 10px;
  }
}
</style>