<template>
  <tr 
    class="lesson-card-row"
    @click="handleRowClick"
  >
    <!-- КОГДА -->
    <td class="when-cell">
      <span class="when-date">{{ formatDate(lesson.date) }}</span>
      <span class="when-time">{{ lesson.start_time }}–{{ lesson.end_time }}</span>
    </td>

    <!-- ОБРАЗОВАНИЕ -->
    <td class="lesson-education">
      <template v-if="educationInfo.length > 0">
        <span 
          v-for="(line, i) in educationInfo" 
          :key="i"
          class="edu-line"
          :class="line.class"
        >
          {{ line.text }}
        </span>
      </template>
      <span v-else class="edu-empty">—</span>
    </td>

    <!-- НАЗВАНИЕ + СПЕЦИАЛЬНОСТЬ -->
    <td class="title-cell">
      <strong class="lesson-title">{{ lesson.title }}</strong>
      <span v-if="lesson.specialty" class="lesson-specialty">
        {{ shortSpecialty(lesson.specialty) }}
      </span>
    </td>

    <td class="group-cell">{{ lesson.group || '—' }}</td>

    <td class="teacher-cell">{{ lesson.teacher || '—' }}</td>

    <!-- ДАТА СОЗДАНИЯ -->
    <td class="lesson-created">
      {{ formatDate(lesson.created_at) }}
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
        <button
          v-if="lesson.status === 'Запланировано' && authStore.hasRole('admin', 'methodist', 'lab_assistant')"
          class="btn btn-sm btn-success"
          @click="$emit('complete', lesson.id)"
          title="Завершить"
        >
          <IconCheck class="btn-icon" />
        </button>

        <button
          v-if="authStore.hasRole('admin', 'methodist', 'lab_assistant')"
          class="btn btn-sm btn-outline-primary"
          @click="$emit('edit', lesson)"
          title="Редактировать"
        >
          <IconEdit class="btn-icon" />
        </button>

        <button
          v-if="authStore.hasRole('admin', 'methodist', 'lab_assistant')"
          class="btn btn-sm btn-outline-secondary"
          @click="$emit('duplicate', lesson)"
          title="Дублировать"
        >
          <IconCopy class="btn-icon" />
        </button>

        <button
          v-if="authStore.hasRole('admin', 'methodist', 'lab_assistant')"
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
import { computed } from 'vue';
import { useFormatters } from '../../composables/useFormatters';
import { useStatusClasses } from '../../composables/useStatusClasses';
import { useAuthStore } from '../../stores/auth.store';
import { getEducationLevelLabel } from '../../constants/education';
import {
  IconCheck,
  IconClock,
  IconAlert,
  IconEdit,
  IconCopy,
  IconTrash
} from '../icons';

const props = defineProps({
  lesson: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['row-click', 'complete', 'edit', 'duplicate', 'delete']);

const authStore = useAuthStore();

const { formatDate } = useFormatters();
const { getStatusClass } = useStatusClasses();

const shortFaculty = (faculty) => {
  if (!faculty) return '';
  return faculty
    .replace('Факультет последипломного образования (ФПДО)', 'ФПДО')
    .replace(' факультет', '');
};

const educationInfo = computed(() => {
  const result = [];

  if (props.lesson.participant_type) {
    result.push({
      text: getEducationLevelLabel(props.lesson.participant_type),
      class: 'edu-level'
    });
  }

  if (props.lesson.faculty) {
    result.push({
      text: shortFaculty(props.lesson.faculty),
      class: 'edu-faculty'
    });
  }

  if (props.lesson.course) {
    result.push({
      text: `${props.lesson.course} курс`,
      class: 'edu-course'
    });
  }

  return result;
});

const shortSpecialty = (specialty) => {
  if (!specialty) return '';
  return specialty.replace(/^\d+\.\d+\.\d+\s+/, '');
};

const handleRowClick = () => {
  emit('row-click', props.lesson);
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

.lesson-card-row td {
  padding: 10px 16px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
  line-height: 1.4;
  /* ✅ ПЕРЕНОС ТЕКСТА ПО СЛОВАМ */
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  hyphens: auto;
}

/* ============================================
   ДАТА СОЗДАНИЯ
   ============================================ */
.lesson-created {
  font-size: 13px;
  color: #495057;
  white-space: nowrap; /* дата короткая — не переносим */
}

/* ============================================
   ОБРАЗОВАНИЕ
   ============================================ */
.lesson-education {
  font-size: 12px;
  color: #495057;
  /* ✅ убрали max-width: 200px — колонка сама задаёт ширину */
}

.lesson-education .edu-line {
  display: block;
  /* ✅ ПЕРЕНОС строк внутри строки образования */
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
  line-height: 1.3;
  margin-bottom: 2px;
}

.edu-level { font-weight: 500; color: #0d6efd; }
.edu-faculty { color: #495057; }
.edu-course { color: #6c757d; }
.edu-empty { color: #adb5bd; font-size: 13px; }

/* ============================================
   НАЗВАНИЕ
   ============================================ */
.title-cell {
  /* ✅ ПЕРЕНОС для названия */
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.lesson-title {
  font-size: 14px;
  font-weight: 600;
  color: #212529;
  display: block;
  /* ✅ ПЕРЕНОС названия */
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.lesson-specialty {
  display: block;
  font-size: 12px;
  color: #495057;
  margin-top: 2px;
  /* ✅ ПЕРЕНОС специальности */
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

/* ============================================
   ОБЫЧНЫЕ ЯЧЕЙКИ — теперь переносятся
   ============================================ */
.group-cell,
.teacher-cell {
  color: #495057;
  /* ✅ ПЕРЕНОС вместо nowrap */
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.students-cell {
  text-align: center;
  color: #212529;
  font-weight: 500;
}

.status-cell {
  /* бейдж не переносим — он должен быть компактным */
  white-space: nowrap;
}

/* ============================================
   КОГДА (дата + время)
   ============================================ */
.when-cell {
  font-size: 13px;
  color: #495057;
  white-space: nowrap; /* дата и время — компактно */
}

.when-cell .when-date {
  display: block;
  font-weight: 500;
}

.when-cell .when-time {
  display: block;
  font-size: 12px;
  color: #6c757d;
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

.badge-success { background: #d4edda; color: #155724; }
.badge-warning { background: #fff3cd; color: #856404; }
.badge-danger  { background: #f8d7da; color: #721c24; }

/* ============================================
   ДЕЙСТВИЯ
   ============================================ */
.actions-cell {
  padding-left: 10px;
  white-space: nowrap;
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

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}
.btn-outline-secondary:hover {
  background: #6c757d;
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