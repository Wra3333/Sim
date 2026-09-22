<template>
  <div class="user-mobile-card">
    <div class="card-header">
      <div class="user-info">
        <span class="user-name">{{ user.name || '—' }}</span>
        <span class="user-email">{{ user.email }}</span>
        <span v-if="isSelf" class="self-badge">это вы</span>
      </div>
      <span class="badge" :class="user.is_active ? 'badge-success' : 'badge-secondary'">
        {{ user.is_active ? 'Активен' : 'Заблокирован' }}
      </span>
    </div>

    <div class="card-row">
      <span class="label">ID:</span>
      <span class="value">#{{ user.id }}</span>
    </div>

    <div class="card-row">
      <span class="label">Роль:</span>
      <span class="badge" :class="'badge-' + user.role">{{ roleLabel }}</span>
    </div>

    <div class="card-row">
      <span class="label">Последний вход:</span>
      <span v-if="user.last_login" class="value">
        {{ formatDate(user.last_login) }} {{ formatTime(user.last_login) }}
      </span>
      <span v-else class="value text-muted">Никогда</span>
    </div>

    <div class="card-actions">
      <button class="btn-icon-action" title="Редактировать" @click="$emit('edit', user)">
        <IconEdit />
      </button>

      <button class="btn-icon-action" title="Сбросить пароль" @click="$emit('reset-password', user)">
        <IconLock />
      </button>

      <button
        class="btn-icon-action"
        :class="user.is_active ? 'warn' : 'success'"
        :title="user.is_active ? 'Заблокировать' : 'Активировать'"
        :disabled="isSelf"
        @click="$emit('toggle-active', user)"
      >
        <IconClose v-if="user.is_active" />
        <IconCheck v-else />
      </button>

      <button
        class="btn-icon-action danger"
        title="Удалить"
        :disabled="isSelf"
        @click="$emit('delete', user)"
      >
        <IconTrash />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useFormatters } from '../../composables/useFormatters';
import {
  IconEdit, IconLock, IconTrash, IconCheck, IconClose
} from '../icons';

const props = defineProps({
  user: { type: Object, required: true },
  currentUserId: { type: [Number, String], default: null }
});

defineEmits(['edit', 'reset-password', 'toggle-active', 'delete']);

const { formatDate, formatTime } = useFormatters();

const isSelf = computed(() => props.user.id === props.currentUserId);

const roleLabel = computed(() => {
  const labels = {
    admin: 'Администратор',
    methodist: 'Методист',
    lab_assistant: 'Лаборант',
    technician: 'Техник'
  };
  return labels[props.user.role] || props.user.role;
});
</script>

<style scoped>
.user-mobile-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 15px;
  color: #212529;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  font-size: 12.5px;
  color: #6c757d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.self-badge {
  font-size: 10px;
  background: #cfe2ff;
  color: #084298;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  align-self: flex-start;
  margin-top: 2px;
}

.badge {
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
  white-space: nowrap;
}

.badge-admin { background: #f8d7da; color: #721c24; }
.badge-methodist { background: #cfe2ff; color: #084298; }
.badge-lab_assistant { background: #d1e7dd; color: #0f5132; }
.badge-technician { background: #fff3cd; color: #664d03; }
.badge-success { background: #d1e7dd; color: #0f5132; }
.badge-secondary { background: #e2e3e5; color: #383d41; }

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding: 4px 0;
  gap: 8px;
}

.card-row .label {
  color: #6c757d;
  flex-shrink: 0;
}

.card-row .value {
  color: #212529;
  text-align: right;
  font-size: 13px;
}

.text-muted { color: #adb5bd; }

.card-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f1f3f5;
  justify-content: flex-end;
}

.btn-icon-action {
  background: transparent;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #6c757d;
}

.btn-icon-action:hover:not(:disabled) {
  background: #f1f3f5;
  color: #212529;
}

.btn-icon-action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-icon-action.warn:hover:not(:disabled) {
  background: #fff3cd;
  color: #856404;
  border-color: #ffe69c;
}

.btn-icon-action.success:hover:not(:disabled) {
  background: #d1e7dd;
  color: #0f5132;
  border-color: #a3cfbb;
}

.btn-icon-action.danger:hover:not(:disabled) {
  background: #f8d7da;
  color: #721c24;
  border-color: #f1aeb5;
}

.btn-icon-action :deep(svg) {
  width: 18px;
  height: 18px;
  stroke: currentColor;
}
</style>