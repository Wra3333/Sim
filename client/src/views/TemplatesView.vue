<template>
  <div class="templates-wrapper">
    <div class="templates-main">
      <h2>
        <IconTemplates class="title-icon" />
        Перечень оборудования для занятий
      </h2>
      <p>Управление шаблонами занятий</p>

      <ProblemTemplatesAlert
        v-if="!loading"
        :templates="templatesItems"
        :equipment-list="allEquipment"
        :on-edit-click="openEditForm"
      />

      <div class="toolbar">
        <button
          v-if="authStore.hasRole('admin', 'methodist', 'lab_assistant')"
          class="btn btn-primary"
          @click="openCreateForm"
        >
          <IconPlus class="btn-icon" />
          <span class="btn-text">Создать шаблон</span>
        </button>

        <button
          v-if="isMobile"
          class="btn btn-outline-secondary"
          :class="{ 'btn-active': mobileFiltersOpen }"
          @click="mobileFiltersOpen = true"
        >
          <IconFilter class="btn-icon" />
          <span class="btn-text">Фильтры</span>
          <span v-if="activeFiltersCount > 0" class="badge">{{ activeFiltersCount }}</span>
        </button>

        <span v-if="!isMobile" class="hotkey-hint">
          Нажмите <kbd>Enter</kbd> для открытия/закрытия формы
        </span>
      </div>

      <!-- DESKTOP -->
      <template v-if="!isMobile">
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
            <input
              v-model="templatesFilters.search"
              type="text"
              class="form-control"
              placeholder="Поиск по названию..."
            />
          </div>

          <div class="filter-group actions">
            <button class="btn btn-outline-secondary" @click="resetAllFilters">
              <IconReset class="btn-icon" />
              Сбросить
            </button>
          </div>
        </div>

        <TemplatesTableSkeleton v-if="loading" />

        <div v-else-if="filteredTemplates.length === 0" class="empty-state">
          <IconList class="empty-icon" />
          <span>Нет шаблонов</span>
        </div>

        <div v-else class="table-container">
          <table class="templates-table">
            <thead>
              <tr>
                <th class="col-date sortable" :class="{ 'sort-active': sortField === 'created_at' }" @click="toggleSort('created_at')">
                  Дата создания
                  <span class="sort-icon" v-if="sortField === 'created_at'">{{ sortDirection === 'desc' ? '↓' : '↑' }}</span>
                </th>
                <th class="col-title sortable" :class="{ 'sort-active': sortField === 'title' }" @click="toggleSort('title')">
                  Название
                  <span class="sort-icon" v-if="sortField === 'title'">{{ sortDirection === 'desc' ? '↓' : '↑' }}</span>
                </th>
                <th class="col-discipline sortable" :class="{ 'sort-active': sortField === 'discipline' }" @click="toggleSort('discipline')">
                  Дисциплина
                  <span class="sort-icon" v-if="sortField === 'discipline'">{{ sortDirection === 'desc' ? '↓' : '↑' }}</span>
                </th>
                <th class="col-equipment">Оборудование</th>
                <th class="col-status sortable" :class="{ 'sort-active': sortField === 'status' }" @click="toggleSort('status')">
                  Статус
                  <span class="sort-icon" v-if="sortField === 'status'">{{ sortDirection === 'desc' ? '↓' : '↑' }}</span>
                </th>
                <th class="col-actions">Действия</th>
              </tr>
            </thead>
            <tbody>
              <TemplateCard
                v-for="template in paginatedItems"
                :key="template.id"
                :template="template"
                :all-equipment="allEquipment"
                @row-click="handleRowClick"
                @edit="openEditForm"
                @delete="deleteTemplate"
              />
            </tbody>
          </table>
        </div>
      </template>

      <!-- MOBILE -->
      <template v-else>
        <TemplatesTableSkeleton v-if="loading" />

        <div v-else-if="filteredTemplates.length === 0" class="empty-state">
          <IconList class="empty-icon" />
          <span>Нет шаблонов</span>
        </div>

        <div v-else class="templates-cards">
          <TemplateMobileCard
            v-for="template in paginatedItems"
            :key="template.id"
            :template="template"
            :all-equipment="allEquipment"
            @edit="openEditForm"
            @delete="deleteTemplate"
          />
        </div>
      </template>

      <Pagination
        v-if="!loading && showPagination"
        v-model:current-page="currentPage"
        :total-pages="totalPages"
        :loading="loading"
      />

      <!-- OFF-CANVAS -->
      <transition name="drawer-fade">
        <div v-if="mobileFiltersOpen" class="drawer-overlay" @click.self="mobileFiltersOpen = false">
          <transition name="drawer-slide" appear>
            <div class="drawer-window">
              <div class="drawer-header">
                <h3><IconFilter class="drawer-icon" /> Фильтры</h3>
                <button class="drawer-close" @click="mobileFiltersOpen = false">×</button>
              </div>
              <div class="drawer-body">
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
                    <option v-for="d in uniqueDisciplines" :key="d" :value="d">{{ d }}</option>
                  </select>
                </div>
                <div class="filter-group">
                  <label>Поиск</label>
                  <input v-model="templatesFilters.search" type="text" class="form-control" placeholder="Поиск по названию..." />
                </div>
              </div>
              <div class="drawer-footer">
                <button class="btn btn-outline-secondary" @click="resetAllFilters">
                  <IconReset class="btn-icon" /> Сбросить
                </button>
                <button class="btn btn-primary" @click="mobileFiltersOpen = false">Применить</button>
              </div>
            </div>
          </transition>
        </div>
      </transition>

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

    <!-- САЙДБАР: только > 1400px -->
    <div v-if="!isMobile && !isNarrow" class="templates-sidebar">
      <ProblemEquipmentSidebar
        :lessons="lessonsItems"
        :templates="templatesItems"
        :equipment-list="allEquipment"
        :limit="3"
        :show-actions="false"
      />
      <SidebarFilterList
        title="Дисциплины"
        :icon="IconList"
        :items="uniqueDisciplines"
        :selected="templatesFilters.discipline"
        :count-fn="getDisciplineCount"
        empty-text="Нет дисциплин"
        @select="toggleDiscipline"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { useTemplatesStore, useLessonsStore, useEquipmentStore } from '../stores';
