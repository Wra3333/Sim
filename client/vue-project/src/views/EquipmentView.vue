<template>
  <div class="equipment-view">
    <!-- TOOLBAR -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>
          <IconEquipment class="title-icon" />
          Журнал учета оборудования
        </h2>
        <span class="count">
          {{ showArchived ? 'В архиве:' : 'Найдено:' }} {{ filteredEquipment.length }}
        </span>
        <span class="count archived-count" v-if="equipmentStore.archivedCount > 0">
          Всего в архиве: {{ equipmentStore.archivedCount }}
        </span>
      </div>
      <div class="toolbar-right">
        <input 
          type="file" 
          ref="fileInput" 
          accept=".xlsx,.xls" 
          style="display: none"
          @change="handleImportExcel"
        />
        <button class="btn btn-outline-secondary" @click="fileInput.click()">
          <IconImport class="btn-icon" />
          Импорт Excel
        </button>
        <button class="btn btn-outline-secondary" @click="exportModalOpen = true">
          <IconExport class="btn-icon" />
          Экспорт Excel
        </button>
        
        <!-- ПЕРЕКЛЮЧАТЕЛЬ ВИДА -->
        <ViewToggle 
          :model-value="equipmentViewMode" 
          @update:model-value="setViewMode" 
        />

        <button class="btn" :class="showArchived ? 'btn-warning' : 'btn-outline-secondary'" @click="toggleArchived">
          <IconArchive class="btn-icon" />
          {{ showArchived ? 'Показать активные' : 'Показать архив' }}
          <span v-if="equipmentStore.archivedCount > 0 && !showArchived" class="badge">{{ equipmentStore.archivedCount }}</span>
        </button>
        
        <button class="btn btn-primary" @click="openCreateForm">
          <IconPlus class="btn-icon" />
          Добавить
        </button>
      </div>
    </div>

    <!-- ОСНОВНОЙ КОНТЕНТ С ФИЛЬТРАМИ СПРАВА -->
    <div class="content-with-sidebar">
      <!-- ОСНОВНАЯ ОБЛАСТЬ -->
      <div class="main-content">
        <!-- ФИЛЬТРЫ (горизонтальные, сверху) -->
        <div class="filters" v-if="!showArchived">
          <div class="filters-row">
            <div class="filter-group">
              <label>Статус</label>
              <select v-model="equipmentFilters.working_status" class="form-control">
                <option value="">Все статусы</option>
                <option value="Исправен">Исправен</option>
                <option value="Требует ремонта">Требует ремонта</option>
                <option value="В ремонте">В ремонте</option>
              </select>
            </div>

            <div class="filter-group">
              <label>Списание</label>
              <select v-model="equipmentFilters.write_off_status" class="form-control">
                <option value="">Все статусы</option>
                <option value="На балансе">На балансе</option>
                <option value="На списание">На списание</option>
                <option value="Списан">Списан</option>
              </select>
            </div>

            <div class="filter-group">
              <label>Поиск</label>
              <input 
                v-model="equipmentFilters.search" 
                type="text" 
                class="form-control" 
                placeholder="Поиск по названию или инв. номеру..."
              />
            </div>

            <div class="filter-group actions">
              <button class="btn btn-outline-secondary" @click="resetAllFilters">
                <IconReset class="btn-icon" />
                Сбросить
              </button>
            </div>
          </div>
        </div>

        <!-- СПИСОК -->
        <div v-if="loading" class="text-center">Загрузка...</div>
        <div v-else-if="filteredEquipment.length === 0" class="empty-state">
          <span>Нет оборудования</span>
        </div>

        <!-- ТАБЛИЦА -->
        <EquipmentTableView
          v-else-if="equipmentViewMode === 'table'"
          :items="paginatedItems"
          @edit="openEditForm"
          @delete="confirmDelete"
          @deletePermanent="confirmDeletePermanent"
          @history="openHistoryModal"
          @restore="handleRestore"
          @row-click="openEditForm"
          @deleteFile="handleDeleteFile"
        />

        <!-- КАРТОЧКИ -->
        <EquipmentCardView
          v-else
          :items="paginatedItems"
          @edit="openEditForm"
          @delete="confirmDelete"
          @deletePermanent="confirmDeletePermanent"
          @history="openHistoryModal"
          @restore="handleRestore"
          @photo-click="openEditForm"
          @deleteFile="handleDeleteFile"
        />

        <!-- ПАГИНАЦИЯ -->
        <Pagination 
          v-if="showPagination"
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :loading="loading"
        />
      </div>

      <!-- ПРАВАЯ ПАНЕЛЬ С РАСШИРЕННЫМИ ФИЛЬТРАМИ -->
      <div class="sidebar-filters">
        <div class="sidebar-card">
          <h4>
            <IconFilter class="sidebar-icon" />
            Расширенные фильтры
          </h4>
          
          <!-- Теги -->
          <div class="filter-group sidebar-filter-group">
            <label>Теги</label>
            <div class="tags-select">
              <div 
                v-for="tag in allTags" 
                :key="tag" 
                class="tag-option"
                :class="{ active: advancedFilters.tags?.includes(tag) }"
                @click="toggleTag(tag)"
              >
                <span class="tag-name">#{{ tag }}</span>
                <span class="tag-check" v-if="advancedFilters.tags?.includes(tag)">✓</span>
              </div>
              <div v-if="allTags.length === 0" class="no-tags">
                Нет тегов
              </div>
            </div>
          </div>

          <!-- Страна -->
          <div class="filter-group sidebar-filter-group">
            <label>Страна</label>
            <input 
              v-model="advancedFilters.country" 
              type="text" 
              class="form-control" 
              placeholder="Например: Россия"
              @input="applyAdvancedFilters"
            />
          </div>

          <!-- Производитель -->
          <div class="filter-group sidebar-filter-group">
            <label>Производитель</label>
            <input 
              v-model="advancedFilters.manufacturer" 
              type="text" 
              class="form-control" 
              placeholder="Например: Limbs & Things"
              @input="applyAdvancedFilters"
            />
          </div>

          <!-- Класс реалистичности -->
          <div class="filter-group sidebar-filter-group">
            <label>Класс реалистичности</label>
            <input 
              v-model="advancedFilters.realism_class" 
              type="text" 
              class="form-control" 
              placeholder="Например: A"
              @input="applyAdvancedFilters"
            />
          </div>

          <!-- Цена -->
          <div class="filter-group sidebar-filter-group">
            <label>Цена (₽)</label>
            <div class="price-inputs">
              <input 
                v-model.number="advancedFilters.min_price" 
                type="number" 
                class="form-control" 
                placeholder="От"
                @input="applyAdvancedFilters"
              />
              <span class="price-separator">—</span>
              <input 
                v-model.number="advancedFilters.max_price" 
                type="number" 
                class="form-control" 
                placeholder="До"
                @input="applyAdvancedFilters"
              />
            </div>
          </div>

          <!-- Год -->
          <div class="filter-group sidebar-filter-group">
            <label>Год закупки</label>
            <div class="price-inputs">
              <input 
                v-model.number="advancedFilters.year_from" 
                type="number" 
                class="form-control" 
                placeholder="От"
                @input="applyAdvancedFilters"
              />
              <span class="price-separator">—</span>
              <input 
                v-model.number="advancedFilters.year_to" 
                type="number" 
                class="form-control" 
                placeholder="До"
                @input="applyAdvancedFilters"
              />
            </div>
          </div>

          <button class="btn btn-outline-secondary btn-reset" @click="resetAdvancedFilters">
            <IconReset class="btn-icon" />
            Сбросить расширенные фильтры
          </button>
        </div>
      </div>
    </div>

    <!-- МОДАЛКИ -->
    <EquipmentDrawer
      :open="showForm"
      :equipment="editingItem"
      @close="closeForm"
      @save="onSaved"
    />

    <ConfirmModal
      v-model:visible="showArchiveModal"
      title="Архивация оборудования"
      message="Вы уверены, что хотите отправить это оборудование в архив?"
      confirm-text="Архивировать"
      confirm-variant="warning"
      @confirm="handleArchive"
    />

    <ConfirmModal
      v-model:visible="showDeletePermanentModal"
      title="Удаление оборудования"
      message="Вы уверены, что хотите удалить это оборудование навсегда? Это действие нельзя отменить!"
      confirm-text="Удалить навсегда"
      confirm-variant="danger"
      @confirm="handleDeletePermanent"
    />

    <HistoryModal
      :visible="showHistoryModal"
      :equipment="historyEquipment"
      @close="closeHistoryModal"
    />

    <ExportModal
      v-if="exportModalOpen"
      :fields="exportFields"
      :labels="exportFieldLabels"
      @close="closeExportModal"
      @export="handleExportExcel"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAppStore } from '../stores/appStore';
