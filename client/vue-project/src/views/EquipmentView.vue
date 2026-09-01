<template>
  <div class="equipment-view">
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>🖥️ Журнал учета оборудования</h2>
        <span class="count">Найдено: {{ filteredEquipment.length }}</span>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-primary" @click="openCreateForm">Добавить</button>
      </div>
    </div>

    <div class="filters">
      <!-- Фильтр по статусу -->
      <select v-model="filters.status" class="form-control">
        <option value="">Все статусы</option>
        <option value="Исправен">Исправен</option>
        <option value="Требует ремонта">Требует ремонта</option>
        <option value="В ремонте">В ремонте</option>
        <option value="На списание">На списание</option>
        <option value="Списан">Списан</option>
      </select>

      <!-- 🔍 ПОИСК С МНОЖЕСТВЕННЫМ ВЫБОРОМ -->
      <EquipmentMultiSelect
        v-model="filters.equipmentIds"
        :equipment-options="equipmentList"
        placeholder="🔍 Поиск и выбор оборудования..."
        :max-items="5"
        @select="onSearchSelect"
        @remove="onSearchRemove"
      />

      <button class="btn btn-primary" @click="applyFilters">Обновить</button>
      <button class="btn btn-secondary" @click="resetFilters">Сбросить</button>
    </div>

    <div v-if="loading" class="text-center">Загрузка...</div>
    <div v-else-if="filteredEquipment.length === 0" class="empty-state">
      Нет оборудования
    </div>
    <div v-else class="equipment-grid">
      <EquipmentCard
        v-for="item in paginatedItems"
        :key="item.id"
        :equipment="item"
        @edit="openEditForm"
        @delete="confirmDelete"
        @view="openViewForm"
        @history="openHistoryModal"
      />
    </div>

    <Pagination 
      v-if="showPagination"
      v-model:current-page="currentPage"
      :total-pages="totalPages"
      :loading="loading"
    />

    <EquipmentForm
      v-if="showForm"
      :equipment="editingItem"
      @close="closeForm"
      @save="onSaved"
    />

    <ConfirmModal
      v-model:visible="showDeleteModal"
      title="Удаление оборудования"
      message="Вы уверены, что хотите удалить это оборудование?"
      confirm-text="Удалить"
      confirm-variant="danger"
      @confirm="handleDelete"
    />

    <HistoryModal
      :visible="showHistoryModal"
      :equipment="historyEquipment"
      @close="closeHistoryModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useEquipmentStore } from '../stores';
import { equipmentApi } from '../api';
import EquipmentForm from '../components/equipment/EquipmentForm.vue';
import EquipmentCard from '../components/equipment/EquipmentCard.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import HistoryModal from '../components/equipment/HistoryModal.vue';
import EquipmentMultiSelect from '../components/EquipmentMultiSelect.vue';
import { useFilters } from '../composables/useFilters';
import { usePagination } from '../composables/usePagination';
import { useToastStore } from '../stores/toastStore';
import Pagination from '../components/Pagination.vue';

const store = useEquipmentStore();
const toast = useToastStore();
const equipment = ref([]);
const equipmentList = ref([]);
const loading = ref(false);
const showForm = ref(false);
const editingItem = ref(null);
const showDetails = ref(false);

const showDeleteModal = ref(false);
const deleteItemId = ref(null);
const showHistoryModal = ref(false);
const historyEquipment = ref(null);

const { filters, resetFilters } = useFilters({
  status: '',
  equipmentIds: []
});

// Фильтрация
const filteredEquipment = computed(() => {
  let items = equipment.value;

  // Фильтр по статусу
  if (filters.value.status) {
    items = items.filter(item => item.working_status === filters.value.status);
  }

  // 📋 Фильтр по множественному выбору оборудования (из SearchWithSuggestions)
  if (filters.value.equipmentIds && filters.value.equipmentIds.length > 0) {
    const ids = filters.value.equipmentIds.map(id => Number(id));
    items = items.filter(item => ids.includes(item.id));
  }

  return items;
});

const { 
  currentPage, 
  paginatedItems, 
  totalPages,
  resetPage,
  showPagination
} = usePagination(filteredEquipment, { pageSize: 8 });

const loadEquipmentList = async () => {
  try {
    const { data } = await equipmentApi.getAll();
    equipmentList.value = data || [];
  } catch (error) {
    console.error('Error loading equipment list:', error);
  }
};

const onSearchSelect = (item) => {
  console.log('✅ Выбрано:', item.name);
  applyFilters();
};

const onSearchRemove = (item) => {
  console.log('❌ Удалено:', item.name);
  applyFilters();
};

const loadEquipment = async () => {
  loading.value = true;
  try {
    const data = await store.fetchAll();
    equipment.value = data;
    resetPage();
  } catch (error) {
    console.error('Error loading:', error);
    toast.error(error?.response?.data?.message || "Ошибка загрузки оборудования");
  } finally {
    loading.value = false;
  }
};

const openCreateForm = () => {
  editingItem.value = null;
  showForm.value = true;
};

const openEditForm = (item) => {
  editingItem.value = item;
  showForm.value = true;
};

const openViewForm = (item) => {
  editingItem.value = item;
  showDetails.value = true;
};

const closeForm = () => {
  showForm.value = false;
  showDetails.value = false;
  editingItem.value = null;
};

const onSaved = () => {
  closeForm();
  loadEquipment();
};

const confirmDelete = (id) => {
  deleteItemId.value = id;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!deleteItemId.value) return;

  try {
    await store.delete(deleteItemId.value);
    await loadEquipment();
    toast.success('✅ Оборудование удалено');
  } catch (error) {
    toast.error(error?.response?.data?.message || "Ошибка удаления");
  } finally {
    showDeleteModal.value = false;
    deleteItemId.value = null;
  }
};

const openHistoryModal = (item) => {
  historyEquipment.value = item;
  showHistoryModal.value = true;
};

const closeHistoryModal = () => {
  showHistoryModal.value = false;
  historyEquipment.value = null;
};

const applyFilters = () => {
  resetPage();
};

watch([() => filters.value.status, () => filters.value.equipmentIds], () => {
  resetPage();
}, { deep: true });

onMounted(async () => {
  await Promise.all([
    loadEquipment(),
    loadEquipmentList()
  ]);
});
</script>

<style scoped>
.equipment-view {
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
  gap: 8px;
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

.btn-sm {
  padding: 4px 12px;
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

.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
</style>