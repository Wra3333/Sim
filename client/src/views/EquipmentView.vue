<template>
  <div class="equipment-view">
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>
          <IconEquipment class="title-icon" />
          <span class="title-text">Журнал учета оборудования</span>
        </h2>
        <span class="count">
          {{ showArchived ? 'В архиве:' : 'Найдено:' }} {{ filteredEquipment.length }}
        </span>
        <span class="count archived-count" v-if="equipmentStore.archivedCount > 0">
          Всего в архиве: {{ equipmentStore.archivedCount }}
        </span>
      </div>

      <div class="toolbar-right">
        <input type="file" ref="fileInput" accept=".xlsx,.xls" style="display: none" @change="handleImportExcel" />

        <div class="toolbar-row toolbar-row-secondary">
          <button
            v-if="authStore.hasRole('admin', 'methodist', 'technician')"
            class="btn btn-outline-secondary btn-mobile-icon"
            @click="fileInput.click()"
            title="Импорт Excel"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v12" />
              <path d="M7 10l5 5 5-5" />
              <path d="M4 19h16" />
            </svg>
            <span class="btn-text">Импорт Excel</span>
          </button>

          <button
            v-if="authStore.hasRole('admin', 'methodist', 'technician')"
            class="btn btn-outline-secondary btn-mobile-icon"
            @click="exportModalOpen = true"
            title="Экспорт Excel"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 21V9" />
              <path d="M7 14l5-5 5 5" />
              <path d="M4 5h16" />
            </svg>
            <span class="btn-text">Экспорт Excel</span>
          </button>

          <ViewToggle
            v-if="!isMobile"
            :model-value="equipmentViewMode"
            @update:model-value="handleViewModeChange"
          />

          <button
            v-if="isNarrow || isMobile"
            class="btn btn-outline-secondary btn-mobile-icon"
            :class="{ 'btn-active': mobileFiltersOpen }"
            @click="mobileFiltersOpen = true"
            title="Фильтры"
          >
            <IconFilter class="btn-icon" />
            <span class="btn-text">Фильтры</span>
            <span v-if="activeFiltersCount > 0" class="badge">{{ activeFiltersCount }}</span>
          </button>
        </div>

        <div
          v-if="authStore.hasRole('admin', 'technician') || authStore.hasRole('admin', 'methodist', 'technician')"
          class="toolbar-row toolbar-row-primary"
        >
          <button
            v-if="authStore.hasRole('admin', 'technician')"
            class="btn btn-mobile-icon"
            :class="showArchived ? 'btn-warning' : 'btn-outline-secondary'"
            @click="toggleArchived"
            :title="showArchived ? 'Показать активные' : 'Показать архив'"
          >
            <IconArchive class="btn-icon" />
            <span class="btn-text">{{ showArchived ? 'Активные' : 'Архив' }}</span>
            <span v-if="equipmentStore.archivedCount > 0 && !showArchived" class="badge">{{ equipmentStore.archivedCount }}</span>
          </button>

          <button
            v-if="authStore.hasRole('admin', 'methodist', 'technician')"
            class="btn btn-primary btn-mobile-icon"
            @click="openCreateForm"
            title="Добавить"
          >
            <IconPlus class="btn-icon" />
            <span class="btn-text">Добавить</span>
          </button>
        </div>
      </div>
    </div>

    <!-- DESKTOP -->
    <div v-if="!isMobile" class="content-with-sidebar" :class="{ 'no-sidebar': isNarrow }">
      <div class="main-content">
        <div v-if="!isNarrow && !showArchived" class="filters">
          <div class="filters-grid">
            <div class="filters-row">
              <div class="filter-group">
                <label>Статус</label>
                <select v-model="equipmentFilters.working_status" class="form-control form-control-sm">
                  <option value="">Все статусы</option>
                  <option value="Исправен">Исправен</option>
                  <option value="Частично неисправен">Частично неисправен</option>
                  <option value="Требует ремонта">Требует ремонта</option>
                  <option value="В ремонте">В ремонте</option>
                </select>
              </div>

              <div class="filter-group">
                <label>Списание</label>
                <select v-model="equipmentFilters.write_off_status" class="form-control form-control-sm">
                  <option value="">Все статусы</option>
                  <option value="На балансе">На балансе</option>
                  <option value="На списание">На списание</option>
                  <option value="Списан">Списан</option>
                </select>
              </div>

              <div class="filter-group filter-actions">
                <button class="btn btn-outline-secondary btn-sm" @click="resetAllFilters">
                  <IconReset class="btn-icon" />
                  Сбросить
                </button>
              </div>
            </div>

            <div class="filters-row filters-row-equipment">
              <div class="filter-group filter-group-equipment">
                <label>Оборудование</label>
                <EquipmentMultiSelect
                  :model-value="selectedEquipmentIds"
                  @update:model-value="handleEquipmentSelect"
                  :equipment-options="allEquipmentForSelect"
                  placeholder="Введите название или инв. номер..."
                />
              </div>
            </div>
          </div>
        </div>

        <template v-if="loading">
          <EquipmentTableSkeleton v-if="equipmentViewMode === 'table'" />
          <EquipmentGridSkeleton v-else />
        </template>

        <div v-else-if="filteredEquipment.length === 0" class="empty-state">
          <span>Нет оборудования</span>
        </div>

        <EquipmentTableView
          v-else-if="equipmentViewMode === 'table'"
          :items="paginatedItems"
          @edit="openEditForm"
          @delete="confirmDelete"
          @deletePermanent="confirmDeletePermanent"
          @history="openHistoryModal"
          @restore="handleRestore"
          @row-click="openEditForm"
        />

        <EquipmentCardView
          v-else
          :items="paginatedItems"
          @edit="openEditForm"
          @delete="confirmDelete"
          @deletePermanent="confirmDeletePermanent"
          @history="openHistoryModal"
          @restore="handleRestore"
          @photo-click="openEditForm"
        />

        <Pagination
          v-if="!loading && showPagination"
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :loading="loading"
        />
      </div>

      <div v-if="!isNarrow" class="sidebar-filters">
        <div class="sidebar-card">
          <h4>
            <IconFilter class="sidebar-icon" />
            Расширенные фильтры
          </h4>

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
              <div v-if="allTags.length === 0" class="no-tags">Нет тегов</div>
            </div>
          </div>

          <div class="filter-group sidebar-filter-group">
            <label>Страна</label>
            <input v-model="advancedFilters.country" type="text" class="form-control form-control-sm" placeholder="Например: Россия" />
          </div>

          <div class="filter-group sidebar-filter-group">
            <label>Производитель</label>
            <input v-model="advancedFilters.manufacturer" type="text" class="form-control form-control-sm" placeholder="Например: Limbs & Things" />
          </div>

          <div class="filter-group sidebar-filter-group">
            <label>Класс реалистичности</label>
            <input v-model="advancedFilters.realism_class" type="text" class="form-control form-control-sm" placeholder="Например: 1, 2, 3..." />
          </div>

          <div class="filter-group sidebar-filter-group">
            <label>Цена (₽)</label>
            <div class="price-inputs">
              <input v-model.number="advancedFilters.min_price" type="number" class="form-control form-control-sm" placeholder="От" />
              <span class="price-separator">—</span>
              <input v-model.number="advancedFilters.max_price" type="number" class="form-control form-control-sm" placeholder="До" />
            </div>
          </div>

          <div class="filter-group sidebar-filter-group">
            <label>Год закупки</label>
            <div class="price-inputs">
              <input v-model.number="advancedFilters.year_from" type="number" class="form-control form-control-sm" placeholder="От" />
              <span class="price-separator">—</span>
              <input v-model.number="advancedFilters.year_to" type="number" class="form-control form-control-sm" placeholder="До" />
            </div>
          </div>

          <div class="filter-group sidebar-filter-group">
            <label>Основание закупки</label>
            <input v-model="advancedFilters.purchase_basis" type="text" class="form-control form-control-sm" placeholder="Например: договор № 12" />
          </div>

          <button class="btn btn-outline-secondary btn-sm btn-reset" @click="resetAdvancedFilters">
            <IconReset class="btn-icon" />
            Сбросить расширенные
          </button>
        </div>
      </div>
    </div>

    <!-- MOBILE (≤ 1275px) -->
    <div v-else class="content">
      <div class="main-content">
        <template v-if="loading">
          <EquipmentGridSkeleton />
        </template>

        <div v-else-if="filteredEquipment.length === 0" class="empty-state">
          <span>Нет оборудования</span>
        </div>

        <EquipmentCardView
          v-else
          :items="paginatedItems"
          @edit="openEditForm"
          @delete="confirmDelete"
          @deletePermanent="confirmDeletePermanent"
          @history="openHistoryModal"
          @restore="handleRestore"
          @photo-click="openEditForm"
        />

        <Pagination
          v-if="!loading && showPagination"
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :loading="loading"
        />
      </div>
    </div>

    <!-- OFF-CANVAS -->
    <transition name="drawer-fade">
      <div
        v-if="mobileFiltersOpen"
        class="drawer-overlay"
        @click.self="mobileFiltersOpen = false"
      >
        <transition name="drawer-slide" appear>
          <div class="drawer-window">
            <div class="drawer-header">
              <h3>
                <IconFilter class="drawer-icon" />
                Фильтры
              </h3>
              <button class="drawer-close" @click="mobileFiltersOpen = false">×</button>
            </div>

            <div class="drawer-body">
              <div class="drawer-section-title">Базовые</div>

              <div class="filter-group">
                <label>Статус</label>
                <select v-model="equipmentFilters.working_status" class="form-control form-control-sm">
                  <option value="">Все статусы</option>
                  <option value="Исправен">Исправен</option>
                  <option value="Частично неисправен">Частично неисправен</option>
                  <option value="Требует ремонта">Требует ремонта</option>
                  <option value="В ремонте">В ремонте</option>
                </select>
              </div>

              <div class="filter-group">
                <label>Списание</label>
                <select v-model="equipmentFilters.write_off_status" class="form-control form-control-sm">
                  <option value="">Все статусы</option>
                  <option value="На балансе">На балансе</option>
                  <option value="На списание">На списание</option>
                  <option value="Списан">Списан</option>
                </select>
              </div>

              <div class="filter-group">
                <label>Оборудование</label>
                <EquipmentMultiSelect
                  :model-value="selectedEquipmentIds"
                  @update:model-value="handleEquipmentSelect"
                  :equipment-options="allEquipmentForSelect"
                  placeholder="Введите название или инв. номер..."
                />
              </div>

              <div class="drawer-section-title">Расширенные</div>

              <div class="filter-group">
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
                  <div v-if="allTags.length === 0" class="no-tags">Нет тегов</div>
                </div>
              </div>

              <div class="filter-group">
                <label>Страна</label>
                <input v-model="advancedFilters.country" type="text" class="form-control form-control-sm" placeholder="Например: Россия" />
              </div>

              <div class="filter-group">
                <label>Производитель</label>
                <input v-model="advancedFilters.manufacturer" type="text" class="form-control form-control-sm" placeholder="Например: Limbs & Things" />
              </div>

              <div class="filter-group">
                <label>Класс реалистичности</label>
                <input v-model="advancedFilters.realism_class" type="text" class="form-control form-control-sm" placeholder="Например: 1, 2, 3..." />
              </div>

              <div class="filter-group">
                <label>Цена (₽)</label>
                <div class="price-inputs">
                  <input v-model.number="advancedFilters.min_price" type="number" class="form-control form-control-sm" placeholder="От" />
                  <span class="price-separator">—</span>
                  <input v-model.number="advancedFilters.max_price" type="number" class="form-control form-control-sm" placeholder="До" />
                </div>
              </div>

              <div class="filter-group">
                <label>Год закупки</label>
                <div class="price-inputs">
                  <input v-model.number="advancedFilters.year_from" type="number" class="form-control form-control-sm" placeholder="От" />
                  <span class="price-separator">—</span>
                  <input v-model.number="advancedFilters.year_to" type="number" class="form-control form-control-sm" placeholder="До" />
                </div>
              </div>

              <div class="filter-group">
                <label>Основание закупки</label>
                <input v-model="advancedFilters.purchase_basis" type="text" class="form-control form-control-sm" placeholder="Например: договор № 12" />
              </div>
            </div>

            <div class="drawer-footer">
              <button class="btn btn-outline-secondary btn-sm" @click="resetAllFilters">
                <IconReset class="btn-icon" />
                Сбросить всё
              </button>
              <button class="btn btn-primary btn-sm" @click="mobileFiltersOpen = false">
                Применить
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

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
import { ref, computed, onMounted, onActivated, onBeforeUnmount, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useUrlSync } from '../composables/useUrlSync';
import { useEquipmentStore } from '../stores';
import { useUiStore } from '../stores/ui.store';
import { useToastStore } from '../stores/toastStore';
import { useAuthStore } from '../stores/auth.store';
import { equipmentApi } from '../api';
import EquipmentDrawer from '../components/equipment/EquipmentDrawer.vue';
import EquipmentTableView from '../components/equipment/EquipmentTableView.vue';
import EquipmentCardView from '../components/equipment/EquipmentCardView.vue';
import EquipmentTableSkeleton from '../components/equipment/EquipmentTableSkeleton.vue';
import EquipmentGridSkeleton from '../components/equipment/EquipmentGridSkeleton.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import HistoryModal from '../components/equipment/HistoryModal.vue';
import Pagination from '../components/Pagination.vue';
import ExportModal from '../components/equipment/ExportModal.vue';
import ViewToggle from '../components/ViewToggle.vue';
import EquipmentMultiSelect from '../components/EquipmentMultiSelect.vue';
import {
  IconEquipment, IconPlus, IconReset, IconArchive, IconFilter
} from '../components/icons';

