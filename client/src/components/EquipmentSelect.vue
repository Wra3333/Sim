<template>
  <div class="equipment-select">
    <!-- Заголовок со счетчиком выбранных -->
    <div v-if="selectedIds.length > 0" class="selected-summary">
      <span class="summary-label">Выбрано:</span>
      <span class="summary-count">{{ selectedIds.length }}</span>
      <button
        type="button"
        class="summary-clear"
        @click="clearAll"
        title="Сбросить выбор"
      >
        Сбросить
      </button>
    </div>

    <!-- Поле поиска -->
    <div class="input-wrapper">
      <input
        ref="inputRef"
        type="text"
        v-model="searchQuery"
        @focus="showDropdown = true"
        @blur="closeDropdown"
        :placeholder="placeholder"
        autocomplete="off"
        :disabled="disabled"
      />
      <button
        v-if="searchQuery"
        type="button"
        class="clear-search"
        @mousedown.prevent="clearSearch"
        title="Очистить поиск"
      >
        ×
      </button>
    </div>

    <!-- Список с чекбоксами -->
    <div v-if="showDropdown && filteredItems.length > 0" class="options-list">
      <div class="options-header">
        <span class="found-count">Найдено: {{ filteredItems.length }}</span>
        <button
          v-if="unselectedFilteredItems.length > 1"
          type="button"
          class="select-all-btn"
          @mousedown.prevent="selectAllFiltered"
        >
          Выбрать все
        </button>
      </div>

      <!-- ВЫБРАННЫЕ элементы (вверху) -->
      <div v-if="selectedFilteredItems.length > 0" class="options-group">
        <div class="options-group-label">
          Выбранные ({{ selectedFilteredItems.length }})
        </div>
        <div
          v-for="item in selectedFilteredItems"
          :key="item.id"
          class="option-item selected"
          :class="{ broken: isBroken(item) }"
          @mousedown.prevent="toggleSelect(item)"
        >
          <input type="checkbox" :checked="true" @click.stop tabindex="-1" />
          <span class="name">{{ item.name }}</span>
          <span class="inv">Инв. № {{ item.inventory_number }}</span>
          <span class="status" :class="getStatusClass(item)">
            {{ getStatusText(item) }}
          </span>
        </div>
      </div>

      <!-- НЕВЫБРАННЫЕ элементы (внизу) -->
      <div v-if="unselectedFilteredItems.length > 0" class="options-group">
        <div
          v-if="selectedFilteredItems.length > 0"
          class="options-group-label"
        >
          Доступные ({{ unselectedFilteredItems.length }})
        </div>
        <div
          v-for="item in unselectedFilteredItems"
          :key="item.id"
          class="option-item"
          :class="{ broken: isBroken(item) }"
          @mousedown.prevent="toggleSelect(item)"
        >
          <input type="checkbox" :checked="false" @click.stop tabindex="-1" />
          <span class="name">{{ item.name }}</span>
          <span class="inv">Инв. № {{ item.inventory_number }}</span>
          <span class="status" :class="getStatusClass(item)">
            {{ getStatusText(item) }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-else-if="showDropdown && filteredItems.length === 0 && searchQuery"
      class="empty"
    >
      {{ emptyText }}
    </div>

    <!-- Предупреждение -->
    <small v-if="brokenCount > 0" class="broken-warning">
      {{ brokenCount }} ед. оборудования в ремонте, требует ремонта или на списании
    </small>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useEquipmentStore } from '../stores';

// ============================================
//  PROPS / EMITS
// ============================================
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  equipmentOptions: {
    type: Array,
    required: true
  },
  placeholder: {
    type: String,
    default: 'Поиск по названию или инв. номеру...'
  },
  emptyText: {
    type: String,
    default: 'Ничего не найдено'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  onlyWorking: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'select', 'remove']);

// ============================================
//  STORE
// ============================================
const equipmentStore = useEquipmentStore();

// ============================================
//  СОСТОЯНИЕ
// ============================================
const inputRef = ref(null);
const searchQuery = ref('');
const showDropdown = ref(false);
let closeTimeout = null;

// ============================================
//  ВЫЧИСЛЯЕМЫЕ
// ============================================
const selectedIds = computed(() => {
  return Array.isArray(props.modelValue) ? props.modelValue : [];
});

// Показываем ВСЁ оборудование (и исправное, и неисправное)
const availableEquipment = computed(() => {
  return props.equipmentOptions;
});

// Все отфильтрованные по поиску
const filteredItems = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  const list = availableEquipment.value;

  if (!query) return list;

  return list.filter(eq => {
    const name = (eq.name || '').toLowerCase();
    const inv = (eq.inventory_number || '').toLowerCase();
    const group = (eq.group || '').toLowerCase();
    const status = (eq.working_status || '').toLowerCase();

    return (
      name.includes(query) ||
      inv.includes(query) ||
      group.includes(query) ||
      status.includes(query)
    );
  });
});

// ВЫБРАННЫЕ из отфильтрованных (вверху)
const selectedFilteredItems = computed(() => {
  return filteredItems.value.filter(eq => selectedIds.value.includes(eq.id));
});

// НЕВЫБРАННЫЕ из отфильтрованных (внизу)
const unselectedFilteredItems = computed(() => {
  return filteredItems.value.filter(eq => !selectedIds.value.includes(eq.id));
});

const brokenCount = computed(() => {
  return equipmentStore.items.filter(eq =>
    eq.working_status !== 'Исправен' ||
    eq.write_off_status === 'На списание' ||
    eq.write_off_status === 'Списан'
  ).length;
});

// ============================================
//  МЕТОДЫ
// ============================================
const isSelected = (id) => {
  return selectedIds.value.includes(id);
};

// Неисправно ли оборудование (только для визуальной пометки)
const isBroken = (eq) => {
  return eq.working_status !== 'Исправен' ||
         eq.write_off_status === 'На списание' ||
         eq.write_off_status === 'Списан';
};

// Класс статуса
const getStatusClass = (eq) => {
  if (eq.write_off_status === 'Списан' || eq.write_off_status === 'На списание') {
    return 'status-danger';
  }
  if (eq.working_status === 'В ремонте') return 'status-warning';
  if (eq.working_status === 'Требует ремонта') return 'status-danger';
  if (eq.working_status === 'Исправен') return 'status-success';
  return '';
};

// Текст статуса
const getStatusText = (eq) => {
  if (eq.write_off_status === 'Списан') return 'Списан';
  if (eq.write_off_status === 'На списание') return 'На списании';
  return eq.working_status || 'Неизвестно';
};

const closeDropdown = () => {
  closeTimeout = setTimeout(() => {
    showDropdown.value = false;
  }, 200);
};

// ОСНОВНАЯ ЛОГИКА: любые элементы можно выбирать/снимать
const toggleSelect = (item) => {
  clearTimeout(closeTimeout);

  const current = [...selectedIds.value];
  const index = current.indexOf(item.id);

  if (index > -1) {
    current.splice(index, 1);
    emit('remove', item);
  } else {
    current.push(item.id);
    emit('select', item);
  }

  emit('update:modelValue', current);
  showDropdown.value = true;
};

// Выбрать все из НЕвыбранных (в отфильтрованном)
const selectAllFiltered = () => {
  const current = [...selectedIds.value];
  const added = [];

  for (const item of unselectedFilteredItems.value) {
    if (!current.includes(item.id)) {
      current.push(item.id);
      added.push(item);
    }
  }

  emit('update:modelValue', current);
  added.forEach(item => emit('select', item));
  showDropdown.value = true;
};

const clearSearch = () => {
  searchQuery.value = '';
  showDropdown.value = true;
  nextTick(() => inputRef.value?.focus());
};

const clearAll = () => {
  emit('update:modelValue', []);
  searchQuery.value = '';
  showDropdown.value = true;
  nextTick(() => inputRef.value?.focus());
};

// ============================================
//  WATCH
// ============================================
watch(() => props.modelValue, (newVal) => {
  if (!newVal || newVal.length === 0) {
    searchQuery.value = '';
  }
});

// ============================================
//  EXPOSE
// ============================================
defineExpose({
  clear: clearAll,
  focus: () => inputRef.value?.focus()
});
</script>

<style scoped>
.equipment-select {
  position: relative;
  width: 100%;
}

/* ============================================
   СВОДКА О ВЫБРАННОМ
   ============================================ */
.selected-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #e7f1ff;
  border: 1px solid #b8d4ff;
  border-radius: 4px;
  margin-bottom: 6px;
  font-size: 13px;
}

.summary-label {
  color: #4a7bc7;
}

.summary-count {
  background: #0d6efd;
  color: #fff;
  font-weight: 600;
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.summary-clear {
  margin-left: auto;
  background: transparent;
  border: none;
  color: #0d6efd;
  font-size: 13px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}

.summary-clear:hover {
  background: rgba(13, 110, 253, 0.1);
}

/* ============================================
   ПОЛЕ ПОИСКА
   ============================================ */
.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: 8px 36px 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  background: #fff;
  color: #212529;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input-wrapper input:focus {
  border-color: #80bdff;
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.input-wrapper input:disabled {
  background: #e9ecef;
  cursor: not-allowed;
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #6c757d;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.clear-search:hover {
  background: #e9ecef;
  color: #212529;
}

/* ============================================
   СПИСОК ОПЦИЙ
   ============================================ */
.options-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #ced4da;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 9999;
  margin-top: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  position: sticky;
  top: 0;
  z-index: 2;
  font-size: 12px;
}

.found-count {
  color: #6c757d;
}

.select-all-btn {
  font-size: 12px;
  color: #0d6efd;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}

.select-all-btn:hover {
  background: #e9ecef;
}

/* ============================================
   ГРУППЫ В СПИСКЕ
   ============================================ */
.options-group {
  border-bottom: 1px solid #f1f3f5;
}

.options-group:last-child {
  border-bottom: none;
}

.options-group-label {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #6c757d;
  background: #f8f9fa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 33px; /* высота .options-header */
  z-index: 1;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f5;
  transition: background 0.12s;
}

.option-item:last-child {
  border-bottom: none;
}

.option-item:hover {
  background: #f8f9fa;
}

.option-item.selected {
  background: #f0f7ff;
}

.option-item.selected:hover {
  background: #e3f0ff;
}

/* ============================================
   НЕИСПРАВНОЕ — только визуальная пометка
   ============================================ */
.option-item.broken:not(.selected) {
  background: #fff8f8;
}

.option-item.broken:not(.selected):hover {
  background: #ffeaea;
}

.option-item.broken:not(.selected) .name {
  color: #6c757d;
}

.option-item.broken.selected {
  background: #f0f7ff;
}

.option-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  accent-color: #0d6efd;
  pointer-events: none;
}

.option-item .name {
  font-size: 14px;
  font-weight: 500;
  color: #212529;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 40%;
}

.option-item .inv {
  color: #6c757d;
  font-size: 13px;
  white-space: nowrap;
}

.option-item .status {
  margin-left: auto;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #e9ecef;
  color: #495057;
  white-space: nowrap;
}

.option-item .status.status-success {
  background: #d4edda;
  color: #155724;
}

.option-item .status.status-warning {
  background: #fff3cd;
  color: #856404;
}

.option-item .status.status-danger {
  background: #f8d7da;
  color: #721c24;
}

/* ============================================
   ПУСТО
   ============================================ */
.empty {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 12px;
  text-align: center;
  color: #6c757d;
  background: #fff;
  border: 1px solid #ced4da;
  border-radius: 4px;
  margin-top: 4px;
  z-index: 9999;
  font-size: 13px;
}

/* ============================================
   ПРЕДУПРЕЖДЕНИЕ
   ============================================ */
.broken-warning {
  display: block;
  color: #dc3545;
  font-size: 12px;
  margin-top: 6px;
}

/* ============================================
   СКРОЛЛБАР
   ============================================ */
.options-list::-webkit-scrollbar {
  width: 6px;
}

.options-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.options-list::-webkit-scrollbar-thumb {
  background: #ced4da;
  border-radius: 4px;
}

.options-list::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}

/* ============================================
   АДАПТИВ
   ============================================ */
@media (max-width: 768px) {
  .option-item .name {
    max-width: 100%;
    white-space: normal;
  }

  .option-item .status {
    display: none;
  }
}
</style>