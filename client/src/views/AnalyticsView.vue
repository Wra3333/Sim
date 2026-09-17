<template>
  <div class="analytics-view">
    <div class="analytics-layout">
      <!-- ================= ЛЕВАЯ КОЛОНКА ================= -->
      <div class="analytics-main">
        <!-- TOOLBAR -->
        <div class="toolbar">
          <div class="toolbar-left">
            <h2>
              <IconAnalytics class="title-icon" />
              Аналитика оборудования
            </h2>
            <span class="count">Всего оборудования: {{ equipmentItems.length }}</span>
            <span class="count" style="margin-left: 16px; color: #0d6efd;">
              Всего занятий: {{ totalLessons }}
            </span>
            <span class="count" style="margin-left: 16px; color: #198754;">
              Записей учета: {{ workTimeStore.items.length }}
            </span>
          </div>
          <div class="toolbar-right">
            <button class="btn btn-outline-secondary btn-sm" @click="loadAllData">
              <IconRefresh class="btn-icon" />
              Обновить
            </button>
          </div>
        </div>

        <!-- БАЗОВЫЕ ФИЛЬТРЫ -->
        <div class="filters">
          <div class="filters-row">
            <div class="filter-group">
              <label>Группа</label>
              <select v-model="analyticsFilters.group" class="form-control">
                <option value="">Все группы</option>
                <option v-for="group in uniqueGroups" :key="group" :value="group">
                  {{ group }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <label>Уровни образования</label>
              <select v-model="analyticsFilters.participantType" class="form-control">
                <option value="">Все категории</option>
                <option
                  v-for="level in EDUCATION_LEVELS"
                  :key="level.value"
                  :value="level.value"
                >
                  {{ level.label }}
                </option>
              </select>
            </div>

            <div class="filter-group date-filters">
              <label>От</label>
              <input v-model="analyticsFilters.dateFrom" type="date" class="form-control" />
              <label>До</label>
              <input v-model="analyticsFilters.dateTo" type="date" class="form-control" />
            </div>

            <div class="filter-group actions">
              <button class="btn btn-outline-secondary" @click="resetFilters">
                <IconReset class="btn-icon" />
                Сбросить
              </button>
            </div>
          </div>

          <div class="filters-row equipment-row">
            <div class="filter-group equipment-filter">
              <label>Оборудование</label>
              <EquipmentMultiSelect
                :model-value="analyticsFilters.equipmentIds"
                @update:model-value="(v) => (analyticsFilters.equipmentIds = v)"
                :equipmentOptions="allEquipment"
                placeholder="Поиск по названию, инв. номеру..."
                :onlyWorking="false"
              />
            </div>
          </div>
        </div>

        <!-- СТАТИСТИКА -->
        <div v-if="!loading" class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon"><IconEquipment /></div>
            <div class="stat-info">
              <div class="stat-value">{{ filteredEquipment.length }}</div>
              <div class="stat-label">Оборудования</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><IconClock /></div>
            <div class="stat-info">
              <div class="stat-value">{{ formatHours(Number(totalHours)) }}</div>
              <div class="stat-label">Всего часов работы</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><IconStudents /></div>
            <div class="stat-info">
              <div class="stat-value">{{ totalParticipants }}</div>
              <div class="stat-label">Всего участников</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><IconLessons /></div>
            <div class="stat-info">
              <div class="stat-value">{{ totalLessons }}</div>
              <div class="stat-label">Всего занятий</div>
            </div>
          </div>
        </div>

        <!-- СКЕЛЕТОН -->
        <AnalyticsSkeleton v-if="loading" />

        <!-- ПУСТО -->
        <div v-else-if="filteredEquipment.length === 0" class="empty-state">
          <IconInbox class="empty-icon" />
          <span>Нет данных</span>
          <p class="empty-hint">Попробуйте изменить параметры фильтрации</p>
        </div>

        <!-- СПИСОК ОБОРУДОВАНИЯ -->
        <EquipmentAccordion
          v-else
          :items="paginatedEquipment"
          :expanded-ids="expandedEquipment"
          :expanded-lesson-ids="expandedLessons"
          :get-lessons="getEquipmentLessons"
          :get-total-hours="getEquipmentTotalHours"
          :get-total-participants="getEquipmentTotalParticipants"
          :get-work-time-for-lesson="getWorkTimeForLesson"
          @toggle-equipment="toggleEquipment"
          @toggle-lesson="toggleLesson"
        />

        <Pagination
          v-if="!loading && showPagination"
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :loading="loading"
        />
      </div>

      <!-- ================= ПРАВАЯ КОЛОНКА ================= -->
      <aside class="analytics-sidebar">
        <AnalyticsFilters />
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue';
import { storeToRefs } from 'pinia';
import {
  useEquipmentStore,
  useLessonsStore,
  useTemplatesStore,
  useWorkTimeStore
} from '../stores';
import { useUiStore } from '../stores/ui.store';
import { useFormatters } from '../composables/useFormatters';
import { useStatusClasses } from '../composables/useStatusClasses';
import { useToastStore } from '../stores/toastStore';
import Pagination from '../components/Pagination.vue';
import EquipmentMultiSelect from '../components/EquipmentMultiSelect.vue';
import AnalyticsFilters from '../components/analytics/AnalyticsFilters.vue';
import EquipmentAccordion from '../components/analytics/EquipmentAccordion.vue';
import AnalyticsSkeleton from '../components/analytics/AnalyticsSkeleton.vue';
import {
  IconAnalytics, IconClock, IconStudents, IconLessons,
  IconRefresh, IconReset, IconInbox, IconEquipment
} from '../components/icons';

// ⚠️ Поправь путь под свой проект, если файл лежит в другом месте
import {
  EDUCATION_LEVELS,
  getEducationLevelLabel
} from '../constants/education';

// ============================================
//  STORE
// ============================================
const uiStore = useUiStore();
const equipmentStore = useEquipmentStore();
const lessonsStore = useLessonsStore();
const templatesStore = useTemplatesStore();
const workTimeStore = useWorkTimeStore();
const toast = useToastStore();

const { items: equipmentItems, allEquipment } = storeToRefs(equipmentStore);
const { items: lessonsItems } = storeToRefs(lessonsStore);
const { filters, pagination } = storeToRefs(uiStore);

// ============================================
//  КОМПОЗАБЛЫ
// ============================================
const { formatHours } = useFormatters();

// ============================================
//  СОСТОЯНИЕ
// ============================================
const loading = ref(false);
const expandedEquipment = ref([]);
const expandedLessons = ref([]);

// ============================================
//  ФИЛЬТРЫ
// ============================================
const analyticsFilters = computed({
  get: () => filters.value.analytics || {
    group: '', participantType: '', dateFrom: '', dateTo: '',
    equipmentIds: [], faculty: '', specialty: '', course: '',
    teacher: '', sortDirection: 'desc'
  },
  set: (val) => {
    filters.value.analytics = val;
  }
});

// ============================================
//  ПАГИНАЦИЯ
// ============================================
const analyticsPagination = computed({
  get: () => pagination.value.analytics || { page: 1, size: 5 },
  set: (val) => {
    pagination.value.analytics = val;
  }
});

const currentPage = computed({
  get: () => analyticsPagination.value.page || 1,
  set: (val) => {
    analyticsPagination.value = { ...analyticsPagination.value, page: val };
  }
});

const pageSize = computed(() => analyticsPagination.value.size || 5);

// ============================================
//  ФИЛЬТРАЦИЯ
// ============================================
const getEquipmentList = (lesson) => {
  if (!lesson.equipment_list) return [];
  if (typeof lesson.equipment_list === 'string') {
    try { return JSON.parse(lesson.equipment_list); } catch { return []; }
  }
  return lesson.equipment_list || [];
};

const filteredLessons = computed(() => {
  let result = [...lessonsItems.value];
  const f = analyticsFilters.value;

  if (f.group) result = result.filter(l => l.group === f.group);
  if (f.participantType) result = result.filter(l => l.participant_type === f.participantType);
  if (f.dateFrom) result = result.filter(l => l.date >= f.dateFrom);
  if (f.dateTo) result = result.filter(l => l.date <= f.dateTo);

  if (f.faculty) result = result.filter(l => l.faculty === f.faculty);
  if (f.specialty) result = result.filter(l => l.specialty === f.specialty);
  if (f.course) result = result.filter(l => String(l.course) === String(f.course));
  if (f.teacher) result = result.filter(l => l.teacher === f.teacher);

  if (f.equipmentIds?.length > 0) {
    result = result.filter(lesson => {
      const list = getEquipmentList(lesson);
      return list.some(eq => f.equipmentIds.includes(eq.equipment_id));
    });
  }

  const dir = f.sortDirection === 'asc' ? 1 : -1;
  result.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return (da - db) * dir;
  });

  return result;
});

