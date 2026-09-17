<template>
  <div class="equipment-accordion">
    <div
      v-for="equipment in items"
      :key="equipment.id"
      class="equipment-group"
      :class="{ expanded: expandedIds.includes(equipment.id) }"
    >
      <div class="equipment-header" @click="$emit('toggle-equipment', equipment.id)">
        <div class="equipment-info">
          <div class="equipment-main">
            <h3 class="equipment-title">{{ equipment.name }}</h3>
            <span
              class="equipment-status"
              :class="getEquipmentStatusClass(equipment.working_status)"
            >
              {{ equipment.working_status }}
            </span>
          </div>
          <div class="equipment-meta">
            <span class="meta-item">
              <IconCalendar class="meta-icon" />
              Инв. № {{ equipment.inventory_number }}
            </span>
            <span class="meta-item">
              <IconClock class="meta-icon" />
              <strong>{{ formatHours(Number(getTotalHours(equipment.id))) }}</strong>
            </span>
            <span class="meta-item">
              <IconStudents class="meta-icon" />
              {{ getTotalParticipants(equipment.id) }} участников
            </span>
            <span class="meta-item">
              <IconLessons class="meta-icon" />
              {{ getLessons(equipment.id).length }} занятий
            </span>
          </div>
        </div>
        <div class="equipment-toggle">
          <span class="toggle-icon" :class="{ rotated: expandedIds.includes(equipment.id) }">
            <IconChevronDown />
          </span>
        </div>
      </div>

      <div v-if="expandedIds.includes(equipment.id)" class="equipment-details">
        <div class="detail-section">
          <div class="detail-label">
            <IconInfo class="detail-icon" />
            Информация
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Инвентарный номер</span>
              <span class="info-value">{{ equipment.inventory_number }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Статус</span>
              <span class="info-value" :class="getEquipmentStatusClass(equipment.working_status)">
                {{ equipment.working_status }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Производитель</span>
              <span class="info-value">{{ equipment.manufacturer || '—' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Всего часов</span>
              <span class="info-value">
                <strong>{{ formatHours(Number(getTotalHours(equipment.id))) }}</strong>
              </span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-label">
            <IconLessons class="detail-icon" />
            Занятия с этим оборудованием
            <span class="lessons-count">({{ getLessons(equipment.id).length }})</span>
          </div>

          <div v-if="getLessons(equipment.id).length === 0" class="no-data">
            Нет занятий по выбранным фильтрам
          </div>

          <div
            v-for="lesson in getLessons(equipment.id)"
            :key="lesson.id"
            class="lesson-item"
            :class="{ 'lesson-expanded': expandedLessonIds.includes(lesson.id) }"
          >
            <div class="lesson-header" @click.stop="$emit('toggle-lesson', lesson.id)">
              <div class="lesson-info">
                <span class="lesson-date lesson-date-first">
                  <IconCalendar class="date-icon" />
                  {{ formatDate(lesson.date) }}
                </span>
                <span class="lesson-title">{{ lesson.title }}</span>
                <span class="lesson-status" :class="getStatusClass(lesson.status)">
                  {{ lesson.status }}
                </span>
                <span class="lesson-category" :class="getCategoryClass(lesson.participant_type)">
                  {{ getCategoryLabel(lesson.participant_type) }}
                </span>
              </div>
              <div class="lesson-right">
                <span class="lesson-hours">
                  <IconClock class="small-icon" />
                  {{ getLessonHours(lesson, equipment.id) }}
                </span>
                <span class="lesson-chevron" :class="{ rotated: expandedLessonIds.includes(lesson.id) }">
                  <IconChevronDown size="16" />
                </span>
              </div>
            </div>

            <div v-if="expandedLessonIds.includes(lesson.id)" class="lesson-details">
              <div class="lesson-detail-row">
                <span class="detail-label">Группа:</span>
                <span class="detail-value">{{ lesson.group || '—' }}</span>
              </div>
              <div class="lesson-detail-row">
                <span class="detail-label">Факультет:</span>
                <span class="detail-value">{{ lesson.faculty || '—' }}</span>
              </div>
              <div class="lesson-detail-row">
                <span class="detail-label">Специальность:</span>
                <span class="detail-value">{{ lesson.specialty || '—' }}</span>
              </div>
              <div class="lesson-detail-row">
                <span class="detail-label">Курс:</span>
                <span class="detail-value">{{ lesson.course ? lesson.course + ' курс' : '—' }}</span>
              </div>
              <div class="lesson-detail-row">
                <span class="detail-label">Преподаватель:</span>
                <span class="detail-value">{{ lesson.teacher || '—' }}</span>
              </div>
              <div class="lesson-detail-row">
                <span class="detail-label">Дата:</span>
                <span class="detail-value">{{ formatDate(lesson.date) }}</span>
              </div>
              <div class="lesson-detail-row">
                <span class="detail-label">Время:</span>
                <span class="detail-value">{{ formatTime(lesson.start_time) }} – {{ formatTime(lesson.end_time) }}</span>
              </div>
              <div class="lesson-detail-row">
                <span class="detail-label">Студентов:</span>
                <span class="detail-value">{{ lesson.students_count || 0 }}</span>
              </div>
              <div class="lesson-detail-row">
                <span class="detail-label">Категория:</span>
                <span class="detail-value" :class="getCategoryClass(lesson.participant_type)">
                  {{ getCategoryLabel(lesson.participant_type) }}
                </span>
              </div>
              <div v-if="lesson.notes" class="lesson-detail-row">
                <span class="detail-label">Примечания:</span>
                <span class="detail-value notes-text">{{ lesson.notes }}</span>
              </div>

              <div v-if="getWorkTimeForLesson(lesson.id, equipment.id)" class="lesson-detail-row">
                <span class="detail-label">Учет времени:</span>
                <span class="detail-value">
                  {{ formatTime(getWorkTimeForLesson(lesson.id, equipment.id).start_time) }} –
                  {{ formatTime(getWorkTimeForLesson(lesson.id, equipment.id).end_time) }}
                  (<strong>{{ formatHours(getWorkTimeForLesson(lesson.id, equipment.id).total_hours) }}</strong>)
                </span>
              </div>
              <div v-else-if="lesson.start_time && lesson.end_time" class="lesson-detail-row">
                <span class="detail-label">Время занятия:</span>
                <span class="detail-value">
                  {{ formatTime(lesson.start_time) }} – {{ formatTime(lesson.end_time) }}
                  (<strong>{{ calculateLessonHours(lesson) }}</strong>)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFormatters } from '../../composables/useFormatters';
import { useStatusClasses } from '../../composables/useStatusClasses';
import {
  IconCalendar, IconClock, IconStudents, IconLessons,
  IconChevronDown, IconInfo
} from '../icons';

const props = defineProps({
  items: { type: Array, default: () => [] },
  expandedIds: { type: Array, default: () => [] },
  expandedLessonIds: { type: Array, default: () => [] },
  // (equipmentId) => Lesson[]
  getLessons: { type: Function, required: true },
  // (equipmentId) => number
  getTotalHours: { type: Function, required: true },
  // (equipmentId) => number
  getTotalParticipants: { type: Function, required: true },
  // (lessonId, equipmentId) => WorkTime | undefined
  getWorkTimeForLesson: { type: Function, required: true }
});

defineEmits(['toggle-equipment', 'toggle-lesson']);

const { formatDate, formatTime, formatHours } = useFormatters();
const { getStatusClass, getEquipmentStatusClass } = useStatusClasses();

const calculateLessonHours = (lesson) => {
  if (!lesson.start_time || !lesson.end_time) return '0 ч';
  const parseTime = (s) => {
    const parts = s.split(':').map(Number);
    return parts[0] + parts[1] / 60 + (parts[2] || 0) / 3600;
  };
  const hours = parseTime(lesson.end_time) - parseTime(lesson.start_time);
  return hours > 0 ? formatHours(hours) : '0 ч';
};

const getLessonHours = (lesson, equipmentId) => {
  const wt = props.getWorkTimeForLesson(lesson.id, equipmentId);
  if (wt) return formatHours(wt.total_hours);
  if (lesson.start_time && lesson.end_time) return calculateLessonHours(lesson);
  return '0 ч';
};

const getCategoryLabel = (type) => {
  const labels = {
    vo_specialist: 'ВО (Специалитет)',
    vo_residency: 'ВО (Ординатура)',
    dpo_pp: 'ДПО — ПП',
    dpo_pk_vo: 'ДПО — ПК (ВО)',
    dpo_pk_spo: 'ДПО — ПК (СПО)',
    do: 'ДО',
    master_class: 'Мастер-класс'
  };
  return labels[type] || 'Не указан';
};

const getCategoryClass = (type) => {
  const classes = {
    vo_specialist: 'level-vo-spec',
    vo_residency: 'level-vo-res',
    dpo_pp: 'level-dpo-pp',
    dpo_pk_vo: 'level-dpo-pk-vo',
    dpo_pk_spo: 'level-dpo-pk-spo',
    do: 'level-do',
    master_class: 'level-mk'
  };
  return classes[type] || 'level-unknown';
};
</script>

<style scoped>
.equipment-accordion {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.equipment-group {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: all 0.2s;
}

.equipment-group.expanded {
  border-color: #0d6efd;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.12);
}

.equipment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.15s;
}

.equipment-header:hover {
  background: #f8f9fa;
}

.equipment-info {
  flex: 1;
  min-width: 0;
}

.equipment-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.equipment-id {
  font-weight: 600;
  color: #0d6efd;
  font-size: 13px;
}

.equipment-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #212529;
}

.equipment-status {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 500;
}

.equipment-status.badge-success {
  background: #d4edda;
  color: #155724;
}

.equipment-status.badge-warning {
  background: #fff3cd;
  color: #856404;
}

.equipment-status.badge-danger {
  background: #f8d7da;
  color: #721c24;
}

.equipment-status.badge-secondary {
  background: #e9ecef;
  color: #495057;
}

.equipment-meta {
  display: flex;
  gap: 16px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6c757d;
}

.meta-item strong {
  color: #212529;
}

.meta-icon {
  width: 14px;
  height: 14px;
  stroke: #6c757d;
}

.equipment-toggle {
  flex-shrink: 0;
  margin-left: 12px;
}

.toggle-icon {
  display: inline-block;
  transition: transform 0.3s ease;
  color: #6c757d;
}

.toggle-icon svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

/* ============================================
   ДЕТАЛИ ОБОРУДОВАНИЯ
   ============================================ */
.equipment-details {
  padding: 16px 20px 20px;
  border-top: 1px solid #e9ecef;
  background: #fafbfc;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 13px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-icon {
  width: 16px;
  height: 16px;
  stroke: #6c757d;
}

.lessons-count {
  font-weight: 400;
  color: #6c757d;
  font-size: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  background: white;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.info-label {
  font-size: 11px;
  color: #6c757d;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #212529;
}

.info-value.badge-success {
  color: #155724;
}

.info-value.badge-warning {
  color: #856404;
}

.info-value.badge-danger {
  color: #721c24;
}

.info-value.badge-secondary {
  color: #495057;
}

/* ============================================
   ЗАНЯТИЯ
   ============================================ */
.lesson-item {
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  margin-bottom: 4px;
  overflow: hidden;
}

.lesson-item:last-child {
  margin-bottom: 0;
}

.lesson-item.lesson-expanded {
  border-color: #0d6efd;
}

.lesson-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.lesson-header:hover {
  background: #f8f9fa;
}

.lesson-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.lesson-date {
  font-size: 12px;
  color: #6c757d;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.lesson-date-first {
  font-weight: 600;
  color: #212529;
  font-size: 13px;
}

.date-icon {
  width: 12px;
  height: 12px;
  stroke: #6c757d;
}

.lesson-title {
  font-size: 14px;
  font-weight: 500;
}

.lesson-status {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.lesson-status.badge-success {
  background: #d4edda;
  color: #155724;
}

.lesson-status.badge-warning {
  background: #fff3cd;
  color: #856404;
}

.lesson-status.badge-danger {
  background: #f8d7da;
  color: #721c24;
}

.lesson-category {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.lesson-category.category-student {
  background: #cfe2ff;
  color: #084298;
}

.lesson-category.category-intern {
  background: #d1e7dd;
  color: #0f5132;
}

.lesson-category.category-resident {
  background: #fff3cd;
  color: #664d03;
}

.lesson-category.category-doctor {
  background: #f8d7da;
  color: #842029;
}

.lesson-category.category-nurse {
  background: #e2d9f3;
  color: #432874;
}

.lesson-category.category-unspecified {
  background: #e9ecef;
  color: #495057;
}

.lesson-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.lesson-hours {
  font-size: 13px;
  font-weight: 600;
  color: #0d6efd;
  display: flex;
  align-items: center;
  gap: 4px;
}

.small-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}

.lesson-chevron {
  display: inline-block;
  transition: transform 0.3s ease;
  color: #6c757d;
}

.lesson-chevron svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.lesson-chevron.rotated {
  transform: rotate(180deg);
}

.lesson-details {
  padding: 10px 12px;
  border-top: 1px solid #e9ecef;
  background: #fafbfc;
}

.lesson-detail-row {
  display: flex;
  gap: 8px;
  padding: 2px 0;
  font-size: 13px;
}

.lesson-detail-row .detail-label {
  font-weight: 500;
  color: #6c757d;
  min-width: 100px;
  flex-shrink: 0;
  margin-bottom: 0;
}

.lesson-detail-row .detail-value {
  color: #212529;
}

.notes-text {
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.no-data {
  color: #6c757d;
  font-size: 14px;
  padding: 12px;
  text-align: center;
}

/* ============================================
   АДАПТИВ
   ============================================ */
@media (max-width: 768px) {
  .equipment-header {
    flex-direction: column;
    align-items: stretch;
  }

  .equipment-toggle {
    margin-left: 0;
    margin-top: 8px;
    align-self: flex-end;
  }

  .equipment-meta {
    flex-direction: column;
    gap: 4px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .lesson-header {
    flex-direction: column;
    align-items: stretch;
  }

  .lesson-right {
    margin-top: 6px;
    justify-content: flex-start;
  }

  .lesson-detail-row {
    flex-direction: column;
    gap: 2px;
  }

  .lesson-detail-row .detail-label {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .equipment-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .lesson-info {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>