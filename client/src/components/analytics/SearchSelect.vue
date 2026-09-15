<template>
  <div class="search-select" ref="rootEl">
    <button
      type="button"
      class="search-select-trigger"
      :class="{ open: isOpen, filled: !!modelValue }"
      @click="toggle"
    >
      <span class="trigger-label">{{ currentLabel }}</span>
      <span class="trigger-arrow" :class="{ rotated: isOpen }">▾</span>
    </button>

    <div v-if="isOpen" class="search-select-dropdown">
      <input
        ref="searchEl"
        v-model="search"
        type="text"
        class="search-input"
        placeholder="Поиск..."
        @keydown.esc="close"
      />

      <div class="options">
        <div
          class="option option-all"
          :class="{ selected: !modelValue }"
          @click="select('')"
        >
          {{ allLabel }}
        </div>

        <div
          v-for="opt in filteredOptions"
          :key="opt.value"
          class="option"
          :class="{ selected: String(modelValue) === String(opt.value) }"
          @click="select(opt.value)"
        >
          <span class="option-label">{{ opt.label ?? opt.value }}</span>
        </div>

        <div v-if="filteredOptions.length === 0" class="option empty">
          Ничего не найдено
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Выберите...' },
  allLabel: { type: String, default: 'Все' }
});

const emit = defineEmits(['update:modelValue']);

const rootEl = ref(null);
const searchEl = ref(null);
const isOpen = ref(false);
const search = ref('');

const currentLabel = computed(() => {
  if (!props.modelValue && props.modelValue !== 0) return props.allLabel;
  const found = props.options.find(
    (o) => String(o.value) === String(props.modelValue)
  );
  if (found) return found.label ?? found.value;
  return String(props.modelValue);
});

const filteredOptions = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter((o) =>
    String(o.label ?? o.value).toLowerCase().includes(q)
  );
});

const toggle = async () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    search.value = '';
    await nextTick();
    searchEl.value?.focus();
  }
};

const close = () => {
  isOpen.value = false;
};

const select = (value) => {
  emit('update:modelValue', value);
  close();
};

const onClickOutside = (e) => {
  if (!rootEl.value) return;
  if (!rootEl.value.contains(e.target)) close();
};

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside);
});

watch(
  () => props.modelValue,
  () => {
    if (isOpen.value) close();
  }
);
</script>

<style scoped>
.search-select {
  position: relative;
  width: 100%;
}

.search-select-trigger {
  width: 100%;
  height: 30px;
  padding: 4px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  font-size: 13px;
  color: #212529;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.search-select-trigger:hover {
  border-color: #adb5bd;
}

.search-select-trigger.open,
.search-select-trigger:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.trigger-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.trigger-arrow {
  font-size: 10px;
  color: #6c757d;
  transition: transform 0.15s;
}

.trigger-arrow.rotated {
  transform: rotate(180deg);
}

.search-select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ced4da;
  border-radius: 6px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  z-index: 20;
  padding: 6px;
}

.search-input {
  width: 100%;
  height: 28px;
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 6px;
}

.search-input:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.15rem rgba(0, 123, 255, 0.2);
}

.options {
  max-height: 220px;
  overflow-y: auto;
}

.option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.1s;
}

.option:hover {
  background: #f1f3f5;
}

.option.selected {
  background: #e7f1ff;
  color: #0d6efd;
  font-weight: 500;
}

.option-all {
  color: #6c757d;
  border-bottom: 1px solid #f1f3f5;
  margin-bottom: 4px;
  padding-bottom: 6px;
}

.option.empty {
  color: #adb5bd;
  cursor: default;
  justify-content: center;
  font-size: 12px;
}
</style>