import { useEquipmentStore } from '../stores';
import { useToastStore } from '../stores/toastStore';
import { equipmentApi } from '../api';
import EquipmentDrawer from '../components/equipment/EquipmentDrawer.vue';
import EquipmentTableView from '../components/equipment/EquipmentTableView.vue';
import EquipmentCardView from '../components/equipment/EquipmentCardView.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import HistoryModal from '../components/equipment/HistoryModal.vue';
import Pagination from '../components/Pagination.vue';
import ExportModal from '../components/equipment/ExportModal.vue';
import ViewToggle from '../components/ViewToggle.vue';
import {
  IconEquipment,
  IconPlus,
  IconImport,
  IconExport,
  IconReset,
  IconArchive,
  IconFilter
} from '../components/icons';

// ============================================
// STORE
// ============================================
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const equipmentStore = useEquipmentStore();
const toast = useToastStore();

const { loading } = storeToRefs(equipmentStore);
const { filters, pagination, viewMode, editing, history } = storeToRefs(appStore);

// ============================================
// СОСТОЯНИЕ ИЗ APPSTORE
// ============================================

// Фильтры для оборудования
const equipmentFilters = computed({
  get: () => filters.value.equipment || { working_status: '', write_off_status: '', search: '', tags: [] },
  set: (val) => {
    filters.value.equipment = val;
  }
});