const uiStore = useUiStore();
const equipmentStore = useEquipmentStore();
const toast = useToastStore();
const authStore = useAuthStore();

const { loading } = storeToRefs(equipmentStore);
const { filters, pagination, viewMode, editing, history, creating } = storeToRefs(uiStore);

// ============================================
//  MOBILE (≤ 1275px) — карточки
// ============================================
const isMobile = ref(false);
let mediaQuery = null;
const mobileFiltersOpen = ref(false);

const updateIsMobile = (e) => {
  isMobile.value = e.matches;
  if (isMobile.value) viewMode.value.equipment = 'cards';
};

// ============================================
//  NARROW (≤ 1600px) — скрытие сайдбара и встроенных фильтров
// ============================================
const isNarrow = ref(false);
let narrowQuery = null;

const updateIsNarrow = (e) => { isNarrow.value = e.matches; };

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    mediaQuery = window.matchMedia('(max-width: 1275px)');   // ← ИЗМЕНЕНО
    isMobile.value = mediaQuery.matches;
    if (isMobile.value) viewMode.value.equipment = 'cards';
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

watch(isMobile, (mob) => {
  if (mob) {
    viewMode.value.equipment = 'cards';
    mobileFiltersOpen.value = false;
  }
}, { immediate: true });

// ============================================
//  COUNTS
// ============================================
const advancedFiltersCount = computed(() => {
  let n = 0;
  const a = advancedFilters.value;
  if (a.tags && a.tags.length > 0) n++;
  if (a.country) n++;
  if (a.manufacturer) n++;
  if (a.realism_class) n++;
  if (a.min_price != null) n++;
  if (a.max_price != null) n++;
  if (a.year_from != null) n++;
  if (a.year_to != null) n++;
  if (a.purchase_basis) n++;
  return n;
});

