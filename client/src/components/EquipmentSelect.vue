<template>
  <div class="multi-select-wrapper">
    <!-- Выбранные элементы -->
    <div v-if="selectedItems.length > 0" class="selected-list">
      <div
        v-for="item in selectedItems"
        :key="item.id"
        class="selected-item-wrapper"
      >
        <div class="selected-item">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-inv">(Инв. № {{ item.inventory_number }})</span>
          <button
            type="button"
            class="remove-btn"
            @click="removeItem(item.id)"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- Добавление нового оборудования -->
    <div class="add-row">
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
          :disabled="disabled"
        />
        
        <!-- Выпадающий список -->
        <div v-if="showDropdown && filteredItems.length > 0" class="dropdown">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="dropdown-item"
            @mousedown.prevent="selectItem(item)"
          >
            <span class="name">{{ item.name }}</span>
            <span class="inv">(Инв. № {{ item.inventory_number }})</span>
            <span class="status" :class="getStatusClass(item)">
              {{ item.working_status }}
            </span>
          </div>
        </div>

        <div v-if="showDropdown && filteredItems.length === 0 && searchQuery" class="empty">
          {{ emptyText }}
        </div>
      </div>

      <button
        type="button"
        class="btn-add"
        @click="addSelectedItem"
        :disabled="!selectedItemToAdd"
      >
        Добавить
      </button>
    </div>

    <!-- Предупреждение о неисправном оборудовании -->
    <small v-if="brokenCount > 0" style="color: #dc3545; display: block; margin-top: 6px;">
      {{ brokenCount }} единиц оборудования в ремонте, требует ремонта или на списании
    </small>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useEquipmentStore } from '../stores';

// ============================================
//  PROPS
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
    default: 'Выберите оборудование...'
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

// ============================================
//  EMITS
// ============================================
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
const selectedItemToAdd = ref(null);
let closeTimeout = null;

// ============================================
//  ВЫЧИСЛЯЕМЫЕ
// ============================================
const selectedIds = computed(() => {
  return Array.isArray(props.modelValue) ? props.modelValue : [];
});

const selectedItems = computed(() => {
  return props.equipmentOptions.filter(eq => selectedIds.value.includes(eq.id));
});

const availableEquipment = computed(() => {
  let list = props.equipmentOptions;
  if (props.onlyWorking) {
    list = list.filter(eq => 
      eq.working_status === 'Исправен' && 
      eq.write_off_status === 'На балансе'
    );
  }
  return list;
});

const filteredItems = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  let list = availableEquipment.value;
  
  // Исключаем уже выбранные
  list = list.filter(eq => !selectedIds.value.includes(eq.id));
  
  if (!query) return list;
  
  return list.filter(eq =>
    eq.name.toLowerCase().includes(query) ||
    eq.inventory_number.toLowerCase().includes(query) ||
    (eq.inventory_name && eq.inventory_name.toLowerCase().includes(query))
  );
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

const getStatusClass = (eq) => {
  if (eq.working_status === 'Исправен' && eq.write_off_status === 'На балансе') {
    return 'status-success';
  }
  if (eq.working_status !== 'Исправен') {
    return 'status-warning';
  }
  if (eq.write_off_status === 'На списание' || eq.write_off_status === 'Списан') {
    return 'status-danger';
  }
  return '';
};

const onInput = () => {
  showDropdown.value = true;
  selectedItemToAdd.value = null;
};

const onFocus = () => {
  clearTimeout(closeTimeout);
  showDropdown.value = true;
};

const closeDropdown = () => {
  closeTimeout = setTimeout(() => {
    showDropdown.value = false;
  }, 200);
};

const selectItem = (item) => {
  clearTimeout(closeTimeout);
  selectedItemToAdd.value = item;
  searchQuery.value = item.name;
  showDropdown.value = false;
  inputRef.value?.focus();
};

const addSelectedItem = () => {
  if (!selectedItemToAdd.value) return;
  
  const item = selectedItemToAdd.value;
  const current = [...selectedIds.value];
  
  if (!current.includes(item.id)) {
    current.push(item.id);
    emit('select', item);
    emit('update:modelValue', current);
  }
  
  // Сброс
  selectedItemToAdd.value = null;
  searchQuery.value = '';
  showDropdown.value = false;
  inputRef.value?.focus();
};

const removeItem = (id) => {
  const current = selectedIds.value.filter(item => item !== id);
  const removed = props.equipmentOptions.find(eq => eq.id === id);
  emit('update:modelValue', current);
  if (removed) {
    emit('remove', removed);
  }
};

const clearAll = () => {
  emit('update:modelValue', []);
  searchQuery.value = '';
  selectedItemToAdd.value = null;
  inputRef.value?.focus();
};

// ============================================
//  WATCH
// ============================================
watch(() => props.modelValue, (newVal) => {
  if (!newVal || newVal.length === 0) {
    searchQuery.value = '';
    selectedItemToAdd.value = null;
  }
});

defineExpose({ 
  clear: clearAll, 
  focus: () => inputRef.value?.focus()
});
</script>

<style scoped>
.multi-select-wrapper {
  position: relative;
  width: 100%;
}

/*  ВЫБРАННЫЕ ЭЛЕМЕНТЫ */
.selected-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.selected-item-wrapper {
  width: 100%;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
}

.selected-item .item-name {
  font-weight: 500;
}

.selected-item .item-inv {
  color: #6c757d;
  font-size: 13px;
}

.remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #6c757d;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
  margin-left: auto;
}

.remove-btn:hover {
  background: #dc3545;
  color: white;
}

/*  СТРОКА ДОБАВЛЕНИЯ */
.add-row {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.add-row .input-wrapper {
  flex: 1;
  position: relative;
}

.add-row .input-wrapper input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  background: #fff;
  color: #212529;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.add-row .input-wrapper input:focus {
  border-color: #80bdff;
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.add-row .input-wrapper input:disabled {
  background: #e9ecef;
  cursor: not-allowed;
}

.add-row .btn-add {
  padding: 8px 20px;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.add-row .btn-add:hover:not(:disabled) {
  background: #0b5ed7;
}

.add-row .btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/*  ВЫПАДАЮЩИЙ СПИСОК */
.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ced4da;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 9999;
  margin-top: 2px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-item .name {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
}

.dropdown-item .inv {
  color: #6c757d;
  font-size: 13px;
}

.dropdown-item .status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #e9ecef;
  white-space: nowrap;
}

.dropdown-item .status.status-success {
  background: #d4edda;
  color: #155724;
}

.dropdown-item .status.status-warning {
  background: #fff3cd;
  color: #856404;
}

.dropdown-item .status.status-danger {
  background: #f8d7da;
  color: #721c24;
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
  margin-top: 2px;
  z-index: 9999;
}

/* Адаптивность */
@media (max-width: 768px) {
  .add-row {
    flex-wrap: wrap;
  }
  
  .add-row .input-wrapper {
    flex: 1 1 100%;
  }
  
  .add-row .btn-add {
    flex: 1;
  }
}
</style>