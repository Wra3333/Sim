<template>
  <div class="multi-select-wrapper">
    <!-- Поле ввода -->
    <div class="input-wrapper">
      <input
        ref="inputRef"
        type="text"
        v-model="searchQuery"
        @input="onInput"
        @focus="showDropdown = true"
        @blur="closeDropdown"
        :placeholder="placeholder"
        autocomplete="off"
      />
      <!-- Счетчик выбранных (кликабельный) -->
      <span
        v-if="selectedIds.length > 0"
        class="selected-badge"
        @mousedown.prevent="clearAll"
        title="Очистить поиск и сбросить выбор"
      >
        {{ selectedIds.length }}
      </span>
    </div>

    <!-- Выпадающий список -->
    <div v-if="showDropdown && filteredItems.length > 0" class="dropdown">
      <div class="dropdown-header">
        <span class="result-count">Найдено: {{ filteredItems.length }}</span>
        <button
          v-if="filteredItems.length > 1"
          type="button"
          class="select-all-btn"
          @mousedown.prevent="selectAllFiltered"
        >
          Выбрать все
        </button>
      </div>

      <!-- ВЫБРАННЫЕ элементы (вверху) -->
      <div v-if="selectedFilteredItems.length > 0" class="dropdown-group">
        <div class="dropdown-group-label">Выбранные ({{ selectedFilteredItems.length }})</div>
        <div
          v-for="item in selectedFilteredItems"
          :key="item.id"
          class="dropdown-item selected"
          :class="{ broken: isBroken(item) }"
          @mousedown.prevent="toggleSelect(item)"
        >
          <input
            type="checkbox"
            :checked="true"
            @click.stop
          />
          <span class="item-name">{{ item.name }}</span>
          <span class="inv">({{ item.inventory_number }})</span>
          <span v-if="item.group" class="item-group">{{ item.group }}</span>
          <span class="item-status" :class="getStatusClass(item)">
            {{ getStatusText(item) }}
          </span>
          <span class="check-mark">✓</span>
        </div>
      </div>

      <!-- НЕВЫБРАННЫЕ элементы (внизу) -->
      <div v-if="unselectedFilteredItems.length > 0" class="dropdown-group">
        <div v-if="selectedFilteredItems.length > 0" class="dropdown-group-label">
          Доступные ({{ unselectedFilteredItems.length }})
        </div>
        <div
          v-for="item in unselectedFilteredItems"
          :key="item.id"
          class="dropdown-item"
          :class="{ broken: isBroken(item) }"
          @mousedown.prevent="toggleSelect(item)"
        >
          <input
            type="checkbox"
            :checked="false"
            @click.stop
          />
          <span class="item-name">{{ item.name }}</span>
          <span class="inv">({{ item.inventory_number }})</span>
          <span v-if="item.group" class="item-group">{{ item.group }}</span>
          <span class="item-status" :class="getStatusClass(item)">
            {{ getStatusText(item) }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="showDropdown && filteredItems.length === 0 && searchQuery" class="empty">
      <span>{{ emptyText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';

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
    default: 'Поиск оборудования...'
  },
  emptyText: {
    type: String,
    default: 'Ничего не найдено'
  },
  onlyWorking: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const inputRef = ref(null);
const searchQuery = ref('');
const showDropdown = ref(false);
let closeTimeout = null;

// ============================================
//  ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
// ============================================
const selectedIds = computed(() => {
  return Array.isArray(props.modelValue) ? props.modelValue : [];
});

// Показываем ВСЁ (и исправное, и неисправное)
const availableEquipment = computed(() => {
  return props.equipmentOptions;
});

// Все отфильтрованные по поиску
const filteredItems = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  let list = availableEquipment.value;
  if (!query) return list;
  return list.filter(eq =>
    (eq.name || '').toLowerCase().includes(query) ||
    (eq.inventory_number || '').toLowerCase().includes(query) ||
    (eq.group && eq.group.toLowerCase().includes(query)) ||
    (eq.working_status && eq.working_status.toLowerCase().includes(query))
  );
});

// ВЫБРАННЫЕ из отфильтрованных
const selectedFilteredItems = computed(() => {
  return filteredItems.value.filter(eq => selectedIds.value.includes(eq.id));
});

// НЕВЫБРАННЫЕ из отфильтрованных
const unselectedFilteredItems = computed(() => {
  return filteredItems.value.filter(eq => !selectedIds.value.includes(eq.id));
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
    return 'status-written-off';
  }
  if (eq.working_status === 'В ремонте') return 'status-repair';
  if (eq.working_status === 'Требует ремонта') return 'status-broken';
  if (eq.working_status === 'Исправен') return 'status-working';
  return 'status-unknown';
};