const activeFiltersCount = computed(() => {
  let n = 0;
  const f = equipmentFilters.value;
  if (f.working_status) n++;
  if (f.write_off_status) n++;
  if (f.ids && f.ids.length > 0) n++;
  if (f.search) n++;
  n += advancedFiltersCount.value;
  return n;
});

// ============================================
//  URL ↔ STORE
// ============================================
const { openFromUrl } = useUrlSync({
  resolvers: {
    equipment: async (id) => {
      if (equipmentStore.allEquipment.length === 0) {
        await equipmentStore.fetchAll();
      }
      return equipmentStore.allEquipment.find((eq) => eq.id === id) ?? null;
    },
    equipmentHistory: async (id) => {
      if (equipmentStore.allEquipment.length === 0) {
        await equipmentStore.fetchAll();
      }
      return equipmentStore.allEquipment.find((eq) => eq.id === id) ?? null;
    }
  }
});

// ============================================
//  ФИЛЬТРЫ
// ============================================
const equipmentFilters = computed({
  get: () => filters.value.equipment || { working_status: '', write_off_status: '', search: '', tags: [], ids: [] },
  set: (val) => { filters.value.equipment = val; }
});

const equipmentPagination = computed({
  get: () => pagination.value.equipment || { page: 1, size: 6 },
  set: (val) => { pagination.value.equipment = val; }
});