import { useUiStore } from '../stores/ui.store';
import { useToastStore } from '../stores/toastStore';
import { useAuthStore } from '../stores/auth.store';
import { useUrlSync } from '../composables/useUrlSync';
import { useConfirm } from '../composables/useConfirm';
import TemplateFormDrawer from '../components/templates/TemplateFormDrawer.vue';
import TemplateCard from '../components/templates/TemplateCard.vue';
import TemplateMobileCard from '../components/templates/TemplateMobileCard.vue';
import TemplatesTableSkeleton from '../components/templates/TemplatesTableSkeleton.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import ProblemEquipmentSidebar from '../components/ProblemEquipmentSidebar.vue';
import ProblemTemplatesAlert from '../components/ProblemTemplatesAlert.vue';
import Pagination from '../components/Pagination.vue';
import SidebarFilterList from '../components/SidebarFilterList.vue';
import {
  IconTemplates, IconPlus, IconReset, IconList, IconFilter
} from '../components/icons';

const uiStore = useUiStore();
const templatesStore = useTemplatesStore();
const lessonsStore = useLessonsStore();
const equipmentStore = useEquipmentStore();
const toast = useToastStore();
const authStore = useAuthStore();

const { show, config, confirm, onConfirm, onCancel } = useConfirm();

const { items: templatesItems } = storeToRefs(templatesStore);
const { items: lessonsItems } = storeToRefs(lessonsStore);
const { allEquipment } = storeToRefs(equipmentStore);
const { filters, pagination, editing } = storeToRefs(uiStore);

// ===== MOBILE (≤1100px) =====
const isMobile = ref(false);
let mediaQuery = null;

const updateIsMobile = (e) => { isMobile.value = e.matches; };

// ===== NARROW (≤1400px) — для скрытия сайдбара =====
const isNarrow = ref(false);
let narrowQuery = null;

const updateIsNarrow = (e) => { isNarrow.value = e.matches; };

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    mediaQuery = window.matchMedia('(max-width: 1100px)');
    isMobile.value = mediaQuery.matches;
    mediaQuery.addEventListener('change', updateIsMobile);

    narrowQuery = window.matchMedia('(max-width: 1400px)');
    isNarrow.value = narrowQuery.matches;
    narrowQuery.addEventListener('change', updateIsNarrow);
  }
});

