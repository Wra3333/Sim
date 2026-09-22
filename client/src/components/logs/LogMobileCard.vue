<template>
  <div class="log-mobile-card" @click="$emit('open-details', log)">
    <div class="card-header">
      <span class="log-id">#{{ log.id }}</span>
      <span class="badge" :class="actionClass">{{ log.action }}</span>
    </div>

    <div class="card-row">
      <span class="label">Пользователь:</span>
      <span class="value">
        <strong>{{ log.user_name || 'Система' }}</strong>
        <span v-if="log.user_id" class="user-id">(ID: {{ log.user_id }})</span>
      </span>
    </div>

    <div class="card-row">
      <span class="label">Сущность:</span>
      <span class="badge badge-entity">{{ entityLabel }}</span>
    </div>

    <div class="card-row" v-if="log.entity_id">
      <span class="label">ID сущности:</span>
      <span class="value">{{ log.entity_id }}</span>
    </div>

    <div class="card-row">
      <span class="label">Дата:</span>
      <span class="value">
        {{ formatDate(log.created_at) }}
        <span class="time">{{ formatTime(log.created_at) }}</span>
      </span>
    </div>

    <div class="card-actions" v-if="log.details">
      <button class="btn btn-outline-info btn-sm" @click.stop="$emit('open-details', log)">
        <IconEye class="btn-icon" />
        Детали
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useFormatters } from '../../composables/useFormatters';
import { IconEye } from '../icons';

const props = defineProps({
  log: { type: Object, required: true }
});

defineEmits(['open-details']);

const { formatDate, formatTime } = useFormatters();

const actionClass = computed(() => {
  const classes = {
    login: 'badge-success',
    logout: 'badge-secondary',
    register: 'badge-primary',
    change_password: 'badge-info',
    refresh: 'badge-info',
    create: 'badge-success',
    update: 'badge-warning',
    delete: 'badge-danger',
    import: 'badge-primary',
    export: 'badge-primary',
    upload_photo: 'badge-info',
    delete_photo: 'badge-danger',
    complete: 'badge-success',
    resolve: 'badge-success',
    add_equipment: 'badge-success',
    remove_equipment: 'badge-danger',
    sync: 'badge-warning',
    error: 'badge-danger'
  };
  return classes[props.log.action] || 'badge-secondary';
});

const entityLabel = computed(() => {
  const labels = {
    auth: 'Авторизация',
    equipment: 'Оборудование',
    lessons: 'Занятия',
    templates: 'Шаблоны',
    repairs: 'Ремонты',
    worktime: 'Время работы',
    logs: 'Логи'
  };
  return labels[props.log.entity] || props.log.entity || '—';
});
</script>

<style scoped>
.log-mobile-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: background 0.15s;
}

.log-mobile-card:active {
  background: #f8f9fa;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.log-id {
  font-size: 13px;
  font-weight: 600;
  color: #888;
}

.badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
  white-space: nowrap;
}

.badge-success { background: #d4edda; color: #155724; }
.badge-danger { background: #f8d7da; color: #721c24; }
.badge-warning { background: #fff3cd; color: #856404; }
.badge-primary { background: #cce5ff; color: #004085; }
.badge-secondary { background: #e2e3e5; color: #383d41; }
.badge-info { background: #d1ecf1; color: #0c5460; }
.badge-entity { background: #e9ecef; color: #495057; }

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 4px 0;
  gap: 10px;
  font-size: 13px;
}

.card-row .label {
  color: #6c757d;
  flex-shrink: 0;
}

.card-row .value {
  color: #212529;
  text-align: right;
  word-break: break-word;
  min-width: 0;
}

.card-row .value .user-id {
  font-size: 11.5px;
  color: #888;
  margin-left: 4px;
}

.card-row .value .time {
  font-size: 12px;
  color: #888;
  margin-left: 4px;
}

.card-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f1f3f5;
  justify-content: flex-end;
}

.btn {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn .btn-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.btn-outline-info {
  background: transparent;
  color: #0dcaf0;
  border-color: #0dcaf0;
}

.btn-outline-info:hover {
  background: #0dcaf0;
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
  height: 36px;
}
</style>