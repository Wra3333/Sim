<template>
  <div class="dashboard">
    <!-- ========================================== -->
    <!-- СТАТИСТИКА -->
    <!-- ========================================== -->
    <div class="stats-grid">
      <div class="stat-card" @click="goTo('/equipment')">
        <div class="stat-icon"><IconEquipment /></div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.equipment }}</div>
          <div class="stat-label">Оборудование</div>
          <div class="stat-detail">
            <span class="detail-badge ok">{{ stats.equipmentOk }} исправных</span>
            <span class="detail-badge warn">{{ stats.equipmentWarn }} в ремонте</span>
          </div>
        </div>
        <IconChevronRight class="stat-arrow" />
      </div>

      <div class="stat-card" @click="goTo('/repairs')">
        <div class="stat-icon"><IconRepairs /></div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.repairs }}</div>
          <div class="stat-label">Всего заявок</div>
          <div class="stat-detail">
            <span class="detail-badge resolved">{{ stats.repairsResolved }} устранено</span>
            <span class="detail-badge active">{{ stats.repairsActive }} активных</span>
          </div>
        </div>
        <IconChevronRight class="stat-arrow" />
      </div>

      <div class="stat-card" @click="goTo('/lessons')">
        <div class="stat-icon"><IconLessons /></div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.lessons }}</div>
          <div class="stat-label">Занятия</div>
          <div class="stat-detail">
            <span class="detail-badge planned">{{ stats.lessonsPlanned }} запланировано</span>
            <span class="detail-badge completed">{{ stats.lessonsCompleted }} проведено</span>
          </div>
        </div>
        <IconChevronRight class="stat-arrow" />
      </div>

      <div class="stat-card" @click="goTo('/analytics')">
        <div class="stat-icon"><IconClock /></div>
        <div class="stat-info">
          <div class="stat-value">{{ formattedHours }}</div>
          <div class="stat-label">Часов работы</div>
          <div class="stat-detail">
            <span class="detail-badge used">{{ stats.equipmentUsed }} ед. использовалось</span>
            <span class="detail-badge students">{{ stats.totalStudents }} студентов</span>
          </div>
        </div>
        <IconChevronRight class="stat-arrow" />
      </div>
    </div>

    <!-- ========================================== -->
    <!-- ДВЕ КОЛОНКИ: ЗАЯВКИ + ЗАНЯТИЯ -->
    <!-- ========================================== -->
    <div class="two-columns">
      <!-- ЛЕВАЯ КОЛОНКА: ЗАЯВКИ -->
      <div class="column">
        <!-- АКТИВНЫЕ ЗАЯВКИ -->
        <div class="recent">
          <div class="section-header">
            <h3>
              <IconAlert class="h-icon" />
              Активные заявки
            </h3>
            <router-link to="/repairs" class="section-link">
              Все заявки →
            </router-link>
          </div>

          <div v-if="loading" class="text-center text-muted">
            <IconLoading class="loading-icon" />
            Загрузка...
          </div>

          <div v-else-if="activeRepairs.length === 0" class="empty-state">
            <IconCheck class="empty-icon" />
            <span>Нет активных заявок</span>
          </div>

          <div v-else class="recent-list">
            <div 
              v-for="repair in activeRepairs" 
              :key="repair.id" 
              class="recent-item clickable" 
              @click="goToRepair(repair.id)"
            >
              <span class="badge badge-warning">
                <IconAlert class="badge-icon" />
              </span>
              <div class="item-content">
                <span class="item-title">{{ repair.equipment?.name || 'Оборудование' }}</span>
                <span class="item-desc">{{ repair.nature_of_malfunction?.slice(0, 40) }}...</span>
                <span class="item-meta">
                  <IconUser class="meta-icon" />
                  {{ repair.detected_by }}
                  <IconCalendar class="meta-icon" />
                  {{ formatDate(repair.created_at) }}
                </span>
              </div>
              <span class="text-muted">{{ formatTime(repair.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- УСТРАНЁННЫЕ ЗАЯВКИ -->
        <div class="recent" style="margin-top: 16px;">
          <div class="section-header">
            <h3>
              <IconCheck class="h-icon" />
              Устранённые заявки
            </h3>
            <router-link to="/repairs" class="section-link">
              Все заявки →
            </router-link>
          </div>

          <div v-if="loading" class="text-center text-muted">
            <IconLoading class="loading-icon" />
            Загрузка...
          </div>

          <div v-else-if="resolvedRepairs.length === 0" class="empty-state">
            <IconList class="empty-icon" />
            <span>Нет устранённых заявок</span>
          </div>

          <div v-else class="recent-list">
            <div 
              v-for="repair in resolvedRepairs" 
              :key="repair.id" 
              class="recent-item clickable" 
              @click="goToRepair(repair.id)"
            >
              <span class="badge badge-success">
                <IconCheck class="badge-icon" />
              </span>
              <div class="item-content">
                <span class="item-title">{{ repair.equipment?.name || 'Оборудование' }}</span>
                <span class="item-desc">{{ repair.nature_of_malfunction?.slice(0, 40) }}...</span>
                <span class="item-meta">
                  <IconUser class="meta-icon" />
                  {{ repair.resolved_by || '—' }}
                  <IconCalendar class="meta-icon" />
                  {{ formatDate(repair.resolution_date) }}
                </span>
              </div>
              <span class="text-muted">{{ formatTime(repair.resolution_date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ПРАВАЯ КОЛОНКА: ЗАНЯТИЯ -->
      <div class="column">
        <div class="recent">
          <div class="section-header">
            <h3>
              <IconLessons class="h-icon" />
              Последние занятия
            </h3>
            <router-link to="/lessons" class="section-link">
              Все занятия →
            </router-link>
          </div>

          <div v-if="loading" class="text-center text-muted">
            <IconLoading class="loading-icon" />
            Загрузка...
          </div>

          <div v-else-if="recentLessons.length === 0" class="empty-state">
            <IconList class="empty-icon" />
            <span>Нет занятий</span>
          </div>

          <div v-else class="recent-list">
            <div 
              v-for="lesson in recentLessons" 
              :key="lesson.id" 
              class="recent-item clickable" 
              @click="goToLesson(lesson.id)"
            >
              <span class="badge badge-lesson" :class="getStatusClass(lesson.status)">
                {{ lesson.status }}
              </span>
              <div class="item-content">
                <span class="item-title">{{ lesson.title }}</span>
                <span class="item-desc">
                  <IconUser class="meta-icon" />
                  {{ lesson.teacher }};   
                  {{ lesson.group }}
                </span>
                <span class="item-meta">
                  <IconCalendar class="meta-icon" />
                  {{ formatDate(lesson.date) }}
                  <IconClock class="meta-icon" />
                  {{ lesson.start_time }}–{{ lesson.end_time }}
                  <span v-if="lesson.equipment_list?.length" class="equipment-count">
                    <IconEquipment class="meta-icon" />
                    {{ lesson.equipment_list.length }} ед.
                  </span>
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
import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useEquipmentStore, useRepairsStore, useLessonsStore, useWorkTimeStore } from '../stores';
import { useAppStore } from '../stores/appStore';
import { useFormatters } from '../composables/useFormatters';
import { useStatusClasses } from '../composables/useStatusClasses';
import { useToastStore } from '../stores/toastStore';
import {
  IconEquipment,
  IconRepairs,
  IconLessons,
  IconClock,
  IconAlert,
  IconCheck,
  IconLoading,
  IconList,
  IconChevronRight,
  IconUser,
  IconUsers,
  IconCalendar
} from '../components/icons';

// ============================================
// ROUTER
// ============================================
const router = useRouter();
const appStore = useAppStore();

const goTo = (path) => {
  router.push(path);
};

// ============================================
// ПЕРЕХОДЫ С ОТКРЫТИЕМ РЕДАКТИРОВАНИЯ (ИСПРАВЛЕНЫ)
// ============================================

// Переход к заявке с открытием редактирования
const goToRepair = (id) => {
  appStore.openEdit('repair', id);
  router.push({
    path: '/repairs',
    query: { repair_edit: id }  // ✅ используем прямой параметр
  });
};

// Переход к занятию с открытием редактирования
const goToLesson = (id) => {
  appStore.openEdit('lesson', id);
  router.push({
    path: '/lessons',
    query: { lesson_edit: id }  // ✅ используем прямой параметр
  });
};

// Переход к оборудованию с открытием редактирования
const goToEquipment = (id) => {
  appStore.openEdit('equipment', id);
  router.push({
    path: '/equipment',
    query: { e: id }  // ✅ используем прямой параметр
  });
};

// ============================================
// STORE
// ============================================
const equipmentStore = useEquipmentStore();
const repairsStore = useRepairsStore();
const lessonsStore = useLessonsStore();
const workTimeStore = useWorkTimeStore();
const toast = useToastStore();

const { items: equipmentItems } = storeToRefs(equipmentStore);
const { items: repairsItems } = storeToRefs(repairsStore);
const { items: lessonsItems } = storeToRefs(lessonsStore);
const { items: workTimeItems } = storeToRefs(workTimeStore);

// ============================================
// КОМПОЗАБЛЫ
// ============================================
const { formatDate, formatTime, formatHours } = useFormatters();
const { getStatusClass } = useStatusClasses();

// ============================================
// СОСТОЯНИЕ
// ============================================
const loading = ref(true);

// ============================================
// СТАТИСТИКА
// ============================================
const stats = computed(() => {
  const equipment = equipmentItems.value || [];
  const repairs = repairsItems.value || [];
  const lessons = lessonsItems.value || [];
  const workTimes = workTimeItems.value || [];

  return {
    equipment: equipment.length,
    equipmentOk: equipment.filter(e => e.working_status === 'Исправен').length,
    equipmentWarn: equipment.filter(e => e.working_status !== 'Исправен').length,

    repairs: repairs.length,
    repairsResolved: repairs.filter(r => r.is_resolved).length,
    repairsActive: repairs.filter(r => !r.is_resolved).length,

    lessons: lessons.length,
    lessonsPlanned: lessons.filter(l => l.status === 'Запланировано').length,
    lessonsCompleted: lessons.filter(l => l.status === 'Проведено').length,
    lessonsCancelled: lessons.filter(l => l.status === 'Отменено').length,

    hours: workTimeStore.totalHours || 0,
    equipmentUsed: new Set(workTimes.map(w => w.equipment_id)).size,
    totalStudents: workTimes.reduce((sum, w) => sum + (w.students_count || 0), 0)
  };
});

const activeRepairs = computed(() => {
  return repairsItems.value
    .filter(repair => !repair.is_resolved)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);
});

const resolvedRepairs = computed(() => {
  return repairsItems.value
    .filter(repair => repair.is_resolved)
    .sort((a, b) => new Date(b.resolution_date) - new Date(a.resolution_date))
    .slice(0, 5);
});

const recentLessons = computed(() => {
  return lessonsItems.value
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);
});

const formattedHours = computed(() => formatHours(stats.value.hours));

// ============================================
// ЗАГРУЗКА ДАННЫХ
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
    console.error('Error loading dashboard:', error);
    toast.error(error?.response?.data?.message || "Ошибка загрузки данных");
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);
onActivated(loadData);
</script>

<style scoped>
.dashboard { padding: 0; }

/* ==========================================
   СТАТИСТИКА
   ========================================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e8ecf1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
  cursor: pointer;
  position: relative;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(45, 125, 210, 0.10);
  border-color: #b8c8d8;
}

.stat-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a6a8a;
  flex-shrink: 0;
  background: #f0f4f8;
  border-radius: 10px;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
  stroke: currentColor;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #7a8a9a;
}

.stat-detail {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.detail-badge {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 12px;
  background: #f0f4f8;
  color: #5a6a7a;
}

.detail-badge.ok { background: #e8f0ea; color: #3a6a4a; }
.detail-badge.resolved { background: #e8f0ea; color: #3a6a4a; }
.detail-badge.warn { background: #f0ece8; color: #8a6a3a; }
.detail-badge.active { background: #f0ece8; color: #8a6a3a; }
.detail-badge.primary { background: #e8ecf8; color: #3a5a8a; }
.detail-badge.planned { background: #e8ecf8; color: #3a5a8a; }
.detail-badge.completed { background: #e8f0ea; color: #3a6a4a; }
.detail-badge.used { background: #e8ecf8; color: #3a5a8a; }
.detail-badge.students { background: #f0f0f8; color: #5a5a8a; }

.stat-arrow {
  width: 18px;
  height: 18px;
  stroke: #c0c8d0;
  flex-shrink: 0;
  opacity: 0.5;
}

.stat-card:hover .stat-arrow {
  opacity: 0.8;
  stroke: #6a8aaa;
}

/* ==========================================
   ДВЕ КОЛОНКИ
   ========================================== */
.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ==========================================
   КАРТОЧКИ
   ========================================== */
.recent {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid #e8ecf1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.recent h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recent h3 .h-icon {
  width: 18px;
  height: 18px;
  stroke: #4a6a8a;
}

.section-link {
  font-size: 13px;
  color: #4a7aaa !important;
  text-decoration: none;
  font-weight: 500;
}

.section-link:hover {
  color: #3a5a8a !important;
  text-decoration: underline;
}

/* ==========================================
   СПИСКИ
   ========================================== */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  border-bottom: 1px solid #f0f2f5;
  transition: background 0.15s;
}

.recent-item:last-child { border-bottom: none; }

.recent-item.clickable { cursor: pointer; }
.recent-item.clickable:hover { background: #f5f8fa; }

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-weight: 500;
  font-size: 14px;
  color: #1a1a1a;
  display: block;
}

.item-desc {
  font-size: 13px;
  color: #6a7a8a;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.item-meta {
  font-size: 12px;
  color: #8a9aaa;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.item-meta .meta-icon {
  width: 12px;
  height: 12px;
  stroke: #8a9aaa;
}

.equipment-count {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: #f0f4f8;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 11px;
  color: #5a6a7a;
}

.text-muted {
  font-size: 12px;
  color: #8a9aaa;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ==========================================
   БЕЙДЖИ
   ========================================== */
.badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.badge .badge-icon {
  width: 12px;
  height: 12px;
  stroke: currentColor;
}

.badge-lesson {
  min-width: 100px;
  justify-content: center;
}

.badge-success { background: #e8f0ea; color: #3a6a4a; }
.badge-warning { background: #f0ece8; color: #8a6a3a; }
.badge-danger { background: #f0e8e8; color: #8a3a3a; }
.badge-secondary { background: #f0f2f5; color: #6a7a8a; }
.badge-primary { background: #e8ecf8; color: #3a5a8a; }

/* ==========================================
   ПУСТЫЕ СОСТОЯНИЯ
   ========================================== */
.empty-state {
  padding: 16px;
  text-align: center;
  color: #6a7a8a;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.empty-state .empty-icon {
  width: 28px;
  height: 28px;
  stroke: #c0c8d0;
}

/* ==========================================
   ЗАГРУЗКА
   ========================================== */
.text-center {
  text-align: center;
  padding: 16px;
  color: #6a7a8a;
}

.loading-icon {
  width: 18px;
  height: 18px;
  stroke: #6a7a8a;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ==========================================
   АДАПТИВНОСТЬ
   ========================================== */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .two-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 14px 16px;
  }
  
  .recent {
    padding: 12px 14px;
  }
  
  .recent-item {
    flex-wrap: wrap;
  }
  
  .text-muted {
    white-space: normal;
  }
}
</style>