<template>
  <div class="sidebar-card stats-card">
    <div class="stats-header">
      <h4>
        <IconPieChart class="h-icon" />
        Статистика участников
      </h4>
      <button 
        class="btn-refresh" 
        @click="loadStats" 
        :disabled="loading"
        title="Обновить"
      >
        <IconRefresh v-if="!loading" class="refresh-icon" />
        <IconLoading v-else class="refresh-icon spin" />
      </button>
    </div>

    <div v-if="loading" class="stats-loading">
      <IconLoading class="loading-icon spin" />
      <span>Загрузка...</span>
    </div>

    <div v-else-if="statsData" class="stats-body">
      <!-- Общие итоги -->
      <div class="stats-total">
        <div class="total-item">
          <span class="total-label">Занятий</span>
          <span class="total-value">{{ statsData.total.lessons }}</span>
        </div>
        <div class="total-item">
          <span class="total-label">Студентов</span>
          <span class="total-value">{{ statsData.total.students }}</span>
        </div>
      </div>

      <!-- По категориям -->
      <div class="stats-types">
        <div 
          v-for="(stat, type) in statsData.stats" 
          :key="type"
          class="type-row"
          :class="getTypeClass(type)"
        >
          <div class="type-info">
            <span class="type-dot" :class="getTypeClass(type)"></span>
            <span class="type-label">{{ getTypeLabel(type) }}</span>
          </div>
          <div class="type-values">
            <span class="type-count">{{ stat.total_students }}</span>
            <span class="type-percent">{{ stat.percentage }}%</span>
          </div>
        </div>
      </div>

      <!-- Прогресс-бары -->
      <div class="stats-bars">
        <div 
          v-for="(stat, type) in statsData.stats" 
          :key="type"
          class="bar-row"
        >
          <span class="bar-label">{{ getTypeShortLabel(type) }}</span>
          <div class="bar-track">
            <div 
              class="bar-fill"
              :class="getTypeClass(type)"
              :style="{ width: stat.percentage + '%' }"
            ></div>
          </div>
          <span class="bar-value">{{ stat.percentage }}%</span>
        </div>
      </div>

      <!-- Дата -->
      <div v-if="statsData.period.from || statsData.period.to" class="stats-period">
        <small>
          <IconCalendar class="period-icon" />
          {{ statsData.period.from || '...' }} — {{ statsData.period.to || '...' }}
        </small>
      </div>
    </div>

    <div v-else class="stats-empty">
      <IconInbox class="empty-icon" />
      <span>Нет данных</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { lessonsApi } from '../../api';
import {
  IconPieChart,
  IconRefresh,
  IconLoading,
  IconCalendar,
  IconInbox
} from '../icons';

const props = defineProps({
  dateFrom: { type: String, default: '' },
  dateTo: { type: String, default: '' },
  group: { type: String, default: '' }
});

const loading = ref(false);
const statsData = ref(null);

const typeLabels = {
  student: 'Студенты',
  intern: 'Интерны',
  resident: 'Ординаторы',
  doctor: 'Врачи',
  nurse: 'Медсестры',
  unspecified: 'Не указана'
};

const typeShortLabels = {
  student: 'Студ',
  intern: 'Инт',
  resident: 'Орд',
  doctor: 'Врч',
  nurse: 'Медс',
  unspecified: 'Н/У'
};

const typeColors = {
  student: '#0d6efd',
  intern: '#198754',
  resident: '#ffc107',
  doctor: '#dc3545',
  nurse: '#6f42c1',
  unspecified: '#6c757d'
};

const getTypeLabel = (type) => typeLabels[type] || type;
const getTypeShortLabel = (type) => typeShortLabels[type] || type;
const getTypeClass = (type) => `type-${type}`;

const loadStats = async () => {
  loading.value = true;
  try {
    const params = {};
    if (props.dateFrom) params.dateFrom = props.dateFrom;
    if (props.dateTo) params.dateTo = props.dateTo;
    if (props.group) params.group = props.group;

    const response = await lessonsApi.getParticipantStats(params);
    statsData.value = response;
  } catch (error) {
    console.error('Ошибка загрузки статистики:', error);
    statsData.value = null;
  } finally {
    loading.value = false;
  }
};

// Обновляем при изменении фильтров
watch(
  [() => props.dateFrom, () => props.dateTo, () => props.group],
  () => {
    loadStats();
  },
  { deep: true }
);

onMounted(() => {
  loadStats();
});

defineExpose({ loadStats });
</script>

<style scoped>
.stats-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stats-header h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stats-header h4 .h-icon {
  width: 16px;
  height: 16px;
  stroke: #212529;
}

.btn-refresh {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6c757d;
  transition: color 0.2s;
}

.btn-refresh:hover {
  color: #212529;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ============================================
   ЗАГРУЗКА
   ============================================ */
.stats-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0;
  color: #6c757d;
  font-size: 13px;
}

.loading-icon {
  width: 18px;
  height: 18px;
  stroke: #6c757d;
  animation: spin 1s linear infinite;
}

/* ============================================
   ПУСТОЕ СОСТОЯНИЕ
   ============================================ */
.stats-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  color: #6c757d;
  font-size: 13px;
}

.empty-icon {
  width: 32px;
  height: 32px;
  stroke: #6c757d;
}

/* ============================================
   ТЕЛО СТАТИСТИКИ
   ============================================ */
.stats-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Общие итоги */
.stats-total {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.total-item {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 8px 12px;
  text-align: center;
}

.total-label {
  display: block;
  font-size: 11px;
  color: #6c757d;
}

.total-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #212529;
}

/* По категориям (компактная версия) */
.stats-types {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.type-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.type-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.type-dot.type-student { background: #0d6efd; }
.type-dot.type-intern { background: #198754; }
.type-dot.type-resident { background: #ffc107; }
.type-dot.type-doctor { background: #dc3545; }
.type-dot.type-nurse { background: #6f42c1; }
.type-dot.type-unspecified { background: #6c757d; }

.type-values {
  display: flex;
  gap: 8px;
  align-items: center;
}

.type-count {
  font-weight: 600;
  color: #212529;
}

.type-percent {
  font-size: 11px;
  color: #6c757d;
}

/* Прогресс-бары */
.stats-bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.bar-label {
  width: 28px;
  color: #6c757d;
  font-weight: 500;
  flex-shrink: 0;
}

.bar-track {
  flex: 1;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.bar-fill.type-student { background: #0d6efd; }
.bar-fill.type-intern { background: #198754; }
.bar-fill.type-resident { background: #ffc107; }
.bar-fill.type-doctor { background: #dc3545; }
.bar-fill.type-nurse { background: #6f42c1; }
.bar-fill.type-unspecified { background: #6c757d; }

.bar-value {
  width: 36px;
  text-align: right;
  color: #6c757d;
  font-weight: 500;
  flex-shrink: 0;
}

/* Период */
.stats-period {
  border-top: 1px solid #e9ecef;
  padding-top: 8px;
  margin-top: 4px;
  color: #6c757d;
  font-size: 11px;
}

.period-icon {
  width: 12px;
  height: 12px;
  stroke: #6c757d;
  margin-right: 4px;
  vertical-align: middle;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 992px) {
  .stats-types {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .stats-types {
    grid-template-columns: 1fr;
  }
  
  .stats-total {
    grid-template-columns: 1fr 1fr;
  }
}
</style>