onBeforeUnmount(() => {
  if (mediaQuery) mediaQuery.removeEventListener('change', updateIsMobile);
  if (narrowQuery) narrowQuery.removeEventListener('change', updateIsNarrow);
});

const { openFromUrl } = useUrlSync({
  resolvers: {
    template: async (id) => {
      if (templatesItems.value.length === 0) await templatesStore.fetchAll();
      return templatesItems.value.find((t) => t.id === id) ?? null;
    }
  }
});

const loading = ref(true);

const editingItem = computed(() =>
  templatesItems.value.find((t) => t.id === editing.value.template) || null
);

const showForm = computed({
  get: () =>
    (editing.value.template !== null && editingItem.value !== null)
    || uiStore.creating.template,
  set: (val) => { if (!val) uiStore.closeEdit('template'); }
});

const templatesFilters = computed({
  get: () => filters.value.templates || {
    status: '', discipline: '', search: '',
    sortField: 'created_at', sortDirection: 'desc'
  },
  set: (val) => { filters.value.templates = val; }
});

const sortField = computed({
  get: () => templatesFilters.value.sortField || 'created_at',
  set: (val) => { templatesFilters.value = { ...templatesFilters.value, sortField: val }; }
});

const sortDirection = computed({
  get: () => templatesFilters.value.sortDirection || 'desc',
  set: (val) => { templatesFilters.value = { ...templatesFilters.value, sortDirection: val }; }
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

const templatesPagination = computed({
  get: () => pagination.value.templates || { page: 1, size: 7 },
  set: (val) => { pagination.value.templates = val; }
});

const currentPage = computed({
  get: () => templatesPagination.value.page || 1,
  set: (val) => { templatesPagination.value = { ...templatesPagination.value, page: val }; }
});

const activeFiltersCount = computed(() => {
  let n = 0;
  const f = templatesFilters.value;
  if (f.status) n++;
  if (f.discipline) n++;
  if (f.search) n++;
  return n;
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
    filterFn: (item, value) => !value || item.discipline === value
  },
  search: {
    filterFn: (item, value) => {
      if (!value) return true;
      const query = value.toLowerCase().trim();
      return item.title?.toLowerCase().includes(query)
          || item.discipline?.toLowerCase().includes(query);
    }
  }
};

const filteredTemplates = computed(() => {
  const list = [...templatesItems.value];
  const field = sortField.value;
  const dir = sortDirection.value === 'desc' ? -1 : 1;

  list.sort((a, b) => {
    let va, vb;
    if (field === 'created_at') {
      va = new Date(a.created_at).getTime() || 0;
      vb = new Date(b.created_at).getTime() || 0;
      return (va - vb) * dir;
    }
    if (field === 'title') {
      va = (a.title || '').toLowerCase();
      vb = (b.title || '').toLowerCase();
    } else if (field === 'discipline') {
      va = (a.discipline || '').toLowerCase();
      vb = (b.discipline || '').toLowerCase();
    } else if (field === 'status') {
      va = a.is_active ? 0 : 1;
      vb = b.is_active ? 0 : 1;
    } else {
      return 0;
    }
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });

  const allFilters = { ...templatesFilters.value };

  return list.filter((item) => {
    let result = true;
    for (const [key, cfg] of Object.entries(filterConfig)) {
      const filterValue = allFilters[key];
      if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
        if (Array.isArray(filterValue)) {
          if (filterValue.length > 0) result = result && cfg.filterFn(item, filterValue);
        } else {
          result = result && cfg.filterFn(item, filterValue);
        }
      }
    }
    return result;
  });
});

const uniqueDisciplines = computed(() => {
  const disciplines = templatesItems.value
    .map((t) => t.discipline)
    .filter((d) => d && d.trim() !== '');
  return [...new Set(disciplines)].sort();
});

const getDisciplineCount = (discipline) =>
  templatesItems.value.filter((t) => t.discipline === discipline).length;

const toggleDiscipline = (discipline) => {
  if (templatesFilters.value.discipline === discipline) {
    templatesFilters.value = { ...templatesFilters.value, discipline: '' };
  } else {
    templatesFilters.value = { ...templatesFilters.value, discipline };
  }
  resetPage();
};

const pageSize = 7;
const resetPage = () => { currentPage.value = 1; };

const totalPages = computed(() =>
  Math.ceil(filteredTemplates.value.length / pageSize) || 1
);

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredTemplates.value.slice(start, start + pageSize);
});

