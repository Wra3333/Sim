<!-- components/ProblemLessonsAlert.vue -->
<template>
  <div v-if="problemLessons.length > 0">
    <!-- БЛОК ПРОБЛЕМНЫХ ЗАНЯТИЙ -->
    <div class="alert alert-danger">
      <div class="alert-content">
        <span class="alert-icon">⚠️</span>
        <div>
          <strong>Внимание!</strong> 
          {{ problemLessons.length }} занятий запланированы с неисправным оборудованием.
          <button class="btn btn-sm btn-outline-danger" @click="showProblemLessons = !showProblemLessons">
            {{ showProblemLessons ? 'Скрыть' : 'Показать' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Список проблемных занятий -->
    <div v-if="showProblemLessons && problemLessons.length > 0" class="problem-lessons-list">
      <div 
        v-for="lesson in problemLessons" 
        :key="lesson.id"
        class="problem-lesson-item"
      >
        <div class="problem-lesson-info">
          <span class="problem-lesson-title">{{ lesson.title }}</span>
          <span class="problem-lesson-meta">
            {{ formatDate(lesson.date) }} · {{ lesson.start_time }}–{{ lesson.end_time }}
          </span>
          <span class="problem-lesson-teacher">{{ lesson.teacher }} · {{ lesson.group }}</span>
        </div>
        <div class="problem-lesson-equipment">
          <span 
            v-for="item in lesson.equipment_list" 
            :key="item.equipment_id"
            class="eq-problem-tag"
          >
            {{ getEquipmentName(item.equipment_id) }}
            <span class="eq-problem-status">❌ {{ getEquipmentStatus(item.equipment_id) }}</span>
          </span>
        </div>
        <div class="problem-lesson-actions">
          <slot name="actions" :lesson="lesson">
            <button class="btn btn-sm btn-warning" @click="onReplaceClick?.(lesson)">
              🔄 Заменить оборудование
            </button>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  lessons: {
    type: Array,
    default: () => []
  },
  equipmentList: {
    type: Array,
    default: () => []
  },
  onReplaceClick: {
    type: Function,
    default: null
  }
});

const showProblemLessons = ref(true);

const getEquipmentStatus = (id) => {
  const eq = props.equipmentList.find(e => e.id === id);
  if (!eq) return 'Неизвестно';
  if (eq.write_off_status === 'Списан') return 'Списан';
  return eq.working_status;
};

const getEquipmentName = (id) => {
  const eq = props.equipmentList.find(e => e.id === id);
  return eq ? eq.name : 'Неизвестно';
};

const isLessonProblem = (lesson) => {
  if (!lesson.equipment_list || lesson.equipment_list.length === 0) return false;
  if (lesson.status !== 'Запланировано') return false;
  
  for (const item of lesson.equipment_list) {
    const status = getEquipmentStatus(item.equipment_id);
    if (status !== 'Исправен') return true;
  }
  return false;
};

const problemLessons = computed(() => {
  return props.lessons.filter(lesson => isLessonProblem(lesson));
});

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
</script>

<style scoped>
.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.alert-danger {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-icon {
  font-size: 24px;
}

.btn {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 13px;
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

.btn-warning {
  background: #ffc107;
  color: #212529;
  border-color: #ffc107;
}

.btn-warning:hover {
  background: #e0a800;
}

.problem-lessons-list {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.problem-lesson-item {
  background: white;
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.problem-lesson-info {
  flex: 1;
  min-width: 200px;
}

.problem-lesson-title {
  font-weight: 600;
  font-size: 14px;
  display: block;
}

.problem-lesson-meta {
  font-size: 12px;
  color: #6c757d;
  margin-right: 8px;
}

.problem-lesson-teacher {
  font-size: 12px;
  color: #6c757d;
}

.problem-lesson-equipment {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.eq-problem-tag {
  background: #f8d7da;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.eq-problem-status {
  color: #dc3545;
  font-weight: 500;
}

.problem-lesson-actions {
  flex-shrink: 0;
}
</style>