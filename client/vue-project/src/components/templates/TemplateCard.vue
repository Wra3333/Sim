<template>
  <div class="template-item">
    <div class="template-info">
      <h3>{{ title }}</h3>
      <div class="meta">
        <span>📚 {{ discipline }}</span>
        <span v-if="hasModule">📂 {{ module }}</span>
      </div>
      <div class="equipment-preview" v-if="hasEquipmentPreview">
        <span class="badge badge-secondary" v-for="(item, index) in equipmentPreview" :key="index">
          {{ item }}
        </span>
      </div>
      <span class="badge" :class="statusClass">
        {{ statusText }}
      </span>
    </div>
    <div class="template-actions">
      <button class="btn btn-sm btn-outline-primary" @click="$emit('edit', template)">Редактировать</button>
      <button class="btn btn-sm btn-outline-danger" @click="$emit('delete', template.id)">Удалить</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  template: { 
    type: Object, 
    required: true 
  },
  equipmentList: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['edit', 'delete']);

const title = computed(() => props.template.title);
const discipline = computed(() => props.template.discipline);
const module = computed(() => props.template.module);
const hasModule = computed(() => !!props.template.module);
const isActive = computed(() => props.template.is_active);

const statusClass = computed(() => 
  isActive.value ? 'badge-success' : 'badge-secondary'
);

const statusText = computed(() => 
  isActive.value ? '✅ Активен' : '⛔ Неактивен'
);

// ✅ Получить полное название оборудования (inventory_name + инвентарный номер)
const getEquipmentFullName = (id) => {
  const eq = props.equipmentList.find(e => e.id === id);
  if (!eq) return `Оборудование #${id}`;
  return `${eq.inventory_name || eq.name} (${eq.inventory_number})`;
};

const equipmentPreview = computed(() => {
  const list = props.template.equipment_list;
  if (!list) return [];
  try {
    const items = typeof list === 'string' ? JSON.parse(list) : list;
    return items.map(item => getEquipmentFullName(item.equipment_id)).slice(0, 3);
  } catch {
    return [];
  }
});

const hasEquipmentPreview = computed(() => equipmentPreview.value.length > 0);
const previewCount = computed(() => {
  const list = props.template.equipment_list;
  if (!list) return 0;
  try {
    const items = typeof list === 'string' ? JSON.parse(list) : list;
    return items.length;
  } catch {
    return 0;
  }
});

const hasMoreEquipment = computed(() => previewCount.value > 3);
</script>

<style scoped>
.template-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  border-left: 4px solid #0d6efd;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
}

.template-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.template-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #212529;
}

.template-info .meta {
  display: flex;
  gap: 16px;
  margin: 4px 0;
  color: #6c757d;
  font-size: 14px;
  flex-wrap: wrap;
}

.equipment-preview {
  display: flex;
  gap: 6px;
  margin: 6px 0;
  flex-wrap: wrap;
}

.template-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
}

.badge-success {
  background: #d1e7dd;
  color: #0f5132;
}

.badge-secondary {
  background: #e9ecef;
  color: #41464b;
}

.btn {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-outline-primary {
  background: transparent;
  color: #0d6efd;
  border-color: #0d6efd;
}

.btn-outline-primary:hover {
  background: #0d6efd;
  color: white;
}

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border-color: #dc3545;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 13px;
}
</style>