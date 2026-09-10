<template>
  <tr 
    class="lesson-card-row"
    @click="handleRowClick"
  >
    <td class="lesson-id">#{{ lesson.id }}</td>

    <td>
      <strong class="lesson-title">{{ lesson.title }}</strong>
      <span v-if="lesson.notes" class="lesson-notes">{{ lesson.notes }}</span>
    </td>

    <td class="group-cell">{{ lesson.group || '—' }}</td>

    <td class="teacher-cell">{{ lesson.teacher || '—' }}</td>

    <td class="date-cell">{{ formatDate(lesson.date) }}</td>

    <td class="time-cell">
      {{ lesson.start_time }}–{{ lesson.end_time }}
    </td>

    <td class="students-cell">
      {{ lesson.students_count || 0 }}
    </td>

    <td class="status-cell">
      <span class="badge" :class="getStatusClass(lesson.status)">
        <IconCheck v-if="lesson.status === 'Проведено'" class="badge-icon" />
        <IconClock v-else-if="lesson.status === 'Запланировано'" class="badge-icon" />
        <IconAlert v-else class="badge-icon" />
        {{ lesson.status }}
      </span>
    </td>

    <td class="actions-cell" @click.stop>
      <div class="table-actions">
        <!-- Завершить -->
        <button 
          v-if="lesson.status === 'Запланировано'" 
          class="btn btn-sm btn-success" 
          @click="$emit('complete', lesson.id)"
          title="Завершить"
        >
          <IconCheck class="btn-icon" />
        </button>

        <!-- Редактировать -->
        <button 
          class="btn btn-sm btn-outline-primary" 
          @click="$emit('edit', lesson)"
          title="Редактировать"
        >
          <IconEdit class="btn-icon" />
        </button>

        <!-- Удалить -->
        <button 
          class="btn btn-sm btn-outline-danger" 
          @click="$emit('delete', lesson.id)"
          title="Удалить"
        >
          <IconTrash class="btn-icon" />
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { useFormatters } from '../../composables/useFormatters';
import { useStatusClasses } from '../../composables/useStatusClasses';
import {
  IconCheck,
  IconClock,
  IconAlert,
  IconEdit,
  IconTrash
} from '../icons';

// ============================================
//  PROPS
// ============================================
const props = defineProps({
  lesson: {
    type: Object,
    required: true
  }
});

// ============================================
//  EMITS
// ============================================
const emit = defineEmits(['row-click', 'complete', 'edit', 'delete']);

// ============================================
//  КОМПОЗАБЛЫ
// ============================================
const { formatDate } = useFormatters();
const { getStatusClass } = useStatusClasses();

// ============================================
//  КЛИК ПО СТРОКЕ
// ============================================
const handleRowClick = () => {
  if (props.lesson.status !== 'Проведено') {
    emit('row-click', props.lesson);
  }
};
</script>

<style scoped>
/* ============================================
   СТРОКА
   ============================================ */
.lesson-card-row {
  cursor: pointer;
  transition: background 0.15s;
}

.lesson-card-row:hover {
  background: #f0f7ff;
}

/* ============================================
   ЯЧЕЙКИ
   ============================================ */
.lesson-card-row td {
  padding: 10px 16px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
  line-height: 1.4;
}

.lesson-id {
  font-weight: 600;
  color: #0d6efd;
  white-space: nowrap;
}

.lesson-title {
  font-size: 14px;
  font-weight: 600;
  color: #212529;
  display: block;
}

.lesson-notes {
  display: block;
  font-size: 12px;
  color: #6c757d;
  margin-top: 2px;
}

.group-cell,
.teacher-cell,
.date-cell,
.time-cell {
  color: #495057;
  white-space: nowrap;
}

.students-cell {
  text-align: center;
  color: #212529;
  font-weight: 500;
}

.status-cell {
  white-space: nowrap;
}

/* ============================================
   БЕЙДЖИ
   ============================================ */
.badge {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.badge .badge-icon {
  width: 12px;
  height: 12px;
  stroke: currentColor;
  flex-shrink: 0;
}

.badge-success {
  background: #d4edda;
  color: #155724;
}

.badge-warning {
  background: #fff3cd;
  color: #856404;
}

.badge-danger {
  background: #f8d7da;
  color: #721c24;
}

/* ============================================
   ДЕЙСТВИЯ
   ============================================ */
.actions-cell {
  padding-left: 10px;
}

.table-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  flex-wrap: nowrap;
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
  gap: 6px;
}

.btn .btn-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.btn-sm {
  padding: 0;
  border-radius: 5px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.table-actions .btn .btn-icon {
  width: 14px;
  height: 14px;
}

.btn-success {
  background: #198754;
  color: white;
  border-color: #198754;
}

.btn-success:hover {
  background: #157347;
  border-color: #146c43;
}

.btn-outline-primary {
  background: transparent;
  color: #0d6efd;
  border: 1px solid #0d6efd;
}

.btn-outline-primary:hover {
  background: #0d6efd;
  color: white;
}

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}
</style>