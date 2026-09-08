<template>
  <div class="lesson-item">
    <div class="lesson-info">
      <h3>
        <IconLessons class="title-icon" />
        {{ title }}
      </h3>
      <div class="meta">
        <span>
          <IconUser class="meta-icon" />
          {{ teacher }}
        </span>
        <span>
          <IconUsers class="meta-icon" />
          {{ group }}
        </span>
        <span>
          <IconCalendar class="meta-icon" />
          {{ formattedDate }}
        </span>
        <span>
          <IconClock class="meta-icon" />
          {{ startTime }} - {{ endTime }}
        </span>
      </div>
      <div class="badges">
        <span class="badge" :class="statusBadgeClass">
          <IconCheck v-if="status === 'Проведено'" class="badge-icon" />
          <IconClock v-else-if="status === 'Запланировано'" class="badge-icon" />
          <IconAlert v-else class="badge-icon" />
          {{ status }}
        </span>
        <span v-if="hasTemplate" class="badge badge-info">
          <IconTemplates class="badge-icon" />
          {{ templateName }}
        </span>
      </div>
    </div>
    <div class="lesson-actions">
      <button
        class="btn btn-sm btn-success"
        @click="$emit('complete', lesson.id)"
        v-if="isPlanned"
      >
        <IconCheck class="btn-icon" />
        Завершить
      </button>
      <button class="btn btn-sm btn-outline-primary" @click="$emit('edit', lesson)">
        <IconEdit class="btn-icon" />
        Редактировать
      </button>
      <button class="btn btn-sm btn-outline-danger" @click="$emit('delete', lesson.id)" v-if="!isCompleted">
        <IconTrash class="btn-icon" />
        Удалить
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useFormatters } from '../../composables/useFormatters';
import { useStatusClasses } from '../../composables/useStatusClasses';
import {
  IconLessons,
  IconUser,
  IconUsers,
  IconCalendar,
  IconClock,
  IconCheck,
  IconAlert,
  IconTemplates,
  IconEdit,
  IconTrash
} from '../icons';

const props = defineProps({
  lesson: { 
    type: Object, 
    required: true 
  },
  templates: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['complete', 'edit', 'delete']);

const { formatDate } = useFormatters();
const { getStatusClass } = useStatusClasses();

const title = computed(() => props.lesson?.title || 'Без названия');
const teacher = computed(() => props.lesson?.teacher || '—');
const group = computed(() => props.lesson?.group || '—');
const status = computed(() => props.lesson?.status || '—');
const startTime = computed(() => props.lesson?.start_time || '—');
const endTime = computed(() => props.lesson?.end_time || '—');
const formattedDate = computed(() => formatDate(props.lesson?.date));
const statusBadgeClass = computed(() => getStatusClass(props.lesson?.status));
const isPlanned = computed(() => props.lesson?.status === 'Запланировано');
const isCompleted = computed(() => props.lesson?.status === 'Проведено');
const hasTemplate = computed(() => !!props.lesson?.template_id);

const templateName = computed(() => {
  if (!props.lesson?.template_id) return null;
  const template = props.templates.find(t => t.id === props.lesson.template_id);
  return template ? template.title : 'Шаблон удалён';
});
</script>

<style scoped>
.lesson-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  border-left: 4px solid #0d6efd;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
  transition: all 0.2s;
}

.lesson-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.lesson-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 6px;
}

.lesson-info h3 .title-icon {
  width: 18px;
  height: 18px;
  stroke: #212529;
}

.meta {
  display: flex;
  gap: 16px;
  margin: 4px 0;
  color: #6c757d;
  font-size: 14px;
  flex-wrap: wrap;
}

.meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta .meta-icon {
  width: 14px;
  height: 14px;
  stroke: #6c757d;
}

.badges {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.lesson-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
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

.badge-warning {
  background: #fff3cd;
  color: #664d03;
}

.badge-danger {
  background: #f8d7da;
  color: #842029;
}

.badge-info {
  background: #cfe2ff;
  color: #084298;
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

.btn-success {
  background: #198754;
  color: white;
  border-color: #198754;
}

.btn-success:hover {
  background: #157347;
  border-color: #146c43;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 13px;
}
</style>