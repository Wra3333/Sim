<template>
  <div class="view-toggle">
    <button 
      class="view-toggle-btn"
      :class="{ active: modelValue === 'table' }"
      @click="$emit('update:modelValue', 'table')"
      title="Таблица"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="15" x2="21" y2="15"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
        <line x1="15" y1="3" x2="15" y2="21"/>
      </svg>
    </button>
    <button 
      class="view-toggle-btn"
      :class="{ active: modelValue === 'cards' }"
      @click="$emit('update:modelValue', 'cards')"
      title="Карточки"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: 'cards',
    validator: (value) => ['table', 'cards'].includes(value)
  }
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
.view-toggle {
  display: flex;
  gap: 4px;
  background: #f1f3f5;
  border-radius: 6px;
  padding: 3px;
}

.view-toggle-btn {
  background: transparent;
  border: none;
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  color: #868e96;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-toggle-btn:hover {
  color: #495057;
}

.view-toggle-btn.active {
  background: white;
  color: #0d6efd;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.view-toggle-btn svg {
  display: block;
}
</style>