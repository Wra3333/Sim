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
    </div>

    <!-- Выпадающий список -->
    <div v-if="showDropdown && filteredItems.length > 0" class="dropdown">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="dropdown-item"
        @mousedown.prevent="toggleSelect(item)"
      >
        <input
          type="checkbox"
          :checked="isSelected(item.id)"
          @change="toggleSelect(item)"
        />
        <span>{{ item.name }}</span>
        <span class="inv">({{ item.inventory_number }})</span>
      </div>
    </div>

    <div v-if="showDropdown && filteredItems.length === 0 && searchQuery" class="empty">
      {{ emptyText }}
    </div>

    <!-- Выбранные элементы (ПОД полем ввода) -->
    <div v-if="selectedItems.length > 0" class="selected-list">
      <span
        v-for="item in selectedItems"
        :key="item.id"
        class="selected-item"
      >
        {{ item.name }} ({{ item.inventory_number }})
        <button
          type="button"
          class="remove-btn"
          @click="removeItem(item.id)"
        >
          ×
        </button>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

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
    default: 'Введите название или инв. номер...'
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
  list = list.filter(eq => !selectedIds.value.includes(eq.id));
  if (!query) return list;
  return list.filter(eq =>
    eq.name.toLowerCase().includes(query) ||
    eq.inventory_number.toLowerCase().includes(query)
  );
});

const isSelected = (id) => {
  return selectedIds.value.includes(id);
};

const onInput = () => {
  showDropdown.value = true;
};

const closeDropdown = () => {
  closeTimeout = setTimeout(() => {
    showDropdown.value = false;
  }, 200);
};

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
  searchQuery.value = '';
  showDropdown.value = true;
};

const removeItem = (id) => {
  const current = selectedIds.value.filter(item => item !== id);
  emit('update:modelValue', current);
};

const clear = () => {
  emit('update:modelValue', []);
  searchQuery.value = '';
};

defineExpose({ clear, focus: () => inputRef.value?.focus() });
</script>

<style scoped>
.multi-select-wrapper {
  position: relative;
  width: 100%;
}

/* Поле ввода */
.input-wrapper input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  background: #fff;
  color: #212529;
}

.input-wrapper input:focus {
  border-color: #80bdff;
  outline: none;
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
  max-height: 200px;
  overflow-y: auto;
  z-index: 9999;
  margin-top: 4px;
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

.dropdown-item input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.dropdown-item .inv {
  color: #6c757d;
  font-size: 13px;
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

/* Выбранные элементы (ПОД полем) */
.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.selected-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: #6c757d;
  font-size: 16px;
  cursor: pointer;
  border-radius: 50%;
  padding: 0;
  line-height: 1;
}

.remove-btn:hover {
  background: #dc3545;
  color: white;
}
</style>