// Текст статуса
const getStatusText = (eq) => {
  if (eq.write_off_status === 'Списан') return 'Списан';
  if (eq.write_off_status === 'На списание') return 'На списании';
  return eq.working_status || 'Неизвестно';
};

const onInput = () => {
  showDropdown.value = true;
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
  } else {
    current.push(item.id);
  }

  emit('update:modelValue', current);
  showDropdown.value = true;
};

// Выбрать все из отфильтрованного
const selectAllFiltered = () => {
  const current = [...selectedIds.value];
  const filteredIds = filteredItems.value.map(item => item.id);

  for (const id of filteredIds) {
    if (!current.includes(id)) {
      current.push(id);
    }
  }

  emit('update:modelValue', current);
  showDropdown.value = true;
};

// ОЧИСТКА ВСЕГО
const clearAll = () => {
  searchQuery.value = '';
  emit('update:modelValue', []);
  showDropdown.value = true;
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  });
};

// Только очистка поиска
const clearSearch = () => {
  searchQuery.value = '';
  showDropdown.value = true;
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  });
};

defineExpose({
  clear: clearAll,
  clearSearch,
  focus: () => inputRef.value?.focus()
});
</script>

<style scoped>
.multi-select-wrapper {
  position: relative;
  width: 100%;
}

/* Поле ввода */
.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: 8px 40px 8px 12px;
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

.input-wrapper input::placeholder {
  color: #adb5bd;
}

/* Бейдж со счетчиком */
.selected-badge {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: #0d6efd;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  pointer-events: auto;
  z-index: 10;
}

.selected-badge:hover {
  background: #0b5ed7;
  transform: translateY(-50%) scale(1.05);
}

.selected-badge:active {
  transform: translateY(-50%) scale(0.95);
}

/* Выпадающий список */
.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ced4da;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 9999;
  margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  position: sticky;
  top: 0;
  z-index: 1;
}

.result-count {
  font-size: 12px;
  color: #6c757d;
}

.select-all-btn {
  font-size: 12px;
  color: #0d6efd;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s;
}

.select-all-btn:hover {
  background: #e9ecef;
}

/* Группы в списке */
.dropdown-group {
  border-bottom: 1px solid #f1f3f5;
}

.dropdown-group:last-child {
  border-bottom: none;
}

.dropdown-group-label {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #6c757d;
  background: #f8f9fa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f5;
  transition: background 0.15s;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-item.selected {
  background: #f0f7ff;
}

.dropdown-item.selected:hover {
  background: #e3f0ff;
}

/* ============================================
   НЕИСПРАВНОЕ — только визуальная пометка
   ============================================ */
.dropdown-item.broken:not(.selected) {
  background: #fff8f8;
}

.dropdown-item.broken:not(.selected):hover {
  background: #ffeaea;
}

.dropdown-item.broken:not(.selected) .item-name {
  color: #6c757d;
}

.dropdown-item.broken.selected {
  background: #f0f7ff;
}

.dropdown-item input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  accent-color: #0d6efd;
  pointer-events: none;
}

.item-name {
  font-size: 14px;
  color: #212529;
  flex: 1;
}

.inv {
  color: #6c757d;
  font-size: 13px;
}

.item-group {
  font-size: 12px;
  color: #6c757d;
  background: #e9ecef;
  padding: 0 8px;
  border-radius: 4px;
}

.item-status {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.check-mark {
  color: #0d6efd;
  font-weight: 700;
  font-size: 14px;
  margin-left: 4px;
}

.status-working {
  background: #d4edda;
  color: #155724;
}

.status-broken {
  background: #f8d7da;
  color: #721c24;
}

.status-repair {
  background: #fff3cd;
  color: #856404;
}

.status-written-off {
  background: #e9ecef;
  color: #495057;
}

.status-unknown {
  background: #e9ecef;
  color: #495057;
}

.empty {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 12px;
  text-align: center;
  color: #6c757d;
  background: white;
  border: 1px solid #ced4da;
  border-radius: 4px;
  margin-top: 4px;
  z-index: 9999;
}

/* Скроллбар */
.dropdown::-webkit-scrollbar {
  width: 6px;
}

.dropdown::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.dropdown::-webkit-scrollbar-thumb {
  background: #ced4da;
  border-radius: 4px;
}

.dropdown::-webkit-scrollbar-thumb:hover {
  background: #adb5bd;
}
</style>