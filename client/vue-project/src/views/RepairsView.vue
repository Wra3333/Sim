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
      <!-- Фильтр по статусу -->
      <select v-model="filters.status" class="form-control">
        <option value="">Все статусы</option>
        <option value="new">Новая</option>
        <option value="resolved">Устранена</option>
      </select>

      <!-- Поиск с множественным выбором -->
      <EquipmentMultiSelect
        v-model="filters.equipmentIds"
        :equipment-options="equipmentList"
        placeholder="Введите название или инв. номер..."
        @update:model-value="applyFilters"
      />

      <button class="btn btn-primary" @click="applyFilters">Обновить</button>
      <button class="btn btn-secondary" @click="resetFilters">Сбросить</button>
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
      v-model:visible="showDeleteModal"
      title="Удаление заявки"
      message="Вы уверены, что хотите удалить эту заявку?"
      confirm-text="Удалить"
      confirm-variant="danger"
      @confirm="handleDelete"
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
import { ref, computed, onMounted, watch } from 'vue';
import { repairsApi, equipmentApi } from '../api';
import RepairForm from '../components/repairs/RepairForm.vue';
import RepairCard from '../components/repairs/RepairCard.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import ResolveRepairModal from '../components/repairs/ResolveRepairModal.vue';
import EquipmentMultiSelect from '../components/EquipmentMultiSelect.vue';
import { useFilters } from '../composables/useFilters';
import { usePagination } from '../composables/usePagination';
import { useToastStore } from '../stores/toastStore';
import Pagination from '../components/Pagination.vue';

const { filters, resetFilters } = useFilters({
  status: '',
  equipmentIds: []
});

const toast = useToastStore();
const repairs = ref([]);
const equipmentList = ref([]);
const loading = ref(false);
const showForm = ref(false);
const showDeleteModal = ref(false);
const deleteRepairId = ref(null);
const editingRepair = ref(null);

const showResolveModal = ref(false);
const resolvingRepair = ref(null);
const isEditingResolvedBy = ref(false);

// Фильтрация
const filteredRepairs = computed(() => {
  let items = repairs.value;

  // Фильтр по статусу
  if (filters.value.status) {
    if (filters.value.status === 'resolved') {
      items = items.filter(item => item.is_resolved === true);
    } else if (filters.value.status === 'new') {
      items = items.filter(item => item.is_resolved === false);
    }
  }

  // Фильтр по оборудованию (из EquipmentMultiSelect)
  if (filters.value.equipmentIds && filters.value.equipmentIds.length > 0) {
    const ids = filters.value.equipmentIds.map(id => Number(id));
    items = items.filter(item => ids.includes(item.equipment_id));
  }

  return items;
});

const { 
  currentPage, 
  paginatedItems, 
  totalPages,
  resetPage,
  showPagination
} = usePagination(filteredRepairs, { pageSize: 3 });

const stats = computed(() => ({
  total: repairs.value.length,
  resolved: repairs.value.filter(r => r.is_resolved).length,
  active: repairs.value.filter(r => !r.is_resolved).length
}));

// Загрузка оборудования
const loadEquipment = async () => {
  try {
    const { data } = await equipmentApi.getAll();
    equipmentList.value = data || [];
  } catch (error) {
    console.error('Error loading equipment:', error);
  }
};

const loadRepairs = async () => {
  loading.value = true;
  try {
    const { data } = await repairsApi.getAll();
    repairs.value = data;
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

const confirmDelete = (id) => {
  deleteRepairId.value = id;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!deleteRepairId.value) return;

  try {
    await repairsApi.delete(deleteRepairId.value);
    await loadRepairs();
    toast.success('✅ Заявка удалена');
  } catch (error) {
    const msg = error.response?.data?.message || 'Ошибка удаления';
    toast.error(msg);
  } finally {
    showDeleteModal.value = false;
    deleteRepairId.value = null;
  }
};

watch([() => filters.value.status, () => filters.value.equipmentIds], () => {
  resetPage();
}, { deep: true });

onMounted(() => {
  loadRepairs();
  loadEquipment();
});
</script>

<style scoped>
.repairs-view {
  padding: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-left h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #212529;
}

.toolbar-left .count {
  color: #6c757d;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stats-badges {
  display: flex;
  gap: 6px;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: flex-start;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.filters select.form-control {
  min-width: 180px;
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  background: white;
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

.repairs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.badge {
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-success {
  background: #d1e7dd;
  color: #0f5132;
}

.badge-warning {
  background: #fff3cd;
  color: #664d03;
}
</style>