// Пагинация для оборудования
const equipmentPagination = computed({
  get: () => pagination.value.equipment || { page: 1, size: 7 },
  set: (val) => {
    pagination.value.equipment = val;
  }
});

// Вид отображения для оборудования
const equipmentViewMode = computed({
  get: () => viewMode.value.equipment || 'cards',
  set: (val) => {
    viewMode.value.equipment = val;
  }
});

// Текущая страница
const currentPage = computed({
  get: () => equipmentPagination.value.page || 1,
  set: (val) => {
    equipmentPagination.value = { ...equipmentPagination.value, page: val };
  }
});

// Размер страницы
const pageSize = computed({
  get: () => equipmentPagination.value.size || 7,
  set: (val) => {
    equipmentPagination.value = { ...equipmentPagination.value, size: val, page: 1 };
  }
});

// ============================================
// ЛОКАЛЬНОЕ СОСТОЯНИЕ
// ============================================
const showArchived = ref(false);
const showForm = ref(false);
const editingItem = ref(null);
const showArchiveModal = ref(false);
const showDeletePermanentModal = ref(false);
const deleteItemId = ref(null);
const allTags = ref([]);

const fileInput = ref(null);
const exportModalOpen = ref(false);
const exportFields = ref([
  'inventory_number', 'inventory_name', 'name', 'year_of_release',
  'description', 'purchase_basis', 'working_status', 'write_off_status',
  'photo', 'price', 'country', 'manufacturer', 'original_name', 'realism_class'
]);

const exportFieldLabels = {
  inventory_number: 'Инвентарный номер',
  inventory_name: 'Инвентарное наименование',
  name: 'Название',
  year_of_release: 'Год закупки',
  description: 'Краткое описание',
  purchase_basis: 'Основание закупки',
  working_status: 'Состояние',
  write_off_status: 'Статус списания',
  photo: 'Фото',
  price: 'Стоимость (₽)',
  country: 'Страна',
  manufacturer: 'Производитель',
  original_name: 'Оригинальное название',
  realism_class: 'Класс реалистичности'
};

// ============================================
// ИСТОРИЯ ПОЛОМОК
// ============================================
const showHistoryModal = computed({
  get: () => !!history.value?.equipment,
  set: (val) => {
    if (!val) {
      appStore.closeHistory('equipment');
    }
  }
});

const historyEquipment = computed({
  get: () => {
    const id = history.value?.equipment;
    if (id) {
      return equipmentStore.allEquipment.find(eq => eq.id === id) || null;
    }
    return null;
  },
  set: (val) => {
    if (val) {
      appStore.openHistory('equipment', val.id);
    } else {
      appStore.closeHistory('equipment');
    }
  }
});

// ============================================
// РАСШИРЕННЫЕ ФИЛЬТРЫ
// ============================================
const advancedFilters = ref({
  tags: [],
  realism_class: '',
  country: '',
  manufacturer: '',
  min_price: null,
  max_price: null,
  year_from: null,
  year_to: null
});

