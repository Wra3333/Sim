<template>
  <div class="repairs-view">
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>
          <IconRepairs class="title-icon" />
          Журнал фиксации неисправностей
        </h2>
        <span class="count">Найдено заявок: {{ filteredRepairs.length }}</span>
      </div>
      <div class="toolbar-right">
        <div class="stats-badges">
          <span class="badge badge-success">
            <IconCheck class="badge-icon" />
            Закрытых: {{ stats.resolved }}
          </span>
          <span class="badge badge-warning">
            <IconAlert class="badge-icon" />
            Активных: {{ stats.active }}
          </span>
        </div>
        <button class="btn btn-primary" @click="openCreateForm">
          <IconPlus class="btn-icon" />
          Создать заявку
        </button>
      </div>
    </div>

    <div class="hotkey-hint">
      <span>Нажмите <kbd>Enter</kbd> для открытия/закрытия формы</span>
    </div>

    <!-- ФИЛЬТРЫ -->
    <div class="filters">
      <div class="filter-group">
        <label>Статус</label>
        <select v-model="filterStatus" class="form-control">
          <option value="">Все статусы</option>
          <option value="new">Новая</option>
          <option value="resolved">Устранена</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Оборудование</label>
        <EquipmentMultiSelect v-model="filterEquipmentIds" :equipment-options="equipmentItems"
          placeholder="Введите название или инв. номер..." />
      </div>

      <div class="filter-group date-filters">
        <label>От</label>
        <input v-model="filterDateFrom" type="date" class="form-control" />
        <label>До</label>
        <input v-model="filterDateTo" type="date" class="form-control" />
      </div>

      <div class="filter-group actions">
        <button class="btn btn-outline-secondary" @click="resetAllFilters">
          <IconReset class="btn-icon" />
          Сбросить
        </button>
      </div>
    </div>

    <!-- ТАБЛИЦА -->
    <div v-if="loading" class="text-center">
      <IconLoading class="loading-icon" />
      Загрузка...
    </div>
    <div v-else-if="filteredRepairs.length === 0" class="empty-state">
      <IconList class="empty-icon" />
      <span>Заявок не найдено</span>
    </div>
    <div v-else class="table-container">
      <table class="repairs-table">
        <thead>
          <tr>
            <th style="width: 70px;">№</th>
            <th style="min-width: 220px;">Оборудование</th>
            <th style="min-width: 280px;">Описание</th>
            <th style="width: 120px;">Дата</th>
            <th style="min-width: 140px;">Кто выявил</th>
            <th style="min-width: 220px;">Возможность устранения</th>
            <th style="width: 140px;">Статус</th>
            <th style="min-width: 140px;">Кто устранил</th>
            <th style="width: 170px;">Действия</th>
          </tr>
        </thead>
        <tbody>
          <RepairCard v-for="repair in paginatedItems" :key="repair.id" :repair="repair" @row-click="handleRowClick"
            @resolve="openResolveModal" @edit-resolved-by="openEditResolvedBy" @edit="openEditForm"
            @delete="confirmDelete" />
        </tbody>
      </table>
    </div>

    <!-- ПАГИНАЦИЯ -->
    <Pagination v-if="showPagination" v-model:current-page="currentPage" :total-pages="totalPages" :loading="loading" />

    <!-- МОДАЛКИ -->
    <RepairFormDrawer :visible="showForm" :repair="editingRepair" @close="closeForm" @save="onRepairSaved" />

    <ConfirmModal v-model:visible="show" :title="config.title" :message="config.message"
      :confirm-text="config.confirmText" :cancel-text="config.cancelText" :confirm-variant="config.confirmVariant"
      @confirm="onConfirm" @cancel="onCancel" />

    <ResolveRepairModal v-model:visible="showResolveModal" :repair="resolvingRepair" :is-editing="isEditingResolvedBy"
      @close="closeResolveModal" @resolve="loadRepairs" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useRepairsStore, useEquipmentStore } from '../stores';
import { useAppStore } from '../stores/appStore';
import { useToastStore } from '../stores/toastStore';
import { useConfirm } from '../composables/useConfirm';
import { useFormatters } from '../composables/useFormatters';
import RepairFormDrawer from '../components/repairs/RepairFormDrawer.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import ResolveRepairModal from '../components/repairs/ResolveRepairModal.vue';
import RepairCard from '../components/repairs/RepairCard.vue';
import EquipmentMultiSelect from '../components/EquipmentMultiSelect.vue';
import Pagination from '../components/Pagination.vue';
import {
  IconRepairs,
  IconPlus,
  IconCheck,
  IconAlert,
  IconReset,
  IconList,
  IconLoading
} from '../components/icons';

// ============================================
// STORE
// ============================================
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const repairsStore = useRepairsStore();
const equipmentStore = useEquipmentStore();
const toast = useToastStore();

