<template>
  <div class="advanced-filter">
    <div class="filter-section">
      <h4>Расширенный фильтр</h4>
      <button class="btn-toggle" @click="expanded = !expanded">
        {{ expanded ? 'Скрыть' : 'Показать' }}
      </button>
    </div>

    <div v-if="expanded" class="filter-body">
      <div class="filter-row">
        <div class="filter-group">
          <label>Теги</label>
          <select v-model="filters.tags" multiple class="form-control">
            <option v-for="tag in allTags" :key="tag" :value="tag">#{{ tag }}</option>
          </select>
          <small class="text-muted">Удерживайте Ctrl для выбора нескольких</small>
        </div>
        
        <div class="filter-group">
          <label>Класс реалистичности</label>
          <input v-model="filters.realism_class" type="text" class="form-control" placeholder="Например: 1-3" />
        </div>
      </div>
      
      <div class="filter-row">
        <div class="filter-group">
          <label>Страна</label>
          <input v-model="filters.country" type="text" class="form-control" placeholder="Например: Россия" />
        </div>
        
        <div class="filter-group">
          <label>Производитель</label>
          <input v-model="filters.manufacturer" type="text" class="form-control" placeholder="Например: Siemens" />
        </div>
      </div>
      
      <div class="filter-row">
        <div class="filter-group">
          <label>Цена от</label>
          <input v-model.number="filters.min_price" type="number" class="form-control" placeholder="0" />
        </div>
        <div class="filter-group">
          <label>Цена до</label>
          <input v-model.number="filters.max_price" type="number" class="form-control" placeholder="1000000" />
        </div>
      </div>
      
      <div class="filter-row">
        <div class="filter-group">
          <label>Год от</label>
          <input v-model.number="filters.year_from" type="number" class="form-control" placeholder="2000" />
        </div>
        <div class="filter-group">
          <label>Год до</label>
          <input v-model.number="filters.year_to" type="number" class="form-control" placeholder="2025" />
        </div>
      </div>
      
      <div class="filter-actions">
        <button class="btn btn-primary" @click="applyFilters">Применить</button>
        <button class="btn btn-outline-secondary" @click="resetFilters">Сбросить</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  initialFilters: {
    type: Object,
    default: () => ({})
  },
  allTags: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['apply', 'reset']);

const expanded = ref(false);
const filters = ref({
  tags: [],
  realism_class: '',
  country: '',
  manufacturer: '',
  min_price: null,
  max_price: null,
  year_from: null,
  year_to: null,
  ...props.initialFilters
});

const applyFilters = () => {
  const cleanFilters = {};
  Object.entries(filters.value).forEach(([key, value]) => {
    if (value !== null && value !== '' && value !== undefined) {
      if (Array.isArray(value) && value.length === 0) return;
      cleanFilters[key] = value;
    }
  });
  emit('apply', cleanFilters);
};

const resetFilters = () => {
  filters.value = {
    tags: [],
    realism_class: '',
    country: '',
    manufacturer: '',
    min_price: null,
    max_price: null,
    year_from: null,
    year_to: null
  };
  emit('reset');
};
</script>

<style scoped>
.advanced-filter {
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-bottom: 16px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
}

.filter-section h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #212529;
}

.btn-toggle {
  background: transparent;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 13px;
  color: #6c757d;
}

.btn-toggle:hover {
  background: #e9ecef;
}

.filter-body {
  padding: 16px;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 13px;
  font-weight: 500;
  color: #495057;
}

.filter-group .form-control {
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  width: 100%;
  box-sizing: border-box;
}

.filter-group select[multiple] {
  min-height: 60px;
}

.filter-group .text-muted {
  font-size: 11px;
  color: #6c757d;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.btn {
  padding: 6px 16px;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
}

.btn-primary:hover {
  background: #0b5ed7;
}

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border-color: #6c757d;
}

.btn-outline-secondary:hover {
  background: #6c757d;
  color: white;
}

@media (max-width: 768px) {
  .filter-row {
    grid-template-columns: 1fr;
  }
}
</style>