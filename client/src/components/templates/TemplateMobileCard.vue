<template>
  <div class="template-mobile-card" @click="$emit('edit', template)">
    <div class="card-header">
      <span class="template-title">{{ template.title || 'Без названия' }}</span>
      <span class="status-badge" :class="template.is_active ? 'status-active' : 'status-inactive'">
        {{ template.is_active ? 'Активен' : 'Неактивен' }}
      </span>
    </div>

    <div class="card-row">
      <span class="label">Дисциплина:</span>
      <span class="value">{{ template.discipline || '—' }}</span>
    </div>
    <div class="card-row">
      <span class="label">Оборудование:</span>
      <span class="value">{{ equipmentCount }} поз.</span>
    </div>

    <div class="equipment-list" v-if="equipmentNames.length">
      <span v-for="(name, i) in equipmentNames.slice(0, 3)" :key="i" class="equipment-chip">
        {{ name }}
      </span>
      <span v-if="equipmentNames.length > 3" class="equipment-chip more">
        +{{ equipmentNames.length - 3 }}
      </span>
    </div>

    <div class="card-actions" @click.stop>
      <button class="btn btn-outline-secondary btn-sm" @click="$emit('edit', template)">
        <IconEdit class="btn-icon" /> Изменить
      </button>
      <button class="btn btn-outline-danger btn-sm" @click="$emit('delete', template.id)">
        <IconTrash class="btn-icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { IconEdit, IconTrash } from '../icons';

const props = defineProps({
  template: { type: Object, required: true },
  allEquipment: { type: Array, default: () => [] }
});

defineEmits(['edit', 'delete', 'row-click']);

const equipmentCount = computed(() => (props.template.equipment_list || []).length);

const equipmentNames = computed(() => {
  const list = props.template.equipment_list || [];
  return list.map((item) => {
    const eq = props.allEquipment.find((e) => e.id === item.equipment_id);
    return eq?.name || item.name || `ID ${item.equipment_id}`;
  });
});
</script>

<style scoped>
.template-mobile-card {
  background: #fff; border: 1px solid #e9ecef; border-radius: 12px;
  padding: 14px; margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); cursor: pointer;
}
.card-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 8px; margin-bottom: 10px;
}
.template-title {
  font-weight: 600; font-size: 15px; color: #212529;
  flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.status-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 10px; white-space: nowrap;
}
.status-active { background: #d1e7dd; color: #0f5132; }
.status-inactive { background: #f8d7da; color: #842029; }
.card-row {
  display: flex; justify-content: space-between; font-size: 13px;
  padding: 4px 0; gap: 8px;
}
.card-row .label { color: #6c757d; flex-shrink: 0; }
.card-row .value { color: #212529; text-align: right; }

.equipment-list {
  display: flex; flex-wrap: wrap; gap: 4px;
  margin-top: 8px; padding-top: 8px;
  border-top: 1px solid #f1f3f5;
}
.equipment-chip {
  font-size: 11px; padding: 2px 8px; border-radius: 10px;
  background: #f1f3f5; color: #495057;
  max-width: 100%; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap;
}
.equipment-chip.more { background: #e7f1ff; color: #0d6efd; }

.card-actions {
  display: flex; gap: 6px; margin-top: 10px;
  padding-top: 10px; border-top: 1px solid #f1f3f5;
}
.card-actions .btn { height: 34px; padding: 4px 10px; }
</style>