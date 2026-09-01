<!-- components/ProblemEquipmentSidebar.vue -->
<template>
  <div class="problem-sidebar">
    <!-- Статистика проблем -->
    <div class="sidebar-card stats-card">
      <h4>📊 Дашборд</h4>
      <div class="stats-list">
        <div class="stat-item" @click="goToLessons">
          <span class="stat-icon">⚠️</span>
          <div class="stat-info">
            <span class="stat-value">{{ problemLessons.length }}</span>
            <span class="stat-label">Некорректных занятия</span>
          </div>
        </div>
        <div class="stat-item" @click="goToTemplates">
          <span class="stat-icon">📋</span>
          <div class="stat-info">
            <span class="stat-value">{{ problemTemplates.length }}</span>
            <span class="stat-label">Некорректных шаблонов</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Проблемное оборудование -->
    <div v-if="problemEquipment.length > 0" class="sidebar-card warning">
      <div class="card-header">
        <h4>🔧 Неисправное оборудование</h4>
        <span class="badge-count">{{ problemEquipment.length }}</span>
        <button 
          v-if="problemEquipment.length > limit"
          class="btn btn-sm toggle-btn"
          @click="toggleExpand('equipment')"
        >
          {{ expanded.equipment ? '−' : '+' }}
        </button>
      </div>
      <div class="problem-list" :class="{ expanded: expanded.equipment }">
        <div 
          v-for="eq in displayItems('equipment')" 
          :key="eq.id"
          class="problem-item"
        >
          <span class="problem-name">{{ eq.name }}</span>
          <span class="problem-status" :class="eq.working_status === 'В ремонте' ? 'status-bad' : 'status-warn'">
            {{ eq.working_status }}
          </span>
        </div>
        <div v-if="problemEquipment.length > limit" class="show-more" @click="toggleExpand('equipment')">
          {{ expanded.equipment ? 'Скрыть' : `+ ещё ${problemEquipment.length - limit}` }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  lessons: {
    type: Array,
    default: () => []
  },
  templates: {
    type: Array,
    default: () => []
  },
  equipmentList: {
    type: Array,
    default: () => []
  },
  limit: {
    type: Number,
    default: 3
  }
});

// Состояние развёрнутости
const expanded = ref({
  equipment: false
});

const toggleExpand = (key) => {
  expanded.value[key] = !expanded.value[key];
};

const displayItems = (type) => {
  const items = {
    equipment: problemEquipment.value
  };
  
  const list = items[type] || [];
  return expanded.value[type] ? list : list.slice(0, props.limit);
};

// Навигация
const goToLessons = () => {
  router.push('/lessons');
};

const goToTemplates = () => {
  router.push('/templates');
};

// ✅ Получить статус оборудования
const getEquipmentStatus = (id) => {
  const eq = props.equipmentList.find(e => e.id === id);
  if (!eq) return 'Неизвестно';
  if (eq.write_off_status === 'Списан') return 'Списан';
  return eq.working_status;
};

// ✅ Проверить, есть ли у занятия проблемное оборудование
const isLessonProblem = (lesson) => {
  if (!lesson.equipment_list || lesson.equipment_list.length === 0) return false;
  if (lesson.status !== 'Запланировано') return false;
  
  for (const item of lesson.equipment_list) {
    const status = getEquipmentStatus(item.equipment_id);
    if (status !== 'Исправен') return true;
  }
  return false;
};

// ✅ ПРОБЛЕМНЫЕ ЗАНЯТИЯ
const problemLessons = computed(() => {
  return props.lessons.filter(lesson => isLessonProblem(lesson));
});

// ⚠️ ПРОБЛЕМНОЕ ОБОРУДОВАНИЕ
const problemEquipment = computed(() => {
  return props.equipmentList.filter(e => 
    e.working_status !== 'Исправен' || 
    e.write_off_status === 'Списан'
  );
});

// 📋 ШАБЛОНЫ С ПРОБЛЕМНЫМ ОБОРУДОВАНИЕМ
const problemTemplates = computed(() => {
  const problemIds = problemEquipment.value.map(e => e.id);
  return props.templates.filter(t => {
    if (!t.equipment_list) return false;
    const eqIds = t.equipment_list.map(item => item.equipment_id);
    return eqIds.some(id => problemIds.includes(id));
  });
});
</script>

<style scoped>
.problem-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.sidebar-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.sidebar-card h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #212529;
}

.sidebar-card.stats-card {
  background: #f8f9fa;
  border-color: #dee2e6;
}

.sidebar-card.warning {
  border-color: #ffc107;
  background: #fff9e6;
}

/* Статистика - в столбик */
.stats-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.15s;
  width: 100%;
  box-sizing: border-box;
}

.stat-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #0d6efd;
}

.stat-item .stat-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 32px;
  text-align: center;
}

.stat-item .stat-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-item .stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #212529;
  line-height: 1.2;
}

.stat-item .stat-label {
  font-size: 13px;
  color: #6c757d;
}

/* Заголовок карточки с бейджем */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;
  flex-wrap: wrap;
}

.card-header h4 {
  margin: 0;
  font-size: 13px;
  flex: 1;
  min-width: 0;
}

.badge-count {
  background: #ffc107;
  color: #212529;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.toggle-btn {
  padding: 0 6px !important;
  font-size: 12px !important;
  line-height: 1.5 !important;
  background: transparent;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  color: #6c757d;
  cursor: pointer;
  flex-shrink: 0;
}

.toggle-btn:hover {
  background: #f8f9fa;
}

/* Списки проблем */
.problem-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  transition: max-height 0.3s ease;
  overflow-y: auto;
  width: 100%;
}

.problem-list.expanded {
  max-height: 600px;
}

.problem-list::-webkit-scrollbar {
  width: 3px;
}

.problem-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.problem-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.problem-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.problem-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  min-width: 0;
  overflow: hidden;
}

.problem-item:last-child {
  border-bottom: none;
}

.problem-name {
  flex: 1;
  font-weight: 500;
  color: #212529;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.problem-status {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

.problem-status.status-warn {
  background: #fff3cd;
  color: #856404;
}

.problem-status.status-bad {
  background: #f8d7da;
  color: #721c24;
}

.show-more {
  font-size: 11px;
  color: #0d6efd;
  padding: 4px 0;
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition: color 0.15s;
  font-weight: 500;
}

.show-more:hover {
  color: #0a58ca;
  text-decoration: underline;
}

.btn {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-sm {
  padding: 2px 8px;
  font-size: 12px;
}
</style>