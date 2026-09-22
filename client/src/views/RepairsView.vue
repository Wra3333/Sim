<template>
  <div class="repairs-view">
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>
          <IconRepairs class="title-icon" />
          <span class="title-text">Журнал фиксации неисправностей</span>
        </h2>
        <span class="count">Найдено заявок: {{ filteredRepairs.length }}</span>
      </div>

      <div class="toolbar-right">
        <div v-if="!isMobile" class="stats-badges">
          <span class="badge badge-success">
            <IconCheck class="badge-icon" />
            Закрытых: {{ stats.resolved }}
          </span>
          <span class="badge badge-warning">
            <IconAlert class="badge-icon" />
            Активных: {{ stats.active }}
          </span>
        </div>

        <button
          v-if="isNarrow || isMobile"
          class="btn btn-outline-secondary"
          :class="{ 'btn-active': mobileFiltersOpen }"
          @click="mobileFiltersOpen = true"
        >
          <IconFilter class="btn-icon" />
          <span class="btn-text">Фильтры</span>
          <span v-if="activeFiltersCount > 0" class="badge">{{ activeFiltersCount }}</span>
        </button>

        <button
          v-if="authStore.hasRole('admin', 'methodist', 'technician')"
          class="btn btn-primary"
          @click="openCreateForm"
        >
          <IconPlus class="btn-icon" />
          <span class="btn-text">Создать заявку</span>
        </button>
      </div>
    </div>

    <div v-if="!isNarrow && !isMobile" class="hotkey-hint">
      <span>Нажмите <kbd>Enter</kbd> для открытия/закрытия формы</span>
    </div>

    <!-- DESKTOP -->
    <template v-if="!isMobile">
      <!-- Встроенные фильтры — только > 1600px -->
      <div v-if="!isNarrow" class="filters">
        <div class="filter-group">
          <label>Статус</label>
          <select v-model="repairsFilters.status" class="form-control">
            <option value="">Все статусы</option>
            <option value="new">Новая</option>
            <option value="resolved">Устранена</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Оборудование</label>
          <EquipmentMultiSelect
            v-model="filterEquipmentIds"
            :equipment-options="equipmentItems"
            placeholder="Введите название или инв. номер..."
          />
        </div>

        <div class="filter-group date-filters">
          <label>От</label>
          <input v-model="repairsFilters.dateFrom" type="date" class="form-control" />
          <label>До</label>
          <input v-model="repairsFilters.dateTo" type="date" class="form-control" />
        </div>

        <div class="filter-group actions">
          <button class="btn btn-outline-secondary" @click="resetAllFilters">
            <IconReset class="btn-icon" />
            Сбросить
          </button>
        </div>
      </div>

      <RepairsTableSkeleton v-if="loading" />

      <div v-else-if="filteredRepairs.length === 0" class="empty-state">
        <IconList class="empty-icon" />
        <span>Заявок не найдено</span>
      </div>

      <div v-else class="table-container">
        <table class="repairs-table">
          <thead>
            <tr>
              <th class="col-date sortable" :class="{ 'sort-active': sortField === 'detection_date' }" @click="toggleSort('detection_date')">
                Дата
                <span class="sort-icon" v-if="sortField === 'detection_date'">{{ sortDirection === 'desc' ? '↓' : '↑' }}</span>
              </th>
              <th class="col-equipment sortable" :class="{ 'sort-active': sortField === 'equipment' }" @click="toggleSort('equipment')">
                Оборудование
                <span class="sort-icon" v-if="sortField === 'equipment'">{{ sortDirection === 'desc' ? '↓' : '↑' }}</span>
              </th>
              <th class="col-description">Описание</th>
              <th class="col-detected-by">Кто выявил</th>
              <th class="col-possibility">Возможность устранения</th>
              <th class="col-status sortable" :class="{ 'sort-active': sortField === 'status' }" @click="toggleSort('status')">
                Статус
                <span class="sort-icon" v-if="sortField === 'status'">{{ sortDirection === 'desc' ? '↓' : '↑' }}</span>
              </th>
              <th class="col-resolved-by">Кто устранил</th>
              <th class="col-actions">Действия</th>
            </tr>
          </thead>
          <tbody>
            <RepairCard
              v-for="repair in paginatedItems"
              :key="repair.id"
              :repair="repair"
              @row-click="handleRowClick"
              @resolve="openResolveModal"
              @edit-resolved-by="openEditResolvedBy"
              @edit="openEditForm"
              @delete="confirmDelete"
            />
          </tbody>
        </table>
      </div>
    </template>

    <!-- MOBILE (≤ 1275px) -->
    <template v-else>
      <RepairsTableSkeleton v-if="loading" />

      <div v-else-if="filteredRepairs.length === 0" class="empty-state">
        <IconList class="empty-icon" />
        <span>Заявок не найдено</span>
      </div>

      <div v-else class="repairs-cards">
        <RepairMobileCard
          v-for="repair in paginatedItems"
          :key="repair.id"
          :repair="repair"
          @row-click="handleRowClick"
          @resolve="openResolveModal"
          @edit-resolved-by="openEditResolvedBy"
          @edit="openEditForm"
          @delete="confirmDelete"
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
                <select v-model="repairsFilters.status" class="form-control">
                  <option value="">Все статусы</option>
                  <option value="new">Новая</option>
                  <option value="resolved">Устранена</option>
                </select>
              </div>
              <div class="filter-group">
                <label>Оборудование</label>
                <EquipmentMultiSelect
                  v-model="filterEquipmentIds"
                  :equipment-options="equipmentItems"
                  placeholder="Введите название или инв. номер..."
                />
              </div>
              <div class="filter-group">
                <label>От</label>
                <input v-model="repairsFilters.dateFrom" type="date" class="form-control" />
              </div>
              <div class="filter-group">
                <label>До</label>
                <input v-model="repairsFilters.dateTo" type="date" class="form-control" />
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

    <RepairFormDrawer
      :visible="showForm"
      :repair="editingRepair"
      @close="closeForm"
      @save="onRepairSaved"
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

    <ResolveRepairModal
      v-model:visible="showResolveModal"
      :repair="resolvingRepair"
      :is-editing="isEditingResolvedBy"
      @close="closeResolveModal"
      @resolve="loadRepairs"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepairsStore, useEquipmentStore } from '../stores';
