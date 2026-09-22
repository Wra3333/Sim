<template>
  <div class="repair-mobile-card" @click="$emit('row-click', repair)">
    <div class="card-header">
      <span class="equipment-name">{{ repair.equipment?.name || 'Оборудование' }}</span>
      <span class="status-badge" :class="repair.is_resolved ? 'status-resolved' : 'status-new'">
        {{ repair.is_resolved ? 'Устранена' : 'Новая' }}
      </span>
    </div>

    <div class="card-row">
      <span class="label">Дата:</span>
      <span class="value">{{ formatDate(repair.detection_date) }}</span>
    </div>
    <div class="card-row">
      <span class="label">Кто выявил:</span>
      <span class="value">{{ repair.detected_by || '—' }}</span>
    </div>
    <div class="card-row" v-if="repair.is_resolved">
      <span class="label">Кто устранил:</span>
      <span class="value">{{ repair.resolved_by || '—' }}</span>
    </div>

    <div class="description">{{ repair.description || '—' }}</div>

    <div class="card-actions" @click.stop>
      <button
        v-if="!repair.is_resolved"
        class="btn btn-success btn-sm"
        @click="$emit('resolve', repair)"
      >
        <IconCheck class="btn-icon" /> Устранить
      </button>
      <button
        v-else
        class="btn btn-outline-secondary btn-sm"
        @click="$emit('edit-resolved-by', repair)"
      >
        <IconEdit class="btn-icon" /> Кто устранил
      </button>
      <button v-if="!repair.is_resolved" class="btn btn-outline-secondary btn-sm" @click="$emit('edit', repair)">
        <IconEdit class="btn-icon" />
      </button>
      <button class="btn btn-outline-danger btn-sm" @click="$emit('delete', repair.id)">
        <IconTrash class="btn-icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { IconCheck, IconEdit, IconTrash } from '../icons';
defineProps({ repair: { type: Object, required: true } });
defineEmits(['row-click', 'resolve', 'edit-resolved-by', 'edit', 'delete']);

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};
</script>

<style scoped>
.repair-mobile-card {
  background: #fff; border: 1px solid #e9ecef; border-radius: 12px;
  padding: 14px; margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); cursor: pointer;
}
.card-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 8px; margin-bottom: 10px;
}
.equipment-name {
  font-weight: 600; font-size: 15px; color: #212529;
  flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.status-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 10px; white-space: nowrap;
}
.status-new { background: #fff3cd; color: #664d03; }
.status-resolved { background: #d1e7dd; color: #0f5132; }
.card-row {
  display: flex; justify-content: space-between; font-size: 13px;
  padding: 4px 0; gap: 8px;
}
.card-row .label { color: #6c757d; flex-shrink: 0; }
.card-row .value { color: #212529; text-align: right; }
.description {
  font-size: 13px; color: #495057; margin: 8px 0;
  padding: 8px 10px; background: #f8f9fa; border-radius: 6px;
  display: -webkit-box; -webkit-line-clamp: 3;
  -webkit-box-orient: vertical; overflow: hidden;
}
.card-actions {
  display: flex; gap: 6px; margin-top: 10px;
  padding-top: 10px; border-top: 1px solid #f1f3f5; flex-wrap: wrap;
}
.card-actions .btn { height: 34px; padding: 4px 10px; }
</style>