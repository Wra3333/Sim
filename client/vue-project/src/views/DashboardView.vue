<script setup>
import { ref, computed, onMounted, onActivated } from 'vue';
import { storeToRefs } from 'pinia';
import { useEquipmentStore, useRepairsStore, useLessonsStore, useWorkTimeStore } from '../stores';
import { useFormatters } from '../composables/useFormatters';
import { useStatusClasses } from '../composables/useStatusClasses';
import { useToastStore } from '../stores/toastStore';

// ============================================
// ✅ STORE
// ============================================
const equipmentStore = useEquipmentStore();
const repairsStore = useRepairsStore();
const lessonsStore = useLessonsStore();
const workTimeStore = useWorkTimeStore();
const toast = useToastStore();

const { items: equipmentItems } = storeToRefs(equipmentStore);
const { items: repairsItems } = storeToRefs(repairsStore);
const { items: lessonsItems } = storeToRefs(lessonsStore);

// ============================================
// ✅ КОМПОЗАБЛЫ
// ============================================
const { formatDate, formatTime, formatDateTime, formatHours } = useFormatters();
const { getStatusClass } = useStatusClasses();

// ============================================
// ✅ СОСТОЯНИЕ
// ============================================
const loading = ref(true);

// ============================================
// ✅ ВЫЧИСЛЯЕМЫЕ
// ============================================
const stats = computed(() => ({
  equipment: equipmentItems.value.length,
  repairs: repairsItems.value.length,
  lessons: lessonsItems.value.length,
  hours: workTimeStore.totalHours
}));

const activeRepairs = computed(() => {
  return repairsItems.value
    .filter(repair => !repair.is_resolved)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);
});

const resolvedRepairs = computed(() => {
  return repairsItems.value
    .filter(repair => repair.is_resolved)
    .sort((a, b) => new Date(b.resolution_date) - new Date(a.resolution_date))
    .slice(0, 3);
});

const recentLessons = computed(() => {
  return lessonsItems.value.slice(0, 3);
});

const formattedHours = computed(() => formatHours(stats.value.hours));

// ============================================
// ✅ ЗАГРУЗКА ДАННЫХ
// ============================================
const loadData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      equipmentStore.fetchAll(),
      repairsStore.fetchAll(),
      lessonsStore.fetchAll(),
      workTimeStore.fetchReport({ start: '2024-01-01', end: '2026-12-31' })
    ]);
  } catch (error) {
    console.error('❌ Error loading dashboard:', error);
    toast.error(error?.response?.data?.message || "Ошибка загрузки данных:");
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);
onActivated(loadData);
</script>

<template>
  <div class="dashboard">
    <!-- СТАТИСТИКА -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🖥️</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.equipment }}</div>
          <div class="stat-label">Оборудование</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔧</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.repairs }}</div>
          <div class="stat-label">Всего заявок</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.lessons }}</div>
          <div class="stat-label">Занятия</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-info">
          <div class="stat-value">{{ formattedHours }}</div>
          <div class="stat-label">Часов работы</div>
        </div>
      </div>
    </div>

    <!-- АКТИВНЫЕ ЗАЯВКИ -->
    <div class="recent">
      <h3>⚠️ Активные заявки</h3>
      <div v-if="loading" class="text-center text-muted">Загрузка...</div>
      <div v-else-if="activeRepairs.length === 0" class="empty-state">
        ✅ Нет активных заявок
      </div>
      <div v-else class="recent-list">
        <div v-for="repair in activeRepairs" :key="repair.id" class="recent-item">
          <span class="badge badge-warning">⚠️</span>
          <span class="item-title">{{ repair.equipment?.name || 'Оборудование' }}</span>
          <span class="item-desc">{{ repair.nature_of_malfunction?.slice(0, 50) }}...</span>
          <span class="text-muted">{{ formatDateTime(repair.created_at) }}</span>
        </div>
      </div>
    </div>

    <!-- УСТРАНЁННЫЕ ЗАЯВКИ -->
    <div class="recent" style="margin-top: 20px;">
      <h3>✅ Устранённые заявки</h3>
      <div v-if="loading" class="text-center text-muted">Загрузка...</div>
      <div v-else-if="resolvedRepairs.length === 0" class="empty-state">
        Нет устранённых заявок
      </div>
      <div v-else class="recent-list">
        <div v-for="repair in resolvedRepairs" :key="repair.id" class="recent-item">
          <span class="badge badge-success">✅</span>
          <span class="item-title">{{ repair.equipment?.name || 'Оборудование' }}</span>
          <span class="item-desc">{{ repair.nature_of_malfunction?.slice(0, 50) }}...</span>
          <span class="text-muted">{{ formatDateTime(repair.resolution_date) }}</span>
        </div>
      </div>
    </div>

    <!-- ПОСЛЕДНИЕ ЗАНЯТИЯ -->
    <div class="recent" style="margin-top: 20px;">
      <h3>📚 Последние занятия</h3>
      <div v-if="loading" class="text-center text-muted">Загрузка...</div>
      <div v-else-if="recentLessons.length === 0" class="empty-state">
        Нет занятий
      </div>
      <div v-else class="recent-list">
        <div v-for="lesson in recentLessons" :key="lesson.id" class="recent-item">
          <span class="badge" :class="getStatusClass(lesson.status)">
            {{ lesson.status }}
          </span>
          <span class="item-title">{{ lesson.title }}</span>
          <span class="item-desc">{{ lesson.teacher }} | {{ lesson.group }}</span>
          <span class="text-muted">{{ formatDate(lesson.date) }}</span>
          <span class="text-muted" style="margin-left: 4px;">
            {{ formatTime(lesson.start_time) }}–{{ formatTime(lesson.end_time) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard { padding: 0; }
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}
.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.stat-icon { font-size: 32px; }
.stat-value { font-size: 28px; font-weight: 700; color: #212529; }
.stat-label { font-size: 14px; color: #6c757d; }
.recent {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.recent h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #212529;
}
.empty-state {
  padding: 20px;
  text-align: center;
  color: #6c757d;
}
.text-center { text-align: center; }
.text-muted { color: #6c757d; }
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.recent-item:last-child { border-bottom: none; }
.item-title {
  font-weight: 500;
  min-width: 150px;
  color: #212529;
}
.item-desc {
  color: #6c757d;
  font-size: 14px;
  flex: 1;
}
.text-muted {
  margin-left: auto;
  font-size: 13px;
  color: #6c757d;
  white-space: nowrap;
}
.badge {
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
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
.badge-secondary {
  background: #e9ecef;
  color: #495057;
}
</style>