const showPagination = computed(() => filteredTemplates.value.length > pageSize);

const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      templatesStore.fetchAll(),
      lessonsStore.fetchAll(),
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
  uiStore.resetFilters('templates');
  resetPage();
  mobileFiltersOpen.value = false;
};

const handleKeydown = (e) => {
  if (isMobile.value) return;
  if (e.key === 'Enter') {
    const tag = e.target.tagName.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
      e.preventDefault();
      if (showForm.value) closeForm();
      else openCreateForm();
    }
  }
};

const openCreateForm = () => uiStore.openCreate('template');

const openEditForm = (template) => {
  if (!template?.id) return;
  uiStore.openEdit('template', template.id);
};

const closeForm = () => uiStore.closeEdit('template');

const onSaved = () => {
  closeForm();
  loadData();
};

const handleRowClick = (template) => { openEditForm(template); };

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

watch(
  [
    () => templatesFilters.value.status,
    () => templatesFilters.value.discipline,
    () => templatesFilters.value.search
  ],
  () => { resetPage(); },
  { deep: true }
);

onMounted(async () => {
  await loadData();
  const { found, item, id } = await openFromUrl('template', { queryKey: 'templates_edit' });
  if (found) openEditForm(item);
  else if (id) toast.warning(`Шаблон с ID ${id} не найден`);
  document.addEventListener('keydown', handleKeydown);
});

onActivated(() => { loadData(); });

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.templates-wrapper { display: flex; gap: 20px; }
.templates-main { flex: 1; min-width: 0; }
.templates-sidebar {
  width: 280px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 12px;
}