const { show, config, confirm, onConfirm, onCancel } = useConfirm();
const { formatDate } = useFormatters();

const { items: repairsItems } = storeToRefs(repairsStore);
const { items: equipmentItems } = storeToRefs(equipmentStore);
const { filters, pagination, editing } = storeToRefs(appStore);

// ============================================
// СОСТОЯНИЕ ИЗ APPSTORE
// ============================================
const repairsFilters = computed({
  get: () => filters.value.repairs || { status: '', equipmentIds: [], dateFrom: '', dateTo: '' },
  set: (val) => {
    filters.value.repairs = val;
  }
});

const filterStatus = computed({
  get: () => repairsFilters.value.status,
  set: (val) => {
    repairsFilters.value = { ...repairsFilters.value, status: val };
    currentPage.value = 1;
  }
});

const filterEquipmentIds = computed({
  get: () => repairsFilters.value.equipmentIds,
  set: (val) => {
    repairsFilters.value = { ...repairsFilters.value, equipmentIds: val };
    currentPage.value = 1;
  }
});

const filterDateFrom = computed({
  get: () => repairsFilters.value.dateFrom,
  set: (val) => {
    repairsFilters.value = { ...repairsFilters.value, dateFrom: val };
    currentPage.value = 1;
  }
});

const filterDateTo = computed({
  get: () => repairsFilters.value.dateTo,
  set: (val) => {
    repairsFilters.value = { ...repairsFilters.value, dateTo: val };
    currentPage.value = 1;
  }
});

const repairsPagination = computed({
  get: () => pagination.value.repairs || { page: 1, size: 8 },
  set: (val) => {
    pagination.value.repairs = val;
  }
});

const currentPage = computed({
  get: () => repairsPagination.value.page || 1,
  set: (val) => {
    repairsPagination.value = { ...repairsPagination.value, page: val };
  }
});

// ============================================
// ЛОКАЛЬНОЕ СОСТОЯНИЕ
// ============================================
const loading = ref(true);
const showForm = ref(false);
const editingRepair = ref(null);
const showResolveModal = ref(false);
const resolvingRepair = ref(null);
const isEditingResolvedBy = ref(false);

// ============================================
// ФИЛЬТРАЦИЯ
// ============================================
const filterConfig = {
  status: {
    filterFn: (item, value) => {
      if (!value) return true;
      if (value === 'resolved') return item.is_resolved === true;
      if (value === 'new') return item.is_resolved === false;
      return true;
    }
  },
  equipmentIds: {
    filterFn: (item, value) => {
      if (!value || value.length === 0) return true;
      const ids = value.map(id => Number(id));
      return ids.includes(item.equipment_id);
    }
  },
  dateFrom: {
    filterFn: (item, value) => {
      if (!value) return true;
      const from = new Date(value);
      from.setHours(0, 0, 0, 0);
      return new Date(item.detection_date) >= from;
    }
  },
  dateTo: {
    filterFn: (item, value) => {
      if (!value) return true;
      const to = new Date(value);
      to.setHours(23, 59, 59, 999);
      return new Date(item.detection_date) <= to;
    }
  }
};

const filteredRepairs = computed(() => {
  const list = [...repairsItems.value];
  const allFilters = { ...repairsFilters.value };

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
// ПАГИНАЦИЯ
// ============================================
const pageSize = 8;

const totalPages = computed(() => {
  return Math.ceil(filteredRepairs.value.length / pageSize) || 1;
});

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredRepairs.value.slice(start, end);
});

const showPagination = computed(() => {
  return filteredRepairs.value.length > pageSize;
});

const resetPage = () => {
  currentPage.value = 1;
};

// ============================================
// СТАТИСТИКА
// ============================================
const stats = computed(() => ({
  total: repairsItems.value.length,
  resolved: repairsItems.value.filter(r => r.is_resolved).length,
  active: repairsItems.value.filter(r => !r.is_resolved).length
}));

// ============================================
// ЗАГРУЗКА ДАННЫХ
// ============================================
const loadRepairs = async () => {
  loading.value = true;
  try {
    await repairsStore.fetchAll();
  } catch (error) {
    console.error('Error loading repairs:', error);
    toast.error('Ошибка загрузки заявок');
  } finally {
    loading.value = false;
  }
};

// ============================================
// МЕТОДЫ
// ============================================
const resetAllFilters = () => {
  appStore.resetFilters('repairs');
  currentPage.value = 1;
};

const openCreateForm = () => {
  editingRepair.value = null;
  showForm.value = true;
  appStore.closeEdit('repair');
};

const openEditForm = (repair) => {
  if (!repair) return;
  console.log('✏️ Открытие редактирования заявки:', repair.id);
  editingRepair.value = repair;
  showForm.value = true;
  if (repair.id) {
    appStore.openEdit('repair', repair.id);
  }
};

