<script setup>
import { ref, onMounted, onActivated, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useTemplatesStore, useLessonsStore, useEquipmentStore } from '../stores';
import { useFilters } from '../composables/useFilters';
import { useFilteredItems } from '../composables/useFilteredItems';
import { usePagination } from '../composables/usePagination';
import { useToastStore } from '../stores/toastStore';
import { useConfirm } from '../composables/useConfirm';
import TemplateForm from '../components/templates/TemplateForm.vue';
import TemplateCard from '../components/templates/TemplateCard.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import ProblemEquipmentSidebar from '../components/ProblemEquipmentSidebar.vue';
import ProblemTemplatesAlert from '../components/ProblemTemplatesAlert.vue';
import Pagination from '../components/Pagination.vue';

const router = useRouter();

const templatesStore = useTemplatesStore();
const lessonsStore = useLessonsStore();
const equipmentStore = useEquipmentStore();
const toast = useToastStore();

const { items: templatesItems } = storeToRefs(templatesStore);
const { items: lessonsItems } = storeToRefs(lessonsStore);
const { items: equipmentItems } = storeToRefs(equipmentStore);

const { show, config, confirm, onConfirm, onCancel } = useConfirm();

const loading = ref(true);
const showForm = ref(false);
const editingItem = ref(null);

const { filters, resetFilters, setFilter } = useFilters({
  status: '',
  discipline: '',
  module: '',
  search: ''
});

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
  module: {
    filterFn: (item, value) => {
      if (!value) return true;
      return item.module === value;
    }
  },
  search: {
    filterFn: (item, value) => {
      if (!value) return true;
      const query = value.toLowerCase().trim();
      return item.title?.toLowerCase().includes(query) ||
             item.discipline?.toLowerCase().includes(query) ||
             item.module?.toLowerCase().includes(query);
    }
  }
};

const filteredTemplates = useFilteredItems(templatesItems, filters, filterConfig);

const uniqueDisciplines = computed(() => {
  const disciplines = templatesItems.value
    .map(t => t.discipline)
    .filter(d => d && d.trim() !== '');
  return [...new Set(disciplines)].sort();
});

const uniqueModules = computed(() => {
  const modules = templatesItems.value
    .map(t => t.module)
    .filter(m => m && m.trim() !== '');
  return [...new Set(modules)].sort();
});

const getDisciplineCount = (discipline) => {
  return templatesItems.value.filter(t => t.discipline === discipline).length;
};

const getModuleCount = (module) => {
  return templatesItems.value.filter(t => t.module === module).length;
};

const {
  currentPage,
  paginatedItems,
  totalPages,
  resetPage,
  showPagination
} = usePagination(filteredTemplates, { pageSize: 5 });

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
    toast.error('❌ Ошибка загрузки данных');
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  resetPage();
};

const resetAllFilters = () => {
  resetFilters();
  resetPage();
};

const openCreateForm = () => {
  editingItem.value = null;
  showForm.value = true;
};

const openEditForm = (template) => {
  editingItem.value = template;
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

const confirmDelete = async (id) => {
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
      toast.success('✅ Шаблон удалён');
    } catch (error) {
      toast.error('Ошибка: ' + (error.response?.data?.message || error.message));
    }
  }
};

watch(
  [() => filters.value.status, () => filters.value.discipline, () => filters.value.module, () => filters.value.search],
  () => {
    resetPage();
  },
  { deep: true }
);

onMounted(loadData);
onActivated(loadData);
</script>