// ============================================
//  ОБОРУДОВАНИЕ
// ============================================
const filteredEquipmentIds = computed(() => {
  const ids = new Set();
  for (const lesson of filteredLessons.value) {
    for (const eq of getEquipmentList(lesson)) {
      ids.add(eq.equipment_id);
    }
  }
  return ids;
});

const filteredEquipment = computed(() => {
  const selected = analyticsFilters.value.equipmentIds || [];
  if (selected.length > 0) {
    return allEquipment.value.filter(eq => selected.includes(eq.id));
  }
  const ids = filteredEquipmentIds.value;
  return allEquipment.value.filter(eq => ids.has(eq.id));
});

// ============================================
//  ГРУППЫ
// ============================================
const uniqueGroups = computed(() => {
  const groups = lessonsItems.value
    .map(item => item.group)
    .filter(g => g && g.trim() !== '');
  return [...new Set(groups)].sort();
});

// ============================================
//  СТАТИСТИКА
// ============================================
const getWorkTimeForLesson = (lessonId, equipmentId) =>
  workTimeStore.items.find(wt => wt.lesson_id === lessonId && wt.equipment_id === equipmentId);

const getEquipmentLessons = (equipmentId) =>
  filteredLessons.value.filter(lesson => {
    const list = getEquipmentList(lesson);
    return list.some(eq => eq.equipment_id === equipmentId);
  });