const closeForm = () => {
  showForm.value = false;
  appStore.closeEdit('repair');
};

const onRepairSaved = () => {
  closeForm();
  loadRepairs();
};

const openResolveModal = (repair) => {
  resolvingRepair.value = repair;
  isEditingResolvedBy.value = false;
  showResolveModal.value = true;
};

const openEditResolvedBy = (repair) => {
  resolvingRepair.value = repair;
  isEditingResolvedBy.value = true;
  showResolveModal.value = true;
};

const closeResolveModal = () => {
  showResolveModal.value = false;
  resolvingRepair.value = null;
  isEditingResolvedBy.value = false;
};

const handleRowClick = (repair) => {
  if (!repair.is_resolved) {
    openEditForm(repair);
  }
};

const confirmDelete = async (id) => {
  const confirmed = await confirm({
    title: 'Удаление заявки',
    message: 'Вы уверены, что хотите удалить эту заявку?',
    confirmText: 'Удалить',
    confirmVariant: 'danger'
  });

  if (confirmed) {
    try {
      await repairsStore.delete(id);
      await loadRepairs();
      toast.success('Заявка удалена');
    } catch (error) {
      const msg = error.response?.data?.message || 'Ошибка удаления';
      toast.error(msg);
    }
  }
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
// АВТОМАТИЧЕСКОЕ ОТКРЫТИЕ ИЗ URL
// ============================================
const openFromUrl = async () => {
  const repairEdit = route.query.repair_edit;

  if (repairEdit) {
    const id = parseInt(repairEdit, 10);
    if (!isNaN(id) && id > 0) {
      if (showForm.value && editingRepair.value?.id === id) {
        return true;
      }

      if (repairsItems.value.length === 0) {
        await repairsStore.fetchAll();
      }

      const repair = repairsItems.value.find(r => r.id === id);
      if (repair) {
        if (showForm.value) {
          closeForm();
        }
        await nextTick();
        openEditForm(repair);
        return true;
      } else {
        toast.warning(`Заявка с ID ${id} не найдена`);
      }
    }
  }

  return false;
};

// ============================================
// WATCH
// ============================================
watch(
  () => route.query.repair_edit,
  async (newVal) => {
    if (newVal) {
      await openFromUrl();
    } else {
      if (showForm.value && editingRepair.value) {
        showForm.value = false;
        setTimeout(() => {
          editingRepair.value = null;
        }, 500);
        appStore.closeEdit('repair');
      }
    }
  }
);

// ============================================
// LIFECYCLE
// ============================================
onMounted(async () => {
  await Promise.all([
    loadRepairs(),
    equipmentStore.fetchAll()
  ]);

  await openFromUrl();
  document.addEventListener('keydown', handleKeydown);
});

onActivated(async () => {
  try {
    await repairsStore.fetchAll();
  } catch (error) {
    console.error('Error loading repairs:', error);
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.repairs-view {
  padding: 0;
}

/* ============================================
   ТУЛБАР
   ============================================ */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-left h2 .title-icon {
  width: 24px;
  height: 24px;
  stroke: #212529;
}

.toolbar-left .count {
  color: #6c757d;
  font-size: 14px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hotkey-hint {
  font-size: 13px;
  color: #6c757d;
  margin-bottom: 12px;
  padding: 6px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  display: inline-block;
}

.hotkey-hint kbd {
  background: #e9ecef;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #ced4da;
  font-family: inherit;
  font-weight: 600;
}

.stats-badges {
  display: flex;
  gap: 6px;
}

/* ============================================
   БЕЙДЖИ СТАТИСТИКИ
   ============================================ */
.badge {
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge .badge-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}

.badge-success {
  background: #d1e7dd;
  color: #0f5132;
}

.badge-warning {
  background: #fff3cd;
  color: #664d03;
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

.date-filters {
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.date-filters label {
  font-size: 13px;
  color: #888;
  margin: 0;
}

.date-filters .form-control {
  min-width: 130px;
}

.actions {
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
  padding-top: 0;
  flex: 0 0 auto;
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
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
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

.repairs-table {
  width: 100%;
  min-width: 1300px;          
  border-collapse: collapse;
  font-size: 14px;
}

.repairs-table thead {
  background: #f8f9fa;
}

.repairs-table th {
  padding: 14px 18px;              
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.repairs-table td {
  padding: 14px 18px;            
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}


/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 1024px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: 100%;
  }

  .date-filters {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .date-filters .form-control {
    flex: 1;
    min-width: 120px;
  }
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-right {
    flex-wrap: wrap;
  }

  .stats-badges {
    order: -1;
  }

  .repairs-table {
    font-size: 13px;
  }

  .repairs-table th,
  .repairs-table td {
    padding: 8px 10px;
  }
}
</style>