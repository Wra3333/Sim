<template>
  <Teleport to="body">
    <div class="sync-modal-overlay" @click.self="onCancel">
      <div class="sync-modal">
        <div class="sync-modal-header">
          <h3>
            <IconTemplates class="sync-header-icon" />
            Обновить занятия?
          </h3>
          <button class="sync-btn-close" @click="onCancel">×</button>
        </div>

        <div class="sync-modal-body">
          <p class="sync-hint">
            Шаблон изменён. <strong>{{ lessons.length }}</strong>
            {{ pluralize(lessons.length, 'запланированное занятие использует', 'запланированных занятия используют', 'запланированных занятий используют') }}
            этот шаблон. Отметьте, какие обновить.
          </p>

          <p class="sync-note">
            Проведённые занятия не обновляются и здесь не показаны.
          </p>

          <div class="sync-controls">
            <div class="sync-controls-left">
              <button type="button" class="sync-btn-link" @click="selectAll">
                Выбрать все
              </button>
              <span class="sync-divider">·</span>
              <button type="button" class="sync-btn-link" @click="selectNone">
                Снять все
              </button>
            </div>
            <span class="sync-selected-count">
              Выбрано: <strong>{{ selectedIds.length }}</strong> из {{ lessons.length }}
            </span>
          </div>

          <div class="sync-lessons-list">
            <label
              v-for="lesson in lessons"
              :key="lesson.id"
              class="sync-lesson-item"
              :class="{ 'is-selected': selectedIds.includes(lesson.id) }"
            >
              <input
                type="checkbox"
                :value="lesson.id"
                v-model="selectedIds"
              />
              <div class="sync-lesson-info">
                <span class="sync-lesson-title">
                  <strong>#{{ lesson.id }}</strong> {{ lesson.title }}
                </span>
                <span class="sync-lesson-meta">
                  <span class="sync-status" :class="getStatusClass(lesson.status)">
                    {{ lesson.status }}
                  </span>
                  <span class="sync-date">{{ formatDate(lesson.date) }}</span>
                </span>
              </div>
            </label>
          </div>
        </div>

        <div class="sync-modal-footer">
          <button
            type="button"
            class="sync-btn sync-btn-outline"
            @click="onCancel"
            :disabled="syncing"
          >
            Отмена
          </button>
          <button
            type="button"
            class="sync-btn sync-btn-primary"
            @click="onConfirm"
            :disabled="syncing || selectedIds.length === 0"
          >
            <IconLoading v-if="syncing" class="btn-icon spin" />
            <IconSave v-else class="btn-icon" />
            {{ syncing ? 'Обновление...' : `Обновить (${selectedIds.length})` }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import {
  IconSave,
  IconLoading,
  IconTemplates
} from '../icons';

// ============================================
//  PROPS / EMITS
// ============================================
const props = defineProps({
  lessons: { type: Array, default: () => [] },
  syncing: { type: Boolean, default: false }
});

const emit = defineEmits(['confirm', 'cancel']);

// ============================================
//  СОСТОЯНИЕ
// ============================================
const selectedIds = ref([]);

// ============================================
//  ИНИЦИАЛИЗАЦИЯ — когда меняется список занятий
// ============================================
watch(
  () => props.lessons,
  (newLessons) => {
    // ✅ Выбираем все при получении нового списка
    selectedIds.value = Array.isArray(newLessons)
      ? newLessons.map(l => l.id)
      : [];
  },
  { immediate: true }
);

// ============================================
//  МЕТОДЫ
// ============================================
const selectAll = () => {
  selectedIds.value = props.lessons.map(l => l.id);
};

const selectNone = () => {
  selectedIds.value = [];
};

const onConfirm = () => {
  if (selectedIds.value.length === 0) return;
  emit('confirm', [...selectedIds.value]);
};

const onCancel = () => {
  emit('cancel');
};

// ============================================
//  ХЕЛПЕРЫ
// ============================================
const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getStatusClass = (status) => {
  const classes = {
    'Запланировано': 'sync-status-planned',
    'Проведено': 'sync-status-completed',
    'Отменено': 'sync-status-cancelled'
  };
  return classes[status] || '';
};

const pluralize = (n, one, few, many) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
};
</script>

<style scoped>
.sync-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.sync-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 640px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.sync-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.sync-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sync-header-icon {
  width: 20px;
  height: 20px;
  stroke: #0d6efd;
}

.sync-btn-close {
  background: none;
  border: none;
  font-size: 26px;
  line-height: 1;
  color: #6c757d;
  cursor: pointer;
  padding: 0 6px;
  border-radius: 6px;
  transition: background 0.15s;
}

.sync-btn-close:hover {
  background: #f1f3f5;
  color: #212529;
}

.sync-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.sync-hint {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #212529;
}

.sync-note {
  margin: 0 0 16px 0;
  font-size: 12px;
  color: #856404;
  background: #fff3cd;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #ffcc80;
}

.sync-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 8px;
  gap: 12px;
  flex-wrap: wrap;
}

.sync-controls-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sync-btn-link {
  background: none;
  border: none;
  color: #0d6efd;
  font-size: 13px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}

.sync-btn-link:hover {
  background: #e7f1ff;
}

.sync-divider {
  color: #ced4da;
}

.sync-selected-count {
  font-size: 13px;
  color: #6c757d;
}

.sync-selected-count strong {
  color: #0d6efd;
}

.sync-lessons-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 340px;
  overflow-y: auto;
  padding-right: 4px;
}

.sync-lessons-list::-webkit-scrollbar {
  width: 6px;
}

.sync-lessons-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.sync-lessons-list::-webkit-scrollbar-thumb {
  background: #ced4da;
  border-radius: 4px;
}

.sync-lesson-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  background: white;
}

.sync-lesson-item:hover {
  background: #f8f9fa;
  border-color: #ced4da;
}

.sync-lesson-item.is-selected {
  background: #f0f7ff;
  border-color: #0d6efd;
}

.sync-lesson-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: #0d6efd;
  cursor: pointer;
  flex-shrink: 0;
}

.sync-lesson-info {
  flex: 1;
  min-width: 0;
}

.sync-lesson-title {
  font-size: 14px;
  color: #212529;
  display: block;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sync-lesson-title strong {
  color: #0d6efd;
  margin-right: 4px;
}

.sync-lesson-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #6c757d;
}

.sync-status {
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.sync-status-planned {
  background: #fff3cd;
  color: #856404;
}

.sync-status-completed {
  background: #d4edda;
  color: #155724;
}

.sync-status-cancelled {
  background: #f8d7da;
  color: #721c24;
}

.sync-date {
  color: #6c757d;
}

.sync-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #e9ecef;
}

.sync-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.sync-btn .btn-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.sync-btn .btn-icon.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.sync-btn-outline {
  background: transparent;
  border-color: #ced4da;
  color: #6c757d;
}

.sync-btn-outline:hover:not(:disabled) {
  background: #e9ecef;
}

.sync-btn-primary {
  background: #0d6efd;
  color: white;
}

.sync-btn-primary:hover:not(:disabled) {
  background: #0b5ed7;
}

.sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .sync-modal {
    max-width: 100%;
  }

  .sync-lesson-title {
    white-space: normal;
  }
}

@media (max-width: 480px) {
  .sync-modal-footer {
    flex-direction: column;
  }

  .sync-modal-footer .sync-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>