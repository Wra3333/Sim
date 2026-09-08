<template>
  <div class="template-item">
    <div class="template-info">
      <h3>
        <IconTemplates class="title-icon" />
        {{ title }}
      </h3>
      <div class="meta">
        <span>
          <IconBook class="meta-icon" />
          {{ discipline }}
        </span>
        <span v-if="hasModule">
          <IconFolder class="meta-icon" />
          {{ module }}
        </span>
      </div>
      <div class="equipment-preview" v-if="hasEquipmentPreview">
        <span class="badge badge-secondary" v-for="(item, index) in equipmentPreview" :key="index">
          <IconEquipment class="badge-icon" />
          {{ item }}
        </span>
        <span v-if="hasMoreEquipment" class="badge badge-more">
          +{{ previewCount - 3 }}
        </span>
      </div>
      <span class="badge" :class="statusClass">
        <IconCheck v-if="isActive" class="badge-icon" />
        <IconAlert v-else class="badge-icon" />
        {{ statusText }}
      </span>
    </div>
    <div class="template-actions">
      <button class="btn btn-sm btn-outline-primary" @click="$emit('edit', template)">
        <IconEdit class="btn-icon" />
        Редактировать
      </button>
      <button class="btn btn-sm btn-outline-danger" @click="$emit('delete', template.id)">
        <IconTrash class="btn-icon" />
        Удалить
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  IconTemplates,
  IconBook,
  IconFolder,
  IconEquipment,
  IconCheck,
  IconAlert,
  IconEdit,
  IconTrash
} from '../icons';

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
  isActive.value ? 'Активен' : 'Неактивен'
);

// Получить полное название оборудования
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.template-info h3 .title-icon {
  width: 18px;
  height: 18px;
  stroke: #212529;
}

.template-info .meta {
  display: flex;
  gap: 16px;
  margin: 4px 0;
  color: #6c757d;
  font-size: 14px;
  flex-wrap: wrap;
}

.template-info .meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.template-info .meta .meta-icon {
  width: 14px;
  height: 14px;
  stroke: #6c757d;
}

.equipment-preview {
  display: flex;
  gap: 6px;
  margin: 6px 0;
  flex-wrap: wrap;
}

.badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge .badge-icon {
  width: 12px;
  height: 12px;
  stroke: currentColor;
}

.badge-success {
  background: #d1e7dd;
  color: #0f5132;
}

.badge-secondary {
  background: #e9ecef;
  color: #41464b;
}

.badge-more {
  background: #e9ecef;
  color: #41464b;
  font-weight: 600;
}

.template-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.btn {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn .btn-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
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