// Toggle тега
const toggleTag = (tag) => {
  const index = advancedFilters.value.tags.indexOf(tag);
  if (index > -1) {
    advancedFilters.value.tags.splice(index, 1);
  } else {
    advancedFilters.value.tags.push(tag);
  }
  applyAdvancedFilters();
};

const applyAdvancedFilters = () => {
  resetPage();
};

const resetAdvancedFilters = () => {
  advancedFilters.value = {
    tags: [],
    realism_class: '',
    country: '',
    manufacturer: '',
    min_price: null,
    max_price: null,
    year_from: null,
    year_to: null
  };
  resetPage();
};

// ============================================
// ФИЛЬТРАЦИЯ
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
  search: {
    filterFn: (item, value) => {
      if (!value) return true;
      const search = value.toLowerCase();
      return (
        item.name?.toLowerCase().includes(search) ||
        item.inventory_number?.toLowerCase().includes(search) ||
        item.inventory_name?.toLowerCase().includes(search)
      );
    }
  },
  tags: {
    filterFn: (item, value) => {
      if (!value || value.length === 0) return true;
      return value.some(tag => (item.tags || []).includes(tag));
    }
  },
  realism_class: {
    filterFn: (item, value) => {
      if (!value) return true;
      return item.realism_class?.toLowerCase().includes(value.toLowerCase());
    }
  },
  country: {
    filterFn: (item, value) => {
      if (!value) return true;
      return item.country?.toLowerCase().includes(value.toLowerCase());
    }
  },
  manufacturer: {
    filterFn: (item, value) => {
      if (!value) return true;
      return item.manufacturer?.toLowerCase().includes(value.toLowerCase());
    }
  },
  min_price: {
    filterFn: (item, value) => {
      if (value === null || value === undefined) return true;
      return (item.price || 0) >= value;
    }
  },
  max_price: {
    filterFn: (item, value) => {
      if (value === null || value === undefined) return true;
      return (item.price || 0) <= value;
    }
  },
  year_from: {
    filterFn: (item, value) => {
      if (value === null || value === undefined) return true;
      return (item.year_of_release || 0) >= value;
    }
  },
  year_to: {
    filterFn: (item, value) => {
      if (value === null || value === undefined) return true;
      return (item.year_of_release || 0) <= value;
    }
  }
};

const filteredEquipment = computed(() => {
  let list = [];
  
  if (showArchived.value) {
    list = [...equipmentStore.archivedItems];
  } else {
    list = [...equipmentStore.items];
  }
  
  const allFilters = { ...equipmentFilters.value, ...advancedFilters.value };
  
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
const totalPages = computed(() => {
  return Math.ceil(filteredEquipment.value.length / pageSize.value) || 1;
});

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredEquipment.value.slice(start, end);
});

const showPagination = computed(() => {
  return filteredEquipment.value.length > pageSize.value;
});

const resetPage = () => {
  currentPage.value = 1;
};

const setViewMode = (mode) => {
  equipmentViewMode.value = mode;
};

const loadTags = async () => {
  try {
    const res = await equipmentApi.getTags();
    allTags.value = res.data || [];
  } catch (error) {
    console.error('Ошибка загрузки тегов:', error);
  }
};

// ============================================
// МЕТОДЫ
// ============================================
const toggleArchived = () => {
  showArchived.value = !showArchived.value;
  resetPage();
};