const getEquipmentTotalHours = (equipmentId) => {
  let hours = 0;
  for (const lesson of getEquipmentLessons(equipmentId)) {
    const wt = getWorkTimeForLesson(lesson.id, equipmentId);
    if (wt) hours += Number(wt.total_hours || 0);
  }
  return hours;
};

const getEquipmentTotalParticipants = (equipmentId) => {
  let total = 0;
  for (const lesson of getEquipmentLessons(equipmentId)) {
    total += lesson.students_count || 0;
  }
  return total;
};

const totalHours = computed(() => {
  let hours = 0;
  for (const lesson of filteredLessons.value) {
    for (const eq of getEquipmentList(lesson)) {
      const wt = getWorkTimeForLesson(lesson.id, eq.equipment_id);
      if (wt) hours += Number(wt.total_hours || 0);
    }
  }
  return hours;
});

const totalParticipants = computed(() =>
  filteredLessons.value.reduce((sum, l) => sum + (l.students_count || 0), 0)
);

const totalLessons = computed(() => filteredLessons.value.length);

// ============================================
//  МЕТОДЫ
// ============================================
const toggleEquipment = (id) => {
  const i = expandedEquipment.value.indexOf(id);
  if (i === -1) expandedEquipment.value.push(id);
  else expandedEquipment.value.splice(i, 1);
};

const toggleLesson = (id) => {
  const i = expandedLessons.value.indexOf(id);
  if (i === -1) expandedLessons.value.push(id);
  else expandedLessons.value.splice(i, 1);
};