import { useUiStore } from '../stores/ui.store';
import { useToastStore } from '../stores/toastStore';
import { useAuthStore } from '../stores/auth.store';
import { useUrlSync } from '../composables/useUrlSync';
import { useConfirm } from '../composables/useConfirm';
import RepairFormDrawer from '../components/repairs/RepairFormDrawer.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import ResolveRepairModal from '../components/repairs/ResolveRepairModal.vue';
import RepairCard from '../components/repairs/RepairCard.vue';
import RepairMobileCard from '../components/repairs/RepairMobileCard.vue';
import RepairsTableSkeleton from '../components/repairs/RepairsTableSkeleton.vue';
import EquipmentMultiSelect from '../components/EquipmentMultiSelect.vue';
import Pagination from '../components/Pagination.vue';
import {
  IconRepairs, IconPlus, IconCheck, IconAlert,
  IconReset, IconList, IconFilter
} from '../components/icons';

const uiStore = useUiStore();
const repairsStore = useRepairsStore();
const equipmentStore = useEquipmentStore();
const toast = useToastStore();
const authStore = useAuthStore();

const { show, config, confirm, onConfirm, onCancel } = useConfirm();

const { items: repairsItems } = storeToRefs(repairsStore);
const { items: equipmentItems } = storeToRefs(equipmentStore);
const { filters, pagination, editing } = storeToRefs(uiStore);

// ===== MOBILE (≤ 1275px) — карточки =====
const isMobile = ref(false);
let mediaQuery = null;
const mobileFiltersOpen = ref(false);

