<template>
  <div class="sidebar-card">
    <h4>
      <component :is="icon" class="h-icon" />
      {{ title }}
    </h4>

    <div class="filter-list">
      <div
        v-for="item in items"
        :key="item"
        class="filter-item"
        :class="{ active: selected === item }"
        @click="$emit('select', item)"
      >
        <span class="filter-name">{{ item }}</span>
        <span class="filter-count">{{ countFn(item) }}</span>
      </div>

      <div v-if="items.length === 0" class="filter-item empty">
        {{ emptyText }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  icon: {
    type: [Object, Function, String],
    required: true
  },
  items: {
    type: Array,
    default: () => []
  },
  selected: {
    type: [String, Number, null],
    default: null
  },
  countFn: {
    type: Function,
    required: true
  },
  emptyText: {
    type: String,
    default: 'Нет данных'
  }
});

defineEmits(['select']);
</script>

<style scoped>
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
  margin: 0 0 10px 0;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sidebar-card h4 .h-icon {
  width: 16px;
  height: 16px;
  stroke: #212529;
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.filter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 13px;
  border: 1px solid transparent;
}

.filter-item:hover {
  background: #f8f9fa;
  border-color: #e9ecef;
}

.filter-item.active {
  background: #e7f1ff;
  border-color: #0d6efd;
  color: #0d6efd;
}

.filter-item .filter-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.filter-item .filter-count {
  font-size: 12px;
  color: #6c757d;
  background: #e9ecef;
  padding: 0 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

.filter-item.active .filter-count {
  background: #0d6efd;
  color: white;
}

.filter-item.empty {
  cursor: default;
  color: #6c757d;
  justify-content: center;
}
</style>