h2 {
  font-size: 24px; font-weight: 600; margin-bottom: 4px;
  color: #212529; display: flex; align-items: center; gap: 8px;
}
h2 .title-icon { width: 24px; height: 24px; stroke: #212529; }
p { color: #6c757d; margin-bottom: 16px; }

.toolbar {
  display: flex; justify-content: space-between; align-items: center;
  margin: 16px 0; gap: 8px; flex-wrap: wrap;
}

.hotkey-hint { font-size: 13px; color: #6c757d; }
.hotkey-hint kbd {
  background: #f1f3f5; padding: 1px 8px; border-radius: 4px;
  font-size: 11px; border: 1px solid #dee2e6; font-family: inherit;
}

.btn {
  padding: 6px 16px; border: 1px solid transparent; border-radius: 4px;
  font-size: 14px; cursor: pointer; transition: all 0.15s;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn .btn-icon { width: 16px; height: 16px; stroke: currentColor; }
.btn .badge {
  background: #dc3545; color: white; border-radius: 999px;
  padding: 0 6px; font-size: 10.5px; line-height: 16px;
  min-width: 16px; text-align: center;
}
.btn-primary { background: #0d6efd; color: white; border-color: #0d6efd; }
.btn-primary:hover { background: #0b5ed7; border-color: #0a58ca; }
.btn-outline-secondary { background: transparent; color: #6c757d; border: 1px solid #6c757d; }
.btn-outline-secondary:hover { background: #6c757d; color: white; }
.btn-active {
  background: #e7f1ff !important;
  color: #0d6efd !important;
  border-color: #0d6efd !important;
}

.filters {
  display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
  align-items: flex-end; background: #f8f9fa; padding: 16px; border-radius: 8px;
}

.filter-group {
  display: flex; flex-direction: column; gap: 4px;
  min-width: 140px;
}
.filter-group label {
  font-size: 13px; font-weight: 500; color: #495057; margin: 0;
}
.filter-group .form-control {
  padding: 6px 12px; border: 1px solid #ced4da; border-radius: 6px;
  font-size: 14px; background: white; width: 100%;
}
.filter-group .form-control:focus {
  border-color: #80bdff; outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.actions {
  flex-direction: row; align-items: flex-end;
  gap: 8px; padding-top: 0; flex: 0 0 auto;
}

/* ==========================================
   ТАБЛИЦА — РЕЗИНОВАЯ
   ========================================== */
.table-container {
  background: white; border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.templates-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 14px;
}

.templates-table thead { background: #f8f9fa; }

.templates-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  vertical-align: middle;
}

.templates-table td {
  padding: 10px 16px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: top;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.templates-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.templates-table th.sortable:hover { background: #e9ecef; }
.templates-table th.sort-active { color: #0d6efd; }

.sort-icon {
  display: inline-block;
  margin-left: 4px;
  font-size: 12px;
  color: #0d6efd;
  font-weight: 700;
}

.col-date       { width: 12%; }
.col-title      { width: 24%; }
.col-discipline { width: 15%; }
.col-equipment  { width: 22%; }
.col-status     { width: 12%; }
.col-actions    { width: 15%; }

.templates-table td:last-child { cursor: default; }

.empty-state {
  text-align: center; padding: 40px; color: #6c757d;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.empty-state .empty-icon { width: 32px; height: 32px; stroke: #6c757d; }

.templates-cards { display: flex; flex-direction: column; }

/* ==========================================
   ПЛАВНОЕ СЖАТИЕ (до 1100px — точки перелома)
   ========================================== */
@media (max-width: 1400px) {
  .templates-table th,
  .templates-table td {
    padding: 10px 12px;
    font-size: 13.5px;
  }
}

@media (max-width: 1280px) {
  .templates-table th,
  .templates-table td {
    padding: 9px 10px;
    font-size: 13px;
  }
}

@media (max-width: 1200px) {
  .templates-table th,
  .templates-table td {
    padding: 8px 8px;
    font-size: 12.5px;
  }

  .col-date       { width: 13%; }
  .col-title      { width: 26%; }
  .col-discipline { width: 14%; }
  .col-equipment  { width: 20%; }
  .col-status     { width: 12%; }
  .col-actions    { width: 15%; }
}

/* ==========================================
   OFF-CANVAS
   ========================================== */
.drawer-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45);
  z-index: 1000; display: flex; justify-content: flex-end;
}
.drawer-window {
  background: white; width: 90vw; max-width: 420px; height: 100%;
  display: flex; flex-direction: column;
  box-shadow: -20px 0 60px rgba(0, 0, 0, 0.25);
  overflow: hidden; margin-left: auto;
}
.drawer-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid #e9ecef; flex-shrink: 0;
}
.drawer-header h3 {
  font-size: 16px; font-weight: 600; margin: 0; color: #212529;
  display: flex; align-items: center; gap: 8px;
}
.drawer-header .drawer-icon { width: 18px; height: 18px; stroke: #212529; }
.drawer-close {
  background: none; border: none; font-size: 26px; line-height: 1;
  color: #6c757d; cursor: pointer; padding: 0 6px;
}
.drawer-close:hover { color: #212529; }
.drawer-body {
  padding: 16px 20px; overflow-y: auto; flex: 1;
  display: flex; flex-direction: column; gap: 12px;
}
.drawer-footer {
  display: flex; justify-content: space-between; gap: 8px;
  padding: 14px 20px; border-top: 1px solid #e9ecef; flex-shrink: 0;
}

.drawer-fade-enter-active,
.drawer-fade-leave-active { transition: opacity 0.2s ease; }
.drawer-fade-enter-from,
.drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active,
.drawer-slide-leave-active { transition: transform 0.25s ease; }
.drawer-slide-enter-from,
.drawer-slide-leave-to { transform: translateX(100%); }

/* ==========================================
   МОБИЛЬНЫЕ — на 1100px
   ========================================== */
@media (max-width: 1100px) {
  .templates-wrapper { flex-direction: column; }

  .toolbar { align-items: stretch; }
  .toolbar .btn { height: 40px; }

  .drawer-body .filter-group .form-control { height: 40px; font-size: 14px; }
  .drawer-footer { flex-direction: column; }
  .drawer-footer .btn { width: 100%; justify-content: center; height: 42px; }
}

@media (max-width: 768px) {
  .filters { flex-direction: column; align-items: stretch; }
  .filter-group { min-width: 100%; }
  .actions { flex-direction: row; }
}

@media (max-width: 480px) {
  .drawer-window { width: 100vw; max-width: 100vw; }
}
</style>