const updateIsMobile = (e) => { isMobile.value = e.matches; };

// ===== NARROW (≤ 1600px) — скрытие встроенных фильтров =====
const isNarrow = ref(false);
let narrowQuery = null;

const updateIsNarrow = (e) => { isNarrow.value = e.matches; };

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    mediaQuery = window.matchMedia('(max-width: 1275px)');
    isMobile.value = mediaQuery.matches;
    mediaQuery.addEventListener('change', updateIsMobile);

    narrowQuery = window.matchMedia('(max-width: 1600px)');
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
    repair: async (id) => {
      if (repairsItems.value.length === 0) await repairsStore.fetchAll();
      return repairsItems.value.find((r) => r.id === id) ?? null;
    }
  }
});

const repairsFilters = computed({
  get: () => filters.value.repairs || {
    status: '', equipmentIds: [], dateFrom: '', dateTo: '',
    sortField: 'detection_date', sortDirection: 'desc'
  },
  set: (val) => { filters.value.repairs = val; }
});

const sortField = computed({
  get: () => repairsFilters.value.sortField || 'detection_date',
  set: (val) => { repairsFilters.value = { ...repairsFilters.value, sortField: val }; }
});

const sortDirection = computed({
  get: () => repairsFilters.value.sortDirection || 'desc',
  set: (val) => { repairsFilters.value = { ...repairsFilters.value, sortDirection: val }; }
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

const filterEquipmentIds = computed({
  get: () => repairsFilters.value.equipmentIds || [],
  set: (val) => {
    const current = repairsFilters.value.equipmentIds || [];
    const same = current.length === val.length
      && current.every((id, i) => id === val[i]);
    if (same) return;
    repairsFilters.value = { ...repairsFilters.value, equipmentIds: val };
    resetPage();
  }
});

const repairsPagination = computed({
  get: () => pagination.value.repairs || { page: 1, size: 8 },
  set: (val) => { pagination.value.repairs = val; }
});

const currentPage = computed({
  get: () => repairsPagination.value.page || 1,
  set: (val) => { repairsPagination.value.page = val; }
});

const editingRepair = computed(() => {
  const id = editing.value.repair;
  if (!id) return null;
  return repairsItems.value.find((r) => r.id === id) || null;
});

const showForm = computed({
  get: () =>
    (editing.value.repair !== null && editingRepair.value !== null)
    || uiStore.creating.repair,
  set: (val) => { if (!val) uiStore.closeEdit('repair'); }
});

const loading = ref(true);
const showResolveModal = ref(false);
const resolvingRepair = ref(null);
const isEditingResolvedBy = ref(false);

const activeFiltersCount = computed(() => {
  let n = 0;
  const f = repairsFilters.value;
  if (f.status) n++;
  if (f.equipmentIds?.length) n++;
  if (f.dateFrom) n++;
  if (f.dateTo) n++;
  return n;
});

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
      const ids = value.map((id) => Number(id));
      return ids.includes(item.equipment_id);
    }
  },
  dateFrom: {
    filterFn: (item, value) => {
      if (!value) return true;
      const from = new Date(value); from.setHours(0, 0, 0, 0);
      return new Date(item.detection_date) >= from;
    }
  },
  dateTo: {
    filterFn: (item, value) => {
      if (!value) return true;
      const to = new Date(value); to.setHours(23, 59, 59, 999);
      return new Date(item.detection_date) <= to;
    }
  }
};

const filteredRepairs = computed(() => {
  const list = [...repairsItems.value];
  const field = sortField.value;
  const dir = sortDirection.value === 'desc' ? -1 : 1;

  list.sort((a, b) => {
    let va, vb;
    if (field === 'detection_date') {
      va = new Date(a.detection_date).getTime() || 0;
      vb = new Date(b.detection_date).getTime() || 0;
      return (va - vb) * dir;
    }
    if (field === 'equipment') {
      va = (a.equipment?.name || '').toLowerCase();
      vb = (b.equipment?.name || '').toLowerCase();
    } else if (field === 'status') {
      va = a.is_resolved ? 1 : 0;
      vb = b.is_resolved ? 1 : 0;
    } else {
      return 0;
    }
    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });

  const allFilters = { ...repairsFilters.value };

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

const pageSize = 8;

const totalPages = computed(() =>
  Math.ceil(filteredRepairs.value.length / pageSize) || 1
);

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredRepairs.value.slice(start, start + pageSize);
});

