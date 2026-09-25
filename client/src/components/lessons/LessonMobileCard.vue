<template>
  <div class="lesson-mobile-card" @click="$emit('edit', lesson)">
    <div class="card-header">
      <span class="lesson-title">{{ lesson.title || 'Без названия' }}</span>
      <span class="status-badge" :class="statusClass">{{ lesson.status || '—' }}</span>
    </div>

    <div class="card-row">
      <span class="label">Группа:</span>
      <span class="value">{{ lesson.group || '—' }}</span>
    </div>
    <div class="card-row">
      <span class="label">Преподаватель:</span>
      <span class="value">{{ lesson.teacher || '—' }}</span>
    </div>
    <div class="card-row">
      <span class="label">Когда:</span>
      <span class="value">{{ formatDate(lesson.date) }}</span>
    </div>
    <div class="card-row">
      <span class="label">Студентов:</span>
      <span class="value">{{ lesson.students_count || 0 }}</span>
    </div>

    <div class="card-actions" @click.stop>
      <button
        v-if="lesson.status === 'Запланировано'"
        class="btn btn-success btn-sm"
        @click="$emit('complete', lesson.id)"
      >
        <IconCheck class="btn-icon" /> Завершить
      </button>
      <button class="btn btn-outline-secondary btn-sm" @click="$emit('edit', lesson)">
        <IconEdit class="btn-icon" /> Изменить
      </button>
      <!-- ← ДОБАВЛЕНО: кнопка дублирования -->
      <button
        class="btn btn-outline-secondary btn-sm"
        @click="$emit('duplicate', lesson)"
        title="Дублировать"
      >
        <IconCopy class="btn-icon" />
      </button>
      <button class="btn btn-outline-danger btn-sm" @click="$emit('delete', lesson.id)">
        <IconTrash class="btn-icon" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { IconCheck, IconEdit, IconCopy, IconTrash } from '../icons';

const props = defineProps({ lesson: { type: Object, required: true } });
defineEmits(['edit', 'complete', 'duplicate', 'delete']);

const statusClass = computed(() => ({
  'status-planned': props.lesson.status === 'Запланировано',
  'status-done': props.lesson.status === 'Проведено',
  'status-cancelled': props.lesson.status === 'Отменено'
}));

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};
</script>

<style scoped>
.lesson-mobile-card {
  background: #fff; border: 1px solid #e9ecef; border-radius: 12px;
  padding: 14px; margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); cursor: pointer;
}
.card-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 8px; margin-bottom: 10px;
}
.lesson-title {
  font-weight: 600; font-size: 15px; color: #212529; flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.status-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 10px; white-space: nowrap;
}
.status-planned { background: #fff3cd; color: #664d03; }
.status-done { background: #d1e7dd; color: #0f5132; }
.status-cancelled { background: #f8d7da; color: #842029; }
.card-row {
  display: flex; justify-content: space-between; font-size: 13px;
  padding: 4px 0; gap: 8px;
}
.card-row .label { color: #6c757d; flex-shrink: 0; }
.card-row .value { color: #212529; text-align: right; }
.card-actions {
  display: flex; gap: 6px; margin-top: 10px;
  padding-top: 10px; border-top: 1px solid #f1f3f5; flex-wrap: wrap;
}
.card-actions .btn { height: 34px; padding: 4px 10px; }

/* Стили для кнопки дублирования (если ещё не определены глобально) */
.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}
.btn-outline-secondary:hover {
  background: #6c757d;
  color: white;
}
</style>