<template>
  <div class="templates-wrapper">
    <div class="templates-main">
      <h2>📋 Перечень оборудования для занятий</h2>
      <p>Управление шаблонами занятий</p>

      <ProblemTemplatesAlert 
        :templates="templatesItems" 
        :equipment-list="equipmentItems" 
        :on-edit-click="openEditForm" 
      />

      <div class="toolbar">
        <button class="btn btn-primary" @click="openCreateForm">Создать шаблон</button>
      </div>

      <div class="filters">
        <select v-model="filters.status" class="form-control">
          <option value="">Все шаблоны</option>
          <option value="active">Активные</option>
          <option value="inactive">Неактивные</option>
        </select>

        <select v-model="filters.discipline" class="form-control">
          <option value="">Все дисциплины</option>
          <option v-for="discipline in uniqueDisciplines" :key="discipline" :value="discipline">
            {{ discipline }}
          </option>
        </select>

        <select v-model="filters.module" class="form-control">
          <option value="">Все модули</option>
          <option v-for="module in uniqueModules" :key="module" :value="module">
            {{ module }}
          </option>
        </select>

        <input v-model="filters.search" type="text" class="form-control" placeholder="Поиск по названию..." />

        <button class="btn btn-outline-secondary" @click="resetAllFilters">Сбросить</button>
      </div>

      <div v-if="loading" class="text-center">Загрузка...</div>
      <div v-else-if="filteredTemplates.length === 0" class="empty-state">
        Нет шаблонов
      </div>
      <div v-else class="templates-list">
        <TemplateCard 
          v-for="template in paginatedItems" 
          :key="template.id" 
          :template="template"
          :equipment-list="equipmentItems" 
          @edit="openEditForm" 
          @delete="confirmDelete" 
        />
      </div>

      <Pagination 
        v-if="showPagination" 
        v-model:current-page="currentPage" 
        :total-pages="totalPages"
        :loading="loading" 
      />

      <TemplateForm 
        v-if="showForm" 
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
        <h4>📚 Дисциплины</h4>
        <div class="filter-list">
          <div 
            v-for="discipline in uniqueDisciplines" 
            :key="discipline" 
            class="filter-item"
            :class="{ active: filters.discipline === discipline }"
            @click="filters.discipline = discipline; applyFilters()"
          >
            <span class="filter-name">{{ discipline }}</span>
            <span class="filter-count">{{ getDisciplineCount(discipline) }}</span>
          </div>
          <div v-if="uniqueDisciplines.length === 0" class="filter-item empty">
            Нет дисциплин
          </div>
        </div>
      </div>

      <div class="sidebar-card">
        <h4>📦 Модули</h4>
        <div class="filter-list">
          <div 
            v-for="module in uniqueModules" 
            :key="module" 
            class="filter-item"
            :class="{ active: filters.module === module }" 
            @click="filters.module = module; applyFilters()"
          >
            <span class="filter-name">{{ module }}</span>
            <span class="filter-count">{{ getModuleCount(module) }}</span>
          </div>
          <div v-if="uniqueModules.length === 0" class="filter-item empty">
            Нет модулей
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.templates-wrapper { display: flex; gap: 20px; }
.templates-main { flex: 1; min-width: 0; }
.templates-sidebar { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }
.sidebar-card { background: white; border-radius: 8px; padding: 16px; border: 1px solid #e9ecef; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06); }
.sidebar-card h4 { font-size: 14px; font-weight: 600; margin: 0 0 10px 0; color: #212529; }
.filter-list { display: flex; flex-direction: column; gap: 4px; max-height: 150px; overflow-y: auto; }
.filter-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-radius: 4px; cursor: pointer; transition: all 0.15s; font-size: 13px; border: 1px solid transparent; }
.filter-item:hover { background: #f8f9fa; border-color: #e9ecef; }
.filter-item.active { background: #e7f1ff; border-color: #0d6efd; color: #0d6efd; }
.filter-item .filter-name { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.filter-item .filter-count { font-size: 12px; color: #6c757d; background: #e9ecef; padding: 0 8px; border-radius: 10px; flex-shrink: 0; }
.filter-item.active .filter-count { background: #0d6efd; color: white; }
.filter-item.empty { cursor: default; color: #6c757d; justify-content: center; }
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
.empty-state { text-align: center; padding: 40px; color: #6c757d; }
.text-center { text-align: center; padding: 20px; color: #6c757d; }
.templates-list { display: flex; flex-direction: column; gap: 12px; }
@media (max-width: 1200px) { .templates-sidebar { width: 250px; } }
@media (max-width: 992px) {
  .templates-wrapper { flex-direction: column; }
  .templates-sidebar { width: 100%; flex-direction: row; flex-wrap: wrap; }
  .templates-sidebar .sidebar-card { flex: 1; min-width: 200px; }
}
</style>