const showPagination = computed(() => filteredRepairs.value.length > pageSize);
const resetPage = () => { currentPage.value = 1; };

const stats = computed(() => ({
  total: repairsItems.value.length,
  resolved: repairsItems.value.filter((r) => r.is_resolved).length,
  active: repairsItems.value.filter((r) => !r.is_resolved).length
}));

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

const resetAllFilters = () => {
  uiStore.resetFilters('repairs');
  resetPage();
  mobileFiltersOpen.value = false;
};

const openCreateForm = () => uiStore.openCreate('repair');

const openEditForm = (repair) => {
  if (!repair?.id) return;
  uiStore.openEdit('repair', repair.id);
};

const closeForm = () => uiStore.closeEdit('repair');

const onRepairSaved = () => {
  closeForm();
  loadRepairs();
};

const handleRowClick = (repair) => {
  if (!repair.is_resolved) openEditForm(repair);
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
      toast.error(error.response?.data?.message || 'Ошибка удаления');
    }
  }
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

watch(
  [
    () => repairsFilters.value.status,
    () => JSON.stringify(repairsFilters.value.equipmentIds || []),
    () => repairsFilters.value.dateFrom,
    () => repairsFilters.value.dateTo
  ],
  () => { resetPage(); }
);

onMounted(async () => {
  await Promise.all([loadRepairs(), equipmentStore.fetchAll()]);

  const { found, item, id } = await openFromUrl('repair', { queryKey: 'repairs_edit' });
  if (found) openEditForm(item);
  else if (id) toast.warning(`Заявка с ID ${id} не найдена`);

  document.addEventListener('keydown', handleKeydown);
});

