<!-- components/EquipmentSelect.vue -->
<template>
  <div class="select-wrapper">
    <div class="input-wrapper">
      <input
        ref="inputRef"
        type="text"
        :value="displayValue"
        @input="onInput"
        @focus="showDropdown = true"
        @blur="closeDropdown"
        :placeholder="placeholder"
        autocomplete="off"
        :disabled="disabled"
      />
      <span v-if="modelValue" class="clear-btn" @mousedown.prevent="clear">×</span>
    </div>

    <!-- Выпадающий список -->
    <div v-if="showDropdown && filteredItems.length > 0" class="dropdown">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="dropdown-item"
        @mousedown.prevent="selectItem(item)"
      >
        <span class="name">{{ item.name }}</span>
        <span class="inv">({{ item.inventory_number }})</span>
        <span class="status" :class="getStatusClass(item)">
          {{ item.working_status }}
        </span>
      </div>
    </div>

    <div v-if="showDropdown && filteredItems.length === 0 && searchQuery" class="empty">
      {{ emptyText }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: null
  },
  equipmentOptions: {
    type: Array,
    required: true
  },
  placeholder: {
    type: String,
    default: 'Введите название или инв. номер...'
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

const emit = defineEmits(['update:modelValue', 'select']);

const inputRef = ref(null);
const searchQuery = ref('');
const showDropdown = ref(false);
let closeTimeout = null;

// ============================================
// ✅ ОТОБРАЖАЕМОЕ ЗНАЧЕНИЕ - показываем название выбранного оборудования
// ============================================
const displayValue = computed(() => {
  if (!props.modelValue) return '';
  const eq = props.equipmentOptions.find(e => e.id === Number(props.modelValue));
  return eq ? `${eq.name} (Инв. № ${eq.inventory_number})` : '';
});

// ============================================
// ✅ ДОСТУПНОЕ ОБОРУДОВАНИЕ
// ============================================
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

// ============================================
// ✅ ФИЛЬТРОВАННЫЙ СПИСОК
// ============================================
const filteredItems = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  let list = availableEquipment.value;
  
  // Исключаем уже выбранное
  if (props.modelValue) {
    list = list.filter(eq => eq.id !== Number(props.modelValue));
  }
  
  if (!query) return list;
  
  return list.filter(eq =>
    eq.name.toLowerCase().includes(query) ||
    eq.inventory_number.toLowerCase().includes(query) ||
    (eq.inventory_name && eq.inventory_name.toLowerCase().includes(query))
  );
});

// ============================================
// ✅ СТАТУС ОБОРУДОВАНИЯ
// ============================================
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

// ============================================
// ✅ МЕТОДЫ
// ============================================
const onInput = (event) => {
  const value = event.target.value;
  searchQuery.value = value;
  showDropdown.value = true;
  
  // Если поле пустое - сбрасываем выбор
  if (!value) {
    emit('update:modelValue', null);
  }
};

const closeDropdown = () => {
  closeTimeout = setTimeout(() => {
    showDropdown.value = false;
  }, 200);
};

const selectItem = (item) => {
  clearTimeout(closeTimeout);
  emit('update:modelValue', item.id);
  emit('select', item);
  searchQuery.value = '';
  showDropdown.value = false;
};

const clear = () => {
  emit('update:modelValue', null);
  searchQuery.value = '';
  inputRef.value?.focus();
};

// ============================================
// ✅ НАБЛЮДАТЕЛЬ
// ============================================
watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    searchQuery.value = '';
  }
});

defineExpose({ clear, focus: () => inputRef.value?.focus() });
</script>

<style scoped>
.select-wrapper {
  position: relative;
  width: 100%;
}

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: 8px 32px 8px 12px;
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

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #6c757d;
  font-size: 18px;
  line-height: 1;
  padding: 0 4px;
}

.clear-btn:hover {
  color: #dc3545;
}

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
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-item .name {
  flex: 1;
  font-weight: 500;
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
</style>