const loadEquipment = async () => {
  loading.value = true;
  try {
    await equipmentStore.fetchAll();
    await loadTags();
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
  if (!item) return;
  if (item.is_archived) {
    toast.warning('Нельзя редактировать архивированное оборудование');
    return;
  }
  editingItem.value = item;
  showForm.value = true;
  if (item.id) {
    appStore.openEdit('equipment', item.id);
  }
};

const closeForm = () => {
  showForm.value = false;
  editingItem.value = null;
  appStore.closeEdit('equipment');
};

const onSaved = () => {
  closeForm();
  loadEquipment();
};

const confirmDelete = (id) => {
  deleteItemId.value = id;
  showArchiveModal.value = true;
};

const handleArchive = async () => {
  if (!deleteItemId.value) return;

  try {
    await equipmentStore.delete(deleteItemId.value);
    await loadEquipment();
    toast.success('Оборудование отправлено в архив');
  } catch (error) {
    toast.error(error?.response?.data?.message || "Ошибка архивации");
  } finally {
    showArchiveModal.value = false;
    deleteItemId.value = null;
  }
};

const confirmDeletePermanent = (id) => {
  deleteItemId.value = id;
  showDeletePermanentModal.value = true;
};

const handleDeletePermanent = async () => {
  if (!deleteItemId.value) return;

  try {
    await equipmentApi.deletePermanent(deleteItemId.value);
    await loadEquipment();
    toast.success('Оборудование удалено навсегда');
  } catch (error) {
    toast.error(error?.response?.data?.message || "Ошибка удаления");
  } finally {
    showDeletePermanentModal.value = false;
    deleteItemId.value = null;
  }
};

const handleRestore = async (id) => {
  try {
    await equipmentStore.restore(id);
    await loadEquipment();
    toast.success('Оборудование восстановлено из архива');
  } catch (error) {
    toast.error(error?.response?.data?.message || "Ошибка восстановления");
  }
};

const openHistoryModal = (item) => {
  if (item && item.id) {
    appStore.openHistory('equipment', item.id);
  }
};

const closeHistoryModal = () => {
  appStore.closeHistory('equipment');
};

const resetAllFilters = () => {
  appStore.resetFilters('equipment');
  advancedFilters.value = {
    tags: [],
    realism_class: '',
    country: '',
    manufacturer: '',
    min_price: null,
    max_price: null,
    year_from: null,
    year_to: null
  };
  resetPage();
};

// ✅ ОБРАБОТЧИК УДАЛЕНИЯ ФАЙЛА
const handleDeleteFile = async ({ equipmentId, fileId }) => {
  try {
    await equipmentApi.deleteAdditionalFile(equipmentId, fileId);
    await loadEquipment();
    toast.success('Файл удален');
  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    toast.error(error?.response?.data?.message || "Ошибка удаления файла");
  }
};

// ============================================
// АВТОМАТИЧЕСКОЕ ОТКРЫТИЕ ИЗ URL
// ============================================
const openFromUrl = async () => {
  const e = route.query.e;
  const historyId = route.query.history;
  
  if (e) {
    const id = parseInt(e, 10);
    if (!isNaN(id) && id > 0) {
      if (equipmentStore.allEquipment.length === 0) {
        await equipmentStore.fetchAll();
      }
      
      const item = equipmentStore.allEquipment.find(eq => eq.id === id);
      if (item) {
        if (showForm.value) {
          closeForm();
        }
        await nextTick();
        openEditForm(item);
        return true;
      } else {
        toast.warning(`Оборудование с ID ${id} не найдено`);
      }
    }
  }
  
  if (historyId) {
    const id = parseInt(historyId, 10);
    if (!isNaN(id) && id > 0) {
      if (equipmentStore.allEquipment.length === 0) {
        await equipmentStore.fetchAll();
      }
      
      const item = equipmentStore.allEquipment.find(eq => eq.id === id);
      if (item) {
        if (showForm.value) {
          closeForm();
        }
        await nextTick();
        appStore.openHistory('equipment', id);
        return true;
      } else {
        toast.warning(`Оборудование с ID ${id} не найдено для истории`);
      }
    }
  }
  
  return false;
};

// ============================================
// ИМПОРТ/ЭКСПОРТ
// ============================================
const handleImportExcel = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await equipmentApi.importExcel(formData);

    if (response.data.success) {
      toast.success(`Импортировано: ${response.data.createdCount} шт.`);
      await loadEquipment();
    } else {
      toast.error(response.data.errors?.map(e => e.message).join('\n'));
    }
  } catch (error) {
    toast.error(error?.response?.data?.message || "Ошибка импорта");
  }
};

const closeExportModal = () => {
  exportModalOpen.value = false;
};

const handleExportExcel = async (selectedFields) => {
  try {
    if (!selectedFields || selectedFields.length === 0) {
      toast.error('Пожалуйста, выберите хотя бы одно поле');
      return;
    }

    const response = await equipmentApi.exportExcel(selectedFields);

    const binaryString = atob(response.data.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = response.data.filename || 'equipment_export.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Экспорт успешен');
    closeExportModal();
  } catch (error) {
    console.error('Ошибка экспорта:', error);
    toast.error(error?.response?.data?.message || "Ошибка экспорта");
  }
};

// ============================================
// WATCH
// ============================================
watch(
  [() => equipmentFilters.value.working_status, () => equipmentFilters.value.write_off_status, () => equipmentFilters.value.search], 
  () => {
    if (!showArchived.value) {
      resetPage();
      const query = { ...route.query, p: 1 };
      router.replace({ query });
    }
  }, 
  { deep: true }
);