const resetFilters = () => {
  uiStore.resetFilters('analytics');
  expandedEquipment.value = [];
  expandedLessons.value = [];
};

const loadAllData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      equipmentStore.fetchAll(),
      lessonsStore.fetchAll(),
      templatesStore.fetchAll(),
      workTimeStore.fetchAll()
    ]);
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    toast.error('Ошибка загрузки данных');
  } finally {
    loading.value = false;
  }
};

// ============================================
//  ПАГИНАЦИЯ
// ============================================
const totalPages = computed(() =>
  Math.ceil(filteredEquipment.value.length / pageSize.value) || 1
);

const paginatedEquipment = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredEquipment.value.slice(start, start + pageSize.value);
});

const showPagination = computed(() =>
  filteredEquipment.value.length > pageSize.value
);

// ============================================
//  WATCH
// ============================================
watch(
  () => filters.value.analytics,
  () => {
    currentPage.value = 1;
    expandedEquipment.value = [];
    expandedLessons.value = [];
  },
  { deep: true }
);

// ============================================
//  LIFECYCLE
// ============================================
onMounted(loadAllData);
onActivated(loadAllData);
</script>

<style scoped>
.analytics-view {
  padding: 0;
  margin: 0 auto;
}

/* ============================================
   LAYOUT: ДВЕ КОЛОНКИ
   ============================================ */
.analytics-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 16px;
  align-items: start;
}

.analytics-main {
  min-width: 0;
}

.analytics-sidebar {
  position: sticky;
  top: 16px;
}

/* ============================================
   TOOLBAR
   ============================================ */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toolbar-left h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-left h2 .title-icon {
  width: 24px;
  height: 24px;
  stroke: #212529;
}

.toolbar-left .count {
  font-size: 13px;
  color: #888;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

/* ============================================
   ФИЛЬТРЫ (БАЗОВЫЕ)
   ============================================ */
.filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.filters-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.equipment-row {
  border-top: 1px solid #e9ecef;
  padding-top: 12px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.filter-group label {
  font-size: 13px;
  font-weight: 500;
  color: #495057;
  margin: 0;
}

.filter-group .form-control {
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
  background: white;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.filter-group .form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.date-filters {
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.date-filters label {
  font-size: 13px;
  color: #888;
}

.date-filters .form-control {
  min-width: 150px;
}

.equipment-filter {
  flex: 1;
  min-width: 300px;
}

.actions {
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
  padding-top: 0;
}

/* ============================================
   КНОПКИ
   ============================================ */
.btn {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 6px;
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

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border-color: #6c757d;
}

.btn-outline-secondary:hover {
  background: #6c757d;
  color: white;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 13px;
}

/* ============================================
   СТАТИСТИКА
   ============================================ */
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
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0d6efd;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 28px;
  height: 28px;
  stroke: currentColor;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 13px;
  color: #888;
}

/* ============================================
   ПУСТО
   ============================================ */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #6c757d;
}

.empty-icon {
  width: 48px;
  height: 48px;
  stroke: #6c757d;
  margin-bottom: 12px;
}

.empty-state span {
  font-size: 18px;
  display: block;
}

.empty-hint {
  margin-top: 8px;
  font-size: 14px;
  color: #adb5bd;
}

/* ============================================
   АДАПТИВ
   ============================================ */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .analytics-layout {
    grid-template-columns: 1fr;
  }

  .analytics-sidebar {
    position: static;
  }

  .equipment-filter {
    min-width: 200px;
    flex: 1 1 100%;
  }
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }

  .filters-row {
    flex-direction: column;
  }

  .filter-group {
    min-width: 100%;
    flex: 1 1 100%;
  }

  .date-filters {
    flex-wrap: wrap;
  }

  .date-filters .form-control {
    min-width: 120px;
  }

  .equipment-filter {
    min-width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .actions {
    width: 100%;
  }

  .actions .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .toolbar-right {
    width: 100%;
  }

  .toolbar-right .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>