<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useEquipmentStore } from '../stores';
import { useFilters } from '../composables/useFilters';
import { useFilteredItems } from '../composables/useFilteredItems';
import { usePagination } from '../composables/usePagination';
import { useToastStore } from '../stores/toastStore';
import EquipmentForm from '../components/equipment/EquipmentForm.vue';
import EquipmentCard from '../components/equipment/EquipmentCard.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import HistoryModal from '../components/equipment/HistoryModal.vue';
import EquipmentMultiSelect from '../components/EquipmentMultiSelect.vue';
import Pagination from '../components/Pagination.vue';

// ============================================
// ✅ STORE
// ============================================
const store = useEquipmentStore();
const toast = useToastStore();

// ✅ РАЗРЫВАЕМ РЕАКТИВНОСТЬ ПРАВИЛЬНО
const { items } = storeToRefs(store);

// ============================================
// ✅ СОСТОЯНИЕ
// ============================================
const loading = ref(true);
const showForm = ref(false);
const editingItem = ref(null);
const showDetails = ref(false);
const showDeleteModal = ref(false);
const deleteItemId = ref(null);
const showHistoryModal = ref(false);
const historyEquipment = ref(null);

// ============================================
// ✅ ФИЛЬТРЫ
// ============================================
const { filters, resetFilters, setFilter } = useFilters({
  working_status: '',
  write_off_status: '',
  equipmentIds: []
});

// ============================================
// ✅ КОНФИГУРАЦИЯ ФИЛЬТРОВ
// ============================================
const filterConfig = {
  working_status: {
    filterFn: (item, value) => {
      if (!value) return true;
      return item.working_status === value;
    }
  },
  write_off_status: {
    filterFn: (item, value) => {
      if (!value) return true;
      return item.write_off_status === value;
    }
  },
  equipmentIds: {
    filterFn: (item, value) => {
      if (!value || value.length === 0) return true;
      const ids = value.map(id => Number(id));
      return ids.includes(item.id);
    }
  }
};

// ============================================
// ✅ ФИЛЬТРАЦИЯ (используем items как ref)
// ============================================
const filteredEquipment = useFilteredItems(items, filters, filterConfig);

// ============================================
// ✅ ПАГИНАЦИЯ
// ============================================
const { 
  currentPage, 
  paginatedItems, 
  totalPages,
  resetPage,
  showPagination
} = usePagination(filteredEquipment, { pageSize: 8 });

// ============================================
// ✅ МЕТОДЫ
// ============================================
const loadEquipment = async () => {
  loading.value = true;
  try {
    await store.fetchAll();
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

// ============================================
// ✅ СБРОС ФИЛЬТРОВ
// ============================================
const resetAllFilters = () => {
  resetFilters();
  resetPage();
};

// ============================================
// ✅ WATCH
// ============================================
watch(
  [() => filters.value.working_status, () => filters.value.write_off_status, () => filters.value.equipmentIds], 
  () => {
    resetPage();
  }, 
  { deep: true }
);

// ============================================
// ✅ LIFECYCLE
// ============================================
onMounted(async () => {
  await loadEquipment();
});

onActivated(() => {
  loadEquipment();
});
</script>

<template>
  <div class="equipment-view">
    <!-- TOOLBAR -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>🖥️ Журнал учета оборудования</h2>
        <span class="count">Найдено: {{ filteredEquipment.length }}</span>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-primary" @click="openCreateForm">Добавить</button>
      </div>
    </div>

    <!-- ФИЛЬТРЫ -->
    <div class="filters">
      <select v-model="filters.working_status" class="form-control">
        <option value="">Все статусы</option>
        <option value="Исправен">Исправен</option>
        <option value="Требует ремонта">Требует ремонта</option>
        <option value="В ремонте">В ремонте</option>
      </select>

      <select v-model="filters.write_off_status" class="form-control">
        <option value="">Все статусы списания</option>
        <option value="На балансе">На балансе</option>
        <option value="На списание">На списание</option>
        <option value="Списан">Списан</option>
      </select>

      <EquipmentMultiSelect
        v-model="filters.equipmentIds"
        :equipment-options="items"
        placeholder="🔍 Поиск и выбор оборудования..."
        :max-items="5"
      />

      <button class="btn btn-outline-secondary" @click="resetAllFilters">Сбросить</button>
    </div>

    <!-- СПИСОК -->
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

    <!-- ПАГИНАЦИЯ -->
    <Pagination 
      v-if="showPagination"
      v-model:current-page="currentPage"
      :total-pages="totalPages"
      :loading="loading"
    />

    <!-- МОДАЛКИ -->
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
  padding: 4px 12px;
  font-size: 13px;
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

.filters .form-control {
  min-width: 180px;
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  background: white;
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

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }
  
  .filters .form-control {
    width: 100%;
    min-width: unset;
  }
  
  .filters .btn {
    width: 100%;
  }
}
</style>