onActivated(async () => {
  try { await repairsStore.fetchAll(); }
  catch (error) { console.error('Error loading repairs:', error); }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.repairs-view { padding: 0; }

/* ==========================================
   TOOLBAR
   ========================================== */
.toolbar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px; flex-wrap: wrap; gap: 12px;
}

.toolbar-left h2 {
  font-size: 24px; font-weight: 600; margin-bottom: 4px;
  color: #212529; display: flex; align-items: center; gap: 8px;
}
.toolbar-left h2 .title-icon { width: 24px; height: 24px; stroke: #212529; }
.toolbar-left .count { color: #6c757d; font-size: 14px; }

.toolbar-right {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}

.hotkey-hint {
  font-size: 13px; color: #6c757d; margin-bottom: 12px;
  padding: 6px 12px; background: #f8f9fa; border-radius: 6px;
  border: 1px solid #e9ecef; display: inline-block;
}
.hotkey-hint kbd {
  background: #e9ecef; padding: 1px 8px; border-radius: 4px;
  font-size: 12px; border: 1px solid #ced4da;
  font-family: inherit; font-weight: 600;
}

.stats-badges { display: flex; gap: 6px; }
.badge {
  padding: 3px 12px; border-radius: 12px; font-size: 12px;
  font-weight: 500; display: inline-flex; align-items: center; gap: 4px;
}
.badge .badge-icon { width: 14px; height: 14px; stroke: currentColor; }
.badge-success { background: #d1e7dd; color: #0f5132; }
.badge-warning { background: #fff3cd; color: #664d03; }

/* ==========================================
   КНОПКИ
   ========================================== */
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

/* ==========================================
   ФИЛЬТРЫ (desktop, > 1600px)
   ========================================== */
.filters {
  display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
  align-items: flex-end; background: #f8f9fa; padding: 16px;
  border-radius: 8px;
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

.date-filters { flex-direction: row; align-items: center; gap: 6px; }
.date-filters label { font-size: 13px; color: #888; margin: 0; }
.date-filters .form-control { min-width: 130px; }

.actions {
  flex-direction: row; align-items: flex-end;
  gap: 8px; padding-top: 0; flex: 0 0 auto;
}

.empty-state {
  text-align: center; padding: 40px; color: #6c757d;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.empty-state .empty-icon { width: 32px; height: 32px; stroke: #6c757d; }

/* ==========================================
   ТАБЛИЦА — РЕЗИНОВАЯ
   ========================================== */
.table-container {
  background: white; border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.repairs-table {
  width: 100%; border-collapse: collapse; font-size: 14px;
  table-layout: fixed;
}

.repairs-table thead { background: #f8f9fa; }

.repairs-table th {
  padding: 12px 12px; text-align: left; font-weight: 600;
  color: #495057; border-bottom: 2px solid #dee2e6;
  vertical-align: middle; word-break: normal; overflow-wrap: break-word;
}

.repairs-table td {
  border-bottom: 1px solid #e9ecef; vertical-align: top;
  word-break: normal; overflow-wrap: break-word;
}

.repairs-table th.sortable {
  cursor: pointer; user-select: none; transition: background 0.15s;
  white-space: nowrap;
}
.repairs-table th.sortable:hover { background: #e9ecef; }
.repairs-table th.sort-active { color: #0d6efd; }
.sort-icon {
  display: inline-block; margin-left: 4px; font-size: 12px;
  color: #0d6efd; font-weight: 700;
}

/* Ширины колонок */
.col-date        { width: 9%; }
.col-equipment   { width: 16%; }
.col-description { width: 21%; }
.col-detected-by { width: 11%; }
.col-possibility { width: 16%; }
.col-status      { width: 10%; }
.col-resolved-by { width: 11%; }
.col-actions     { width: 100px; }

.repairs-cards { display: flex; flex-direction: column; }

/* ==========================================
   ПЛАВНОЕ СЖАТИЕ ТАБЛИЦЫ (1401 – 1600px)
   ========================================== */
@media (max-width: 1600px) {
  .repairs-table th, .repairs-table td { padding: 10px 10px; font-size: 13.5px; }
}

@media (max-width: 1500px) {
  .repairs-table th, .repairs-table td { padding: 9px 8px; font-size: 13px; }
}

@media (max-width: 1400px) {
  .repairs-table th, .repairs-table td { padding: 8px 7px; font-size: 12.5px; }
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
   ≤ 1275px — МОБИЛЬНАЯ ВЁРСТКА
   ========================================== */
@media (max-width: 1275px) {
  .repairs-view { padding: 0 10px; }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 12px;
  }

  .toolbar-left {
    flex-wrap: wrap;
    gap: 8px;
  }

  .toolbar-left h2 {
    font-size: 20px;
    gap: 6px;
  }
  .toolbar-left h2 .title-icon { width: 22px; height: 22px; }

  .toolbar-right {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    width: 100%;
    align-items: stretch;
  }

  .toolbar-right .btn {
    flex: 1 1 0;
    min-width: 0;
    height: 42px;
    padding: 6px 12px;
    font-size: 13px;
    justify-content: center;
    white-space: nowrap;
  }
  .toolbar-right .btn .btn-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .drawer-body .filter-group .form-control { height: 40px; font-size: 14px; }
  .drawer-footer { flex-direction: column; }
  .drawer-footer .btn {
    width: 100%; justify-content: center; height: 42px;
  }
}

@media (max-width: 768px) {
  .toolbar-left h2 { font-size: 18px; }
  .toolbar-left h2 .title-text {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }
}

@media (max-width: 480px) {
  .repairs-view { padding: 0 6px; }
  .toolbar-right .btn { height: 40px; font-size: 12.5px; }
  .drawer-window { width: 100vw; max-width: 100vw; }
  .drawer-body { padding: 16px 14px 20px; }
}
</style>