watch(currentPage, (newPage) => {
  const query = { ...route.query };
  query.p = newPage || 1;
  router.replace({ query });
});

watch(
  () => route.query.e,
  async (newVal) => {
    if (newVal) {
      await openFromUrl();
    } else {
      if (showForm.value) {
        closeForm();
      }
    }
  }
);

watch(
  () => route.query.history,
  async (newVal) => {
    if (newVal) {
      await openFromUrl();
    } else {
      if (showHistoryModal.value) {
        closeHistoryModal();
      }
    }
  }
);

// ============================================
// LIFECYCLE
// ============================================
onMounted(async () => {
  await loadEquipment();
  
  if (route.query.p) {
    const page = parseInt(route.query.p, 10);
    if (!isNaN(page) && page > 0) {
      currentPage.value = page;
    }
  } else {
    const storedPage = equipmentPagination.value.page || 1;
    currentPage.value = storedPage;
    const query = { ...route.query, p: storedPage };
    router.replace({ query });
  }
  
  await openFromUrl();
});

onActivated(() => {
  loadEquipment();
});
</script>

<style scoped>
.equipment-view {
  padding: 0;
}

/* ============================================
   TOOLBAR
   ============================================ */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
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

.toolbar-left .archived-count {
  color: #856404;
  background: #fff3cd;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 13px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

/* ============================================
   КОНТЕНТ С САЙДБАРОМ ФИЛЬТРОВ
   ============================================ */
.content-with-sidebar {
  display: flex;
  gap: 20px;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.sidebar-filters {
  width: 280px;
  flex-shrink: 0;
}

/* ============================================
   ФИЛЬТРЫ (ГОРИЗОНТАЛЬНЫЕ)
   ============================================ */
.filters {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filters-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
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
  flex: 0 0 auto;
}

/* ============================================
   САЙДБАР ФИЛЬТРОВ
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
  margin: 0 0 12px 0;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sidebar-card h4 .sidebar-icon {
  width: 16px;
  height: 16px;
  stroke: #212529;
}

.sidebar-filter-group {
  margin-bottom: 14px;
}

.sidebar-filter-group label {
  font-size: 12px;
  font-weight: 500;
  color: #495057;
  margin-bottom: 4px;
  display: block;
}

.sidebar-filter-group .form-control {
  padding: 6px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 13px;
  width: 100%;
  background: white;
}

.sidebar-filter-group .form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* Теги */
.tags-select {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-option {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  background: #f1f3f5;
  color: #495057;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.tag-option:hover {
  background: #e9ecef;
}

.tag-option.active {
  background: #e7f1ff;
  color: #0d6efd;
  border-color: #0d6efd;
}

.tag-option .tag-check {
  font-size: 10px;
}

.no-tags {
  color: #adb5bd;
  font-size: 13px;
}

/* Цена и год */
.price-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.price-inputs .form-control {
  flex: 1;
  min-width: 60px;
  padding: 6px 8px;
  font-size: 13px;
}

.price-separator {
  color: #6c757d;
  font-size: 14px;
}

/* Кнопка сброса */
.btn-reset {
  width: 100%;
  margin-top: 4px;
  justify-content: center;
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

.btn .badge {
  background: #dc3545;
  color: white;
  border-radius: 50%;
  padding: 0 6px;
  font-size: 11px;
  line-height: 18px;
  min-width: 18px;
  text-align: center;
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

.btn-warning {
  background: #ffc107;
  color: #212529;
  border-color: #ffc107;
}

.btn-warning:hover {
  background: #e0a800;
  border-color: #d39e00;
}

/* ============================================
   ОСТАЛЬНЫЕ СТИЛИ
   ============================================ */
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

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 1200px) {
  .sidebar-filters {
    width: 240px;
  }
}

@media (max-width: 992px) {
  .content-with-sidebar {
    flex-direction: column;
  }
  
  .sidebar-filters {
    width: 100%;
  }
  
  .sidebar-card {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
  
  .sidebar-card h4 {
    grid-column: 1 / -1;
    margin-bottom: 4px;
  }
  
  .sidebar-filter-group {
    margin-bottom: 0;
  }
  
  .btn-reset {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .actions {
    flex-direction: row;
  }
  
  .sidebar-card {
    grid-template-columns: 1fr;
  }
  
  .price-inputs {
    flex-wrap: wrap;
  }
  
  .price-inputs .form-control {
    min-width: 80px;
  }
}
</style>