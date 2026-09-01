<template>
  <div class="templates-wrapper">
    <div class="templates-main">
      <h2>📋 Перечень оборудования для занятий</h2>
      <p>Управление шаблонами занятий</p>

      <!-- ✅ КОМПОНЕНТ ПРОБЛЕМНЫХ ШАБЛОНОВ -->
      <ProblemTemplatesAlert :templates="templates" :equipment-list="equipmentList" :on-edit-click="openEditForm" />

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
        <button class="btn btn-primary" @click="applyFilters">Обновить</button>
        <button class="btn btn-secondary" @click="resetFilters">Сбросить</button>
      </div>

      <div v-if="loading" class="text-center">Загрузка...</div>
      <div v-else-if="filteredTemplates.length === 0" class="empty-state">
        Нет шаблонов
      </div>
      <div v-else class="templates-list">
        <TemplateCard v-for="template in paginatedItems" :key="template.id" :template="template"
          :equipment-list="equipmentList" @edit="openEditForm" @delete="confirmDelete" />
      </div>

      <Pagination v-if="showPagination" v-model:current-page="currentPage" :total-pages="totalPages"
        :loading="loading" />

      <TemplateForm v-if="showForm" :visible="showForm" :template="editingItem" @close="closeForm" @save="onSaved" />

      <ConfirmModal v-model:visible="showDeleteModal" title="Удаление шаблона"
        message="Вы уверены, что хотите удалить этот шаблон?" confirm-text="Удалить" confirm-variant="danger"
        @confirm="handleDelete" />
    </div>

    <div class="templates-sidebar">
      <ProblemEquipmentSidebar :lessons="lessons" :templates="templates" :equipment-list="equipmentList" :limit="3"
        :show-actions="false" :on-lesson-click="(id) => router.push(`/lessons/${id}`)"
        :on-equipment-click="(id) => router.push(`/equipment/${id}`)"
        :on-template-click="(id) => router.push(`/templates/${id}`)" />

      <div class="sidebar-card">
        <h4>📚 Дисциплины</h4>
        <div class="filter-list">
          <div v-for="discipline in uniqueDisciplines" :key="discipline" class="filter-item"
            :class="{ active: filters.discipline === discipline }"
            @click="filters.discipline = discipline; applyFilters()">
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
          <div v-for="module in uniqueModules" :key="module" class="filter-item"
            :class="{ active: filters.module === module }" @click="filters.module = module; applyFilters()">
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

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { templatesApi, lessonsApi, equipmentApi } from '../api';
import TemplateForm from '../components/templates/TemplateForm.vue';
import TemplateCard from '../components/templates/TemplateCard.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import ProblemEquipmentSidebar from '../components/ProblemEquipmentSidebar.vue';
import ProblemTemplatesAlert from '../components/ProblemTemplatesAlert.vue';
import { useCrud } from '../composables/useCrud';
import { useFilters } from '../composables/useFilters';
import { useFilteredItems } from '../composables/useFilteredItems';
import { usePagination } from '../composables/usePagination';
import { useToastStore } from '../stores/toastStore';
import Pagination from '../components/Pagination.vue';

const router = useRouter();
const toast = useToastStore();

const { filters, resetFilters } = useFilters({
  status: '',
  discipline: '',
  module: '',
  search: ''
});

const { items: templates, loading, load, remove } = useCrud(
  () => templatesApi.getAll().then(res => res.data),
  null, null,
  (id) => templatesApi.delete(id)
);

const lessons = ref([]);
const equipmentList = ref([]);

const uniqueDisciplines = computed(() => {
  const disciplines = templates.value
    .map(t => t.discipline)
    .filter(d => d && d.trim() !== '');
  return [...new Set(disciplines)].sort();
});

const uniqueModules = computed(() => {
  const modules = templates.value
    .map(t => t.module)
    .filter(m => m && m.trim() !== '');
  return [...new Set(modules)].sort();
});

const getDisciplineCount = (discipline) => {
  return templates.value.filter(t => t.discipline === discipline).length;
};

const getModuleCount = (module) => {
  return templates.value.filter(t => t.module === module).length;
};

const filteredTemplates = computed(() => {
  let items = templates.value;

  if (filters.value.status) {
    if (filters.value.status === 'active') {
      items = items.filter(item => item.is_active === true);
    } else if (filters.value.status === 'inactive') {
      items = items.filter(item => item.is_active === false);
    }
  }

  if (filters.value.discipline) {
    items = items.filter(item => item.discipline === filters.value.discipline);
  }

  if (filters.value.module) {
    items = items.filter(item => item.module === filters.value.module);
  }

  if (filters.value.search.trim()) {
    const query = filters.value.search.toLowerCase().trim();
    items = items.filter(item =>
      item.title?.toLowerCase().includes(query) ||
      item.discipline?.toLowerCase().includes(query) ||
      item.module?.toLowerCase().includes(query)
    );
  }

  return items;
});

const {
  currentPage,
  paginatedItems,
  totalPages,
  resetPage,
  showPagination
} = usePagination(filteredTemplates, { pageSize: 5 });

const showForm = ref(false);
const editingItem = ref(null);
const showDeleteModal = ref(false);
const deleteTemplateId = ref(null);

const loadExtraData = async () => {
  try {
    const [lessonsRes, equipmentRes] = await Promise.all([
      lessonsApi.getAll(),
      equipmentApi.getAll()
    ]);
    lessons.value = lessonsRes.data || [];
    equipmentList.value = equipmentRes.data || [];
  } catch (error) {
    console.error('Error loading extra data:', error);
  }
};

const applyFilters = () => {
  resetPage();
  load();
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
  load();
};

const confirmDelete = (id) => {
  deleteTemplateId.value = id;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!deleteTemplateId.value) return;

  try {
    await templatesApi.delete(deleteTemplateId.value);
    await load();
    toast.success('✅ Шаблон удалён');
  } catch (error) {
    toast.error('Ошибка: ' + (error.response?.data?.message || error.message));
  } finally {
    showDeleteModal.value = false;
    deleteTemplateId.value = null;
  }
};

watch([() => filters.value.status, () => filters.value.discipline, () => filters.value.module, () => filters.value.search], () => {
  resetPage();
}, { deep: true });

onMounted(async () => {
  await Promise.all([load(), loadExtraData()]);
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

.btn-outline-primary {
  background: transparent;
  color: #0d6efd;
  border-color: #0d6efd;
}

.btn-outline-primary:hover {
  background: #0d6efd;
  color: white;
}

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border-color: #dc3545;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
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

.templates-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
}

.badge-success {
  background: #d1e7dd;
  color: #0f5132;
}

.badge-secondary {
  background: #e9ecef;
  color: #41464b;
}

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
</style>