const currentPage = computed({
  get: () => equipmentPagination.value.page || 1,
  set: (val) => { equipmentPagination.value = { ...equipmentPagination.value, page: val }; }
});

const pageSize = computed({
  get: () => equipmentPagination.value.size || 6,
  set: (val) => { equipmentPagination.value = { ...equipmentPagination.value, size: val, page: 1 }; }
});

// ============================================
//  VIEW MODE
// ============================================
const equipmentViewMode = computed({
  get: () => isMobile.value ? 'cards' : (viewMode.value.equipment || 'cards'),
  set: (val) => {
    if (!isMobile.value) viewMode.value.equipment = val;
  }
});

const handleViewModeChange = (mode) => {
  if (!isMobile.value) equipmentViewMode.value = mode;
};

// ============================================
//  DRAWER / HISTORY
// ============================================
const editingItem = computed(() => {
  const id = editing.value.equipment;
  if (!id) return null;
  return equipmentStore.allEquipment.find(eq => eq.id === id) || null;
});

const showForm = computed({
  get: () =>
    (editing.value.equipment !== null && editingItem.value !== null)
    || creating.value.equipment,
  set: (val) => { if (!val) uiStore.closeEdit('equipment'); }
});

const showHistoryModal = computed({
  get: () => !!history.value.equipment,
  set: (val) => { if (!val) uiStore.closeHistory('equipment'); }
});

const historyEquipment = computed(() => {
  const id = history.value.equipment;
  if (!id) return null;
  return equipmentStore.allEquipment.find(eq => eq.id === id) || null;
});

// ============================================
//  СОСТОЯНИЕ
// ============================================
const showArchived = ref(false);
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
//  MULTI SELECT
// ============================================
const selectedEquipmentIds = computed({
  get: () => equipmentFilters.value.ids || [],
  set: (val) => {
    equipmentFilters.value = { ...equipmentFilters.value, ids: val };
  }
});

const allEquipmentForSelect = computed(() =>
  equipmentStore.allEquipment.filter(eq =>
    !eq.is_archived &&
    eq.working_status === 'Исправен' &&
    eq.write_off_status === 'На балансе'
  )
);

const handleEquipmentSelect = (ids) => {
  selectedEquipmentIds.value = ids;
  currentPage.value = 1;
};

// ============================================
//  РАСШИРЕННЫЕ ФИЛЬТРЫ
// ============================================
const advancedFilters = ref({
  tags: [],
  realism_class: '',
  country: '',
  manufacturer: '',
  purchase_basis: '',
  min_price: null,
  max_price: null,
  year_from: null,
  year_to: null
});

const toggleTag = (tag) => {
  const i = advancedFilters.value.tags.indexOf(tag);
  if (i > -1) advancedFilters.value.tags.splice(i, 1);
  else advancedFilters.value.tags.push(tag);
  currentPage.value = 1;
};

const resetAdvancedFilters = () => {
  advancedFilters.value = {
    tags: [],
    realism_class: '',
    country: '',
    manufacturer: '',
    purchase_basis: '',
    min_price: null,
    max_price: null,
    year_from: null,
    year_to: null
  };
  currentPage.value = 1;
};

// ============================================
//  КОНФИГУРАЦИЯ ФИЛЬТРОВ
// ============================================
const filterConfig = {
  working_status: { filterFn: (item, v) => !v || item.working_status === v },
  write_off_status: { filterFn: (item, v) => !v || item.write_off_status === v },
  ids: {
    filterFn: (item, v) => !v || v.length === 0 || v.includes(item.id)
  },
  search: {
    filterFn: (item, v) => {
      if (!v) return true;
      const s = v.toLowerCase();
      return item.name?.toLowerCase().includes(s)
          || item.inventory_number?.toLowerCase().includes(s)
          || item.inventory_name?.toLowerCase().includes(s);
    }
  },
  tags: {
    filterFn: (item, v) => {
      if (!v || v.length === 0) return true;
      return v.some(tag => (item.tags || []).includes(tag));
    }
  },
  realism_class: { filterFn: (item, v) => !v || item.realism_class?.toLowerCase().includes(v.toLowerCase()) },
  country: { filterFn: (item, v) => !v || item.country?.toLowerCase().includes(v.toLowerCase()) },
  manufacturer: { filterFn: (item, v) => !v || item.manufacturer?.toLowerCase().includes(v.toLowerCase()) },
  purchase_basis: { filterFn: (item, v) => !v || item.purchase_basis?.toLowerCase().includes(String(v).toLowerCase()) },
  min_price: { filterFn: (item, v) => v == null || (item.price || 0) >= v },
  max_price: { filterFn: (item, v) => v == null || (item.price || 0) <= v },
  year_from: { filterFn: (item, v) => v == null || (item.year_of_release || 0) >= v },
  year_to: { filterFn: (item, v) => v == null || (item.year_of_release || 0) <= v }
};

const filteredEquipment = computed(() => {
  const list = showArchived.value ? [...equipmentStore.archivedItems] : [...equipmentStore.items];
  const allFilters = { ...equipmentFilters.value, ...advancedFilters.value };

  return list.filter(item => {
    let result = true;
    for (const [key, cfg] of Object.entries(filterConfig)) {
      const v = allFilters[key];
      if (v !== undefined && v !== null && v !== '') {
        if (Array.isArray(v)) {
          if (v.length > 0) result = result && cfg.filterFn(item, v);
        } else {
          result = result && cfg.filterFn(item, v);
        }
      }
    }
    return result;
  });
});

const totalPages = computed(() =>
  Math.ceil(filteredEquipment.value.length / pageSize.value) || 1
);

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredEquipment.value.slice(start, start + pageSize.value);
});

const showPagination = computed(() =>
  filteredEquipment.value.length > pageSize.value
);

// ============================================
//  МЕТОДЫ
// ============================================
const loadTags = async () => {
  try {
    const res = await equipmentApi.getTags();
    allTags.value = res.data || [];
  } catch (error) {
    console.error('Ошибка загрузки тегов:', error);
  }
};

const toggleArchived = () => {
  showArchived.value = !showArchived.value;
  selectedEquipmentIds.value = [];
  equipmentFilters.value = { ...equipmentFilters.value, search: '' };
  currentPage.value = 1;
};

const loadEquipment = async () => {
  try {
    await equipmentStore.fetchAll();
    await loadTags();
  } catch (error) {
    console.error('Error loading:', error);
    toast.error(error?.response?.data?.message || 'Ошибка загрузки оборудования');
  }
};

const openCreateForm = () => uiStore.openCreate('equipment');

const openEditForm = (item) => {
  if (!item) return;
  if (item.is_archived) {
    toast.warning('Нельзя редактировать архивированное оборудование');
    return;
  }
  uiStore.openEdit('equipment', item.id);
};

const closeForm = () => uiStore.closeEdit('equipment');

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
    toast.error(error?.response?.data?.message || 'Ошибка архивации');
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
    toast.error(error?.response?.data?.message || 'Ошибка удаления');
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
    toast.error(error?.response?.data?.message || 'Ошибка восстановления');
  }
};

const openHistoryModal = (item) => {
  if (item?.id) uiStore.openHistory('equipment', item.id);
};

const closeHistoryModal = () => uiStore.closeHistory('equipment');

const resetAllFilters = () => {
  uiStore.resetFilters('equipment');
  selectedEquipmentIds.value = [];
  resetAdvancedFilters();
};

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
    toast.error(error?.response?.data?.message || 'Ошибка импорта');
  }
};

const closeExportModal = () => { exportModalOpen.value = false; };

const handleExportExcel = async (selectedFields) => {
  try {
    if (!selectedFields || selectedFields.length === 0) {
      toast.error('Пожалуйста, выберите хотя бы одно поле');
      return;
    }

    const equipmentIds = filteredEquipment.value.map(eq => eq.id);
    const response = await equipmentApi.exportExcel(selectedFields, equipmentIds);

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
    toast.error(error?.response?.data?.message || 'Ошибка экспорта');
  }
};

const handleKeydown = (e) => {
  const tag = e.target.tagName.toLowerCase();
  if (e.key === 'Escape' && mobileFiltersOpen.value) {
    mobileFiltersOpen.value = false;
    return;
  }
  if (e.key === 'Enter' && tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
    e.preventDefault();
    if (showForm.value) closeForm();
    else openCreateForm();
  }
};

watch(
  [
    () => equipmentFilters.value.working_status,
    () => equipmentFilters.value.write_off_status,
    () => equipmentFilters.value.search,
    () => equipmentFilters.value.ids
  ],
  () => { if (!showArchived.value) currentPage.value = 1; },
  { deep: true }
);

onMounted(async () => {
  await loadEquipment();

  const edit = await openFromUrl('equipment', { queryKey: 'equipment_edit' });
  if (edit.found) openEditForm(edit.item);
  else if (edit.id) toast.warning(`Оборудование с ID ${edit.id} не найдено`);

  const hist = await openFromUrl('equipmentHistory', { queryKey: 'equipment_history' });
  if (hist.found) uiStore.openHistory('equipment', hist.item.id);
  else if (hist.id) toast.warning(`Оборудование с ID ${hist.id} не найдено для истории`);

  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});

onActivated(loadEquipment);
</script>

<style scoped>
/* ============================================
   БАЗА
   ============================================ */
.equipment-view { padding: 0; }

.toolbar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
}

.toolbar-left {
  display: flex; align-items: center; gap: 12px;
  flex-wrap: wrap; min-width: 0;
}

.toolbar-left h2 {
  font-size: 24px; font-weight: 600; margin: 0;
  color: #212529; display: flex; align-items: center; gap: 8px; min-width: 0;
}
.toolbar-left h2 .title-icon { width: 24px; height: 24px; stroke: #212529; flex-shrink: 0; }
.toolbar-left h2 .title-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.toolbar-left .count { color: #6c757d; font-size: 14px; white-space: nowrap; }
.toolbar-left .archived-count {
  color: #856404; background: #fff3cd; padding: 2px 10px;
  border-radius: 12px; font-size: 13px; white-space: nowrap;
}

.toolbar-right { display: flex; gap: 8px; align-items: flex-end; }

.toolbar-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.toolbar-row-secondary,
.toolbar-row-primary { justify-content: flex-end; }

.btn-active {
  background: #e7f1ff !important;
  color: #0d6efd !important;
  border-color: #0d6efd !important;
}

/* ============================================
   LAYOUT
   ============================================ */
.content-with-sidebar { display: flex; gap: 20px; }
.content-with-sidebar.no-sidebar { gap: 0; }
.content { display: block; }
.main-content { flex: 1; min-width: 0; }
.sidebar-filters { width: 280px; flex-shrink: 0; }

/* ============================================
   ФИЛЬТРЫ (desktop)
   ============================================ */
.filters {
  background: #f8f9fa; padding: 12px 16px;
  border-radius: 8px; margin-bottom: 20px;
}

.filters-grid { display: flex; flex-direction: column; gap: 8px; }

.filters-row {
  display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end;
}

.filters-row-equipment { margin-top: 2px; }

.filter-group {
  display: flex; flex-direction: column; gap: 4px;
  flex: 1; min-width: 140px;
}

.filter-group label {
  font-size: 12px; font-weight: 500; color: #495057; margin: 0;
}

.filter-group .form-control,
.filter-group .form-control-sm {
  padding: 4px 10px; border: 1px solid #ced4da; border-radius: 4px;
  font-size: 13px; background: white; width: 100%; height: 32px; line-height: 1.4;
}

.filter-group .form-control:focus,
.filter-group .form-control-sm:focus {
  border-color: #80bdff; outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.filter-actions {
  flex: 0 0 auto; min-width: auto;
  display: flex; gap: 8px; justify-content: flex-end;
}

.filter-group-equipment { flex: 1; min-width: 250px; }
.filter-group-equipment .multi-select-wrapper { min-width: 200px; }
.filter-group-equipment .multi-select-wrapper .input-wrapper input {
  padding: 4px 10px; height: 32px; font-size: 13px;
}

/* ============================================
   SIDEBAR FILTERS
   ============================================ */
.sidebar-card {
  background: white; border-radius: 8px; padding: 14px 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.sidebar-card h4 {
  font-size: 13px; font-weight: 600; margin: 0 0 10px 0;
  color: #212529; display: flex; align-items: center; gap: 6px;
}
.sidebar-card h4 .sidebar-icon { width: 16px; height: 16px; stroke: #212529; }

.sidebar-filter-group { margin-bottom: 10px; }
.sidebar-filter-group label {
  font-size: 12px; font-weight: 500; color: #495057;
  margin-bottom: 3px; display: block;
}
.sidebar-filter-group .form-control-sm {
  padding: 4px 10px; border: 1px solid #ced4da; border-radius: 4px;
  font-size: 13px; width: 100%; background: white; height: 30px;
}
.sidebar-filter-group .form-control-sm:focus {
  border-color: #80bdff; outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* ============================================
   КНОПКИ
   ============================================ */
.btn {
  padding: 5px 14px; border: 1px solid transparent; border-radius: 4px;
  font-size: 13.5px; cursor: pointer; transition: all 0.15s;
  display: inline-flex; align-items: center; gap: 6px; height: 34px;
}
.btn .btn-icon { width: 16px; height: 16px; stroke: currentColor; }
.btn .badge {
  background: #dc3545; color: white; border-radius: 999px;
  padding: 0 6px; font-size: 10.5px; line-height: 16px;
  min-width: 16px; text-align: center;
}
.btn-sm { padding: 3px 10px; font-size: 12.5px; height: 30px; }
.btn-primary { background: #0d6efd; color: white; border-color: #0d6efd; }
.btn-primary:hover { background: #0b5ed7; border-color: #0a58ca; }
.btn-outline-secondary { background: transparent; color: #6c757d; border: 1px solid #6c757d; }
.btn-outline-secondary:hover { background: #6c757d; color: white; }
.btn-warning { background: #ffc107; color: #212529; border-color: #ffc107; }
.btn-warning:hover { background: #e0a800; border-color: #d39e00; }
.btn-reset {
  width: 100%; margin-top: 2px; justify-content: center;
  height: 30px; font-size: 12px; padding: 0 12px;
}

.empty-state { text-align: center; padding: 40px; color: #6c757d; }

/* ============================================
   ТЕГИ / PRICE
   ============================================ */
.tags-select { display: flex; flex-wrap: wrap; gap: 4px; }
.tag-option {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 10px; font-size: 11px;
  cursor: pointer; background: #f1f3f5; color: #495057;
  transition: all 0.2s; border: 1px solid transparent;
}
.tag-option:hover { background: #e9ecef; }
.tag-option.active { background: #e7f1ff; color: #0d6efd; border-color: #0d6efd; }
.tag-option .tag-check { font-size: 10px; }
.no-tags { color: #adb5bd; font-size: 12px; }

.price-inputs { display: flex; align-items: center; gap: 4px; }
.price-inputs .form-control-sm {
  flex: 1; min-width: 50px; padding: 4px 8px; font-size: 12px; height: 30px;
}
.price-separator { color: #6c757d; font-size: 12px; }

/* ============================================
   OFF-CANVAS
   ============================================ */
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
.drawer-section-title {
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #6c757d;
  padding-top: 8px; border-top: 1px dashed #e9ecef; margin-top: 4px;
}
.drawer-section-title:first-child { padding-top: 0; border-top: none; margin-top: 0; }
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

/* ============================================
   АДАПТИВ
   ============================================ */
@media (max-width: 1200px) {
  .sidebar-filters { width: 240px; }
}

/* ==========================================
   ≤ 1275px — МОБИЛЬНАЯ ВЁРСТКА
   ========================================== */
@media (max-width: 1275px) {
  .equipment-view { padding: 0 10px; }
  .content, .content-with-sidebar { padding: 0 2px; }
  .main-content { padding-bottom: 24px; }

  .toolbar {
    flex-direction: column; align-items: stretch;
    gap: 12px; margin-bottom: 18px;
  }
  .toolbar-left { justify-content: flex-start; gap: 10px; flex-wrap: wrap; }
  .toolbar-left h2 { font-size: 20px; gap: 6px; }
  .toolbar-left h2 .title-icon { width: 22px; height: 22px; }
  .toolbar-left .count { font-size: 13px; }
  .toolbar-left .archived-count { font-size: 12px; padding: 2px 9px; }

  .toolbar-right {
    display: flex; flex-direction: column; gap: 8px;
    align-items: stretch; width: 100%;
  }

  .toolbar-row-secondary {
    display: flex; flex-wrap: nowrap; gap: 8px; width: 100%;
  }
  .toolbar-row-secondary .btn,
  .toolbar-row-secondary .view-toggle {
    flex: 1 1 0; min-width: 0; height: 38px; padding: 4px 10px;
    font-size: 12.5px; justify-content: center; white-space: nowrap;
  }
  .toolbar-row-secondary .btn .btn-icon { width: 14px; height: 14px; flex-shrink: 0; }
  .toolbar-row-secondary .btn .btn-text {
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .toolbar-row-primary {
    display: flex; flex-wrap: nowrap; gap: 8px; width: 100%;
  }
  .toolbar-row-primary .btn {
    flex: 1 1 0; min-width: 0; height: 42px; padding: 6px 12px;
    font-size: 13px; justify-content: center; white-space: nowrap;
  }
  .toolbar-row-primary .btn .btn-text { white-space: nowrap; }
  .toolbar-row-primary .btn .btn-icon { width: 16px; height: 16px; }

  .btn { height: 36px; }
  .btn-sm { height: 32px; }

  .drawer-window { width: 90vw; max-width: 480px; }
  .drawer-header { padding: 16px 18px; }
  .drawer-body { gap: 16px; padding: 18px 18px 22px; }
  .drawer-footer {
    padding: 14px 18px 18px; flex-direction: column; gap: 10px;
  }
  .drawer-footer .btn { width: 100%; justify-content: center; height: 42px; }
  .drawer-body .filter-group .form-control-sm { height: 40px; font-size: 14px; }
  .drawer-body .price-inputs .form-control-sm { height: 40px; font-size: 14px; }
  .tag-option { font-size: 12px; padding: 4px 10px; }
}

@media (max-width: 480px) {
  .equipment-view { padding: 0 6px; }
  .toolbar-left h2 { font-size: 16px; }
  .toolbar-left h2 .title-text {
    white-space: normal; overflow: visible; text-overflow: clip;
  }
  .toolbar-row-secondary .btn .btn-text { display: none; }
  .toolbar-row-secondary .btn { height: 36px; padding: 4px 8px; }
  .toolbar-row-secondary .btn .btn-icon { width: 16px; height: 16px; }
  .toolbar-row-primary .btn { height: 42px; font-size: 12.5px; }
  .toolbar-row-primary .btn .btn-text { display: inline; }
  .drawer-window { width: 100vw; max-width: 100vw; }
  .drawer-body { padding: 16px 14px 20px; }
}
</style>