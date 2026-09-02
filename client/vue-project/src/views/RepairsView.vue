<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepairsStore, useEquipmentStore } from '../stores';
import { useFilters } from '../composables/useFilters';
import { useFilteredItems } from '../composables/useFilteredItems';
import { usePagination } from '../composables/usePagination';
import { useToastStore } from '../stores/toastStore';
import { useConfirm } from '../composables/useConfirm';
import RepairForm from '../components/repairs/RepairForm.vue';
import RepairCard from '../components/repairs/RepairCard.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import ResolveRepairModal from '../components/repairs/ResolveRepairModal.vue';
import EquipmentMultiSelect from '../components/EquipmentMultiSelect.vue';
import Pagination from '../components/Pagination.vue';

// ============================================
// ✅ STORE
// ============================================
const repairsStore = useRepairsStore();
const equipmentStore = useEquipmentStore();
const toast = useToastStore();

const { items: repairsItems } = storeToRefs(repairsStore);
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
const editingRepair = ref(null);
const showResolveModal = ref(false);
const resolvingRepair = ref(null);
const isEditingResolvedBy = ref(false);

// ============================================
// ✅ ФИЛЬТРЫ
// ============================================
const { filters, resetFilters, setFilter } = useFilters({
  status: '',
  equipmentIds: []
});

// ============================================
// ✅ КОНФИГУРАЦИЯ ФИЛЬТРОВ
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
  }
};

// ============================================
// ✅ ФИЛЬТРАЦИЯ
// ============================================
const filteredRepairs = useFilteredItems(repairsItems, filters, filterConfig);

// ============================================
// ✅ ПАГИНАЦИЯ
// ============================================
const { 
  currentPage, 
  paginatedItems, 
  totalPages,
  resetPage,
  showPagination
} = usePagination(filteredRepairs, { pageSize: 3 });

// ============================================
// ✅ СТАТИСТИКА
// ============================================
const stats = computed(() => ({
  total: repairsItems.value.length,
  resolved: repairsItems.value.filter(r => r.is_resolved).length,
  active: repairsItems.value.filter(r => !r.is_resolved).length
}));

// ============================================
// ✅ ЗАГРУЗКА ДАННЫХ
// ============================================
const loadRepairs = async () => {
  loading.value = true;
  try {
    await repairsStore.fetchAll();
    resetPage();
  } catch (error) {
    console.error('Error loading repairs:', error);
    toast.error('Ошибка загрузки заявок');
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
  editingRepair.value = null;
  showForm.value = true;
};

const openEditForm = (repair) => {
  editingRepair.value = repair;
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
  editingRepair.value = null;
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
      toast.success('✅ Заявка удалена');
    } catch (error) {
      const msg = error.response?.data?.message || 'Ошибка удаления';
      toast.error(msg);
    }
  }
};

watch(
  [() => filters.value.status, () => filters.value.equipmentIds],
  () => {
    resetPage();
  },
  { deep: true }
);

onMounted(async () => {
  await Promise.all([
    loadRepairs(),
    equipmentStore.fetchAll()
  ]);
});

onActivated(() => {
  loadRepairs();
});
</script>

<template>
  <div class="repairs-view">
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>🔧 Журнал фиксации неисправностей</h2>
        <span class="count">Найдено заявок: {{ filteredRepairs.length }}</span>
      </div>
      <div class="toolbar-right">
        <div class="stats-badges">
          <span class="badge badge-success">Закрытых: {{ stats.resolved }}</span>
          <span class="badge badge-warning">Активных: {{ stats.active }}</span>
        </div>
        <button class="btn btn-primary" @click="openCreateForm">Создать заявку</button>
      </div>
    </div>

    <div class="filters">
      <select v-model="filters.status" class="form-control">
        <option value="">Все статусы</option>
        <option value="new">Новая</option>
        <option value="resolved">Устранена</option>
      </select>

      <EquipmentMultiSelect
        v-model="filters.equipmentIds"
        :equipment-options="equipmentItems"
        placeholder="Введите название или инв. номер..."
        @update:model-value="applyFilters"
      />

      <button class="btn btn-outline-secondary" @click="resetAllFilters">Сбросить</button>
    </div>

    <div v-if="loading" class="text-center">Загрузка...</div>
    <div v-else-if="filteredRepairs.length === 0" class="empty-state">
      Заявок не найдено
    </div>
    <div v-else class="repairs-list">
      <RepairCard
        v-for="repair in paginatedItems"
        :key="repair.id"
        :repair="repair"
        @delete="confirmDelete"
        @resolve="openResolveModal"
        @edit="openEditForm"
        @editResolvedBy="openEditResolvedBy"
      />
    </div>

    <Pagination 
      v-if="showPagination"
      v-model:current-page="currentPage"
      :total-pages="totalPages"
      :loading="loading"
    />

    <RepairForm
      v-if="showForm"
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

<style scoped>
.repairs-view { padding: 0; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.toolbar-left h2 { font-size: 24px; font-weight: 600; margin-bottom: 4px; color: #212529; }
.toolbar-left .count { color: #6c757d; }
.toolbar-right { display: flex; align-items: center; gap: 12px; }
.stats-badges { display: flex; gap: 6px; }
.filters { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; align-items: flex-start; background: #f8f9fa; padding: 16px; border-radius: 8px; }
.filters select.form-control { min-width: 180px; padding: 6px 12px; border: 1px solid #ced4da; border-radius: 4px; font-size: 14px; background: white; }
.btn { padding: 6px 16px; border: 1px solid transparent; border-radius: 4px; font-size: 14px; cursor: pointer; transition: all 0.15s; }
.btn-primary { background: #0d6efd; color: white; border-color: #0d6efd; }
.btn-primary:hover { background: #0b5ed7; border-color: #0a58ca; }
.btn-outline-secondary { background: transparent; color: #6c757d; border: 1px solid #6c757d; }
.btn-outline-secondary:hover { background: #6c757d; color: white; }
.empty-state { text-align: center; padding: 40px; color: #6c757d; }
.text-center { text-align: center; padding: 20px; color: #6c757d; }
.repairs-list { display: flex; flex-direction: column; gap: 12px; }
.badge { padding: 3px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
.badge-success { background: #d1e7dd; color: #0f5132; }
.badge-warning { background: #fff3cd; color: #664d03; }
</style>