<template>
  <div class="analytics-view">
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

    <!-- ФИЛЬТРЫ -->
    <div class="filters">
      <!-- Первая строка фильтров -->
      <div class="filters-row">
        <div class="filter-group">
          <label>Группа</label>
          <select v-model="filterGroup" class="form-control" @change="applyFilters">
            <option value="">Все группы</option>
            <option v-for="group in uniqueGroups" :key="group" :value="group">
              {{ group }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>Категория участников</label>
          <select v-model="filterParticipantType" class="form-control" @change="applyFilters">
            <option value="">Все категории</option>
            <option value="student">Студенты</option>
            <option value="intern">Интерны</option>
            <option value="resident">Ординаторы</option>
            <option value="doctor">Врачи</option>
            <option value="nurse">Медсестры</option>
          </select>
        </div>

        <div class="filter-group date-filters">
          <label>От</label>
          <input 
            v-model="filterDateFrom" 
            type="date" 
            class="form-control" 
            @change="applyFilters"
          />
          <label>До</label>
          <input 
            v-model="filterDateTo" 
            type="date" 
            class="form-control" 
            @change="applyFilters"
          />
        </div>

        <div class="filter-group actions">
          <button class="btn btn-outline-secondary" @click="resetFilters">
            <IconReset class="btn-icon" />
            Сбросить
          </button>
        </div>
      </div>

      <!-- Вторая строка - поиск по оборудованию -->
      <div class="filters-row equipment-row">
        <div class="filter-group equipment-filter">
          <label>Оборудование</label>
          <!-- ✅ equipmentOptions="allEquipment" — теперь видно и неисправные -->
          <EquipmentMultiSelect
            v-model="selectedEquipmentIds"
            :equipmentOptions="allEquipment"
            placeholder="Поиск по названию, инв. номеру..."
            :onlyWorking="false"
          />
        </div>
      </div>
    </div>

    <!-- ОБЩАЯ СТАТИСТИКА -->
    <div class="stats-grid">
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

    <!-- ЗАГРУЗКА -->
    <div v-if="loading" class="loading-state">
      <IconLoading class="loading-icon spin" />
      <span>Загрузка...</span>
    </div>

    <!-- ПУСТОЕ СОСТОЯНИЕ -->
    <div v-else-if="filteredEquipment.length === 0" class="empty-state">
      <IconInbox class="empty-icon" />
      <span>Нет данных</span>
      <p class="empty-hint">Попробуйте изменить параметры фильтрации</p>
    </div>

    <!-- СПИСОК ОБОРУДОВАНИЯ С ГРУППИРОВКОЙ -->
    <div v-else class="equipment-accordion">
      <div 
        v-for="equipment in paginatedEquipment" 
        :key="equipment.id"
        class="equipment-group"
        :class="{ expanded: expandedEquipment.includes(equipment.id) }"
      >
        <!-- Заголовок оборудования -->
        <div class="equipment-header" @click="toggleEquipment(equipment.id)">
          <div class="equipment-info">
            <div class="equipment-main">
              <span class="equipment-id">#{{ equipment.id }}</span>
              <h3 class="equipment-title">{{ equipment.name }}</h3>
              <span class="equipment-status" :class="getEquipmentStatusClass(equipment.working_status)">
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
                <strong>{{ formatHours(Number(getEquipmentTotalHours(equipment.id))) }}</strong>
              </span>
              <span class="meta-item">
                <IconStudents class="meta-icon" />
                {{ getEquipmentTotalParticipants(equipment.id) }} участников
              </span>
              <span class="meta-item">
                <IconLessons class="meta-icon" />
                {{ getEquipmentLessonsCount(equipment.id) }} занятий
              </span>
            </div>
          </div>
          <div class="equipment-toggle">
            <span class="toggle-icon" :class="{ rotated: expandedEquipment.includes(equipment.id) }">
              <IconChevronDown />
            </span>
          </div>
        </div>

        <!-- Детали оборудования -->
        <div v-if="expandedEquipment.includes(equipment.id)" class="equipment-details">
          <!-- Информация -->
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
                <span class="info-value"><strong>{{ formatHours(Number(getEquipmentTotalHours(equipment.id))) }}</strong></span>
              </div>
            </div>
          </div>

          <!-- Список занятий -->
          <div class="detail-section">
            <div class="detail-label">
              <IconLessons class="detail-icon" />
              Занятия с этим оборудованием
              <span class="lessons-count">({{ getEquipmentLessonsCount(equipment.id) }})</span>
            </div>
            
            <div v-if="getEquipmentLessonsCount(equipment.id) === 0" class="no-data">
              Нет занятий по выбранным фильтрам
            </div>
            
            <div 
              v-for="lesson in getEquipmentLessons(equipment.id)" 
              :key="lesson.id"
              class="lesson-item"
              :class="{ 'lesson-expanded': expandedLessons.includes(lesson.id) }"
            >
              <!-- Заголовок занятия -->
              <div class="lesson-header" @click.stop="toggleLesson(lesson.id)">
                <div class="lesson-info">
                  <span class="lesson-id">#{{ lesson.id }}</span>
                  <span class="lesson-title">{{ lesson.title }}</span>
                  <span class="lesson-status" :class="getStatusClass(lesson.status)">
                    {{ lesson.status }}
                  </span>
                  <span class="lesson-category" :class="getCategoryClass(lesson.participant_type)">
                    {{ getCategoryLabel(lesson.participant_type) }}
                  </span>
                  <span class="lesson-date">
                    <IconCalendar class="date-icon" />
                    {{ formatDate(lesson.date) }}
                  </span>
                </div>
                <div class="lesson-right">
                  <span class="lesson-hours">
                    <IconClock class="small-icon" />
                    {{ getLessonHoursForEquipment(lesson.id, equipment.id) }}
                  </span>
                  <span class="lesson-chevron" :class="{ rotated: expandedLessons.includes(lesson.id) }">
                    <IconChevronDown size="16" />
                  </span>
                </div>
              </div>

              <!-- Детали занятия -->
              <div v-if="expandedLessons.includes(lesson.id)" class="lesson-details">
                <div class="lesson-detail-row">
                  <span class="detail-label">Группа:</span>
                  <span class="detail-value">{{ lesson.group || '—' }}</span>
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
                
                <!-- Учет времени -->
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

    <!-- ПАГИНАЦИЯ -->
    <Pagination 
      v-if="showPagination"
      v-model:current-page="currentPage"
      :total-pages="totalPages"
      :loading="loading"
    />
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
import { useAppStore } from '../stores/appStore';
import { useFormatters } from '../composables/useFormatters';
import { useStatusClasses } from '../composables/useStatusClasses';
import { useToastStore } from '../stores/toastStore';
import Pagination from '../components/Pagination.vue';
import EquipmentMultiSelect from '../components/EquipmentMultiSelect.vue';
import {
  IconAnalytics,
  IconClock,
  IconStudents,
  IconLessons,
  IconCalendar,
  IconRefresh,
  IconReset,
  IconLoading,
  IconInbox,
  IconChevronDown,
  IconEquipment,
  IconInfo
} from '../components/icons';

// ============================================
//  STORE
// ============================================
const appStore = useAppStore();
const equipmentStore = useEquipmentStore();
const lessonsStore = useLessonsStore();
const templatesStore = useTemplatesStore();
const workTimeStore = useWorkTimeStore();
const toast = useToastStore();

// ✅ allEquipment — всё оборудование (включая архивированные/неисправные)
const { items: equipmentItems, allEquipment } = storeToRefs(equipmentStore);
const { items: lessonsItems } = storeToRefs(lessonsStore);
const { filters, pagination } = storeToRefs(appStore);

// ============================================
//  КОМПОЗАБЛЫ
// ============================================
const { formatDate, formatTime, formatHours } = useFormatters();
const { getStatusClass, getEquipmentStatusClass } = useStatusClasses();

// ============================================
//  СОСТОЯНИЕ
// ============================================
const loading = ref(false);
const expandedEquipment = ref([]);
const expandedLessons = ref([]);

// ============================================
//  ЛОКАЛЬНЫЕ ФИЛЬТРЫ
// ============================================
const filterGroup = ref('');
const filterParticipantType = ref('');
const filterDateFrom = ref('');
const filterDateTo = ref('');
const selectedEquipmentIds = ref([]);

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

const pageSize = computed({
  get: () => analyticsPagination.value.size || 5,
  set: (val) => {
    analyticsPagination.value = { ...analyticsPagination.value, size: val, page: 1 };
  }
});

// ============================================
//  ФИЛЬТРАЦИЯ ЗАНЯТИЙ
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

  // Фильтр по группе
  if (filterGroup.value) {
    result = result.filter(l => l.group === filterGroup.value);
  }

  // Фильтр по категории участников
  if (filterParticipantType.value) {
    result = result.filter(l => l.participant_type === filterParticipantType.value);
  }

  // Фильтр по дате
  if (filterDateFrom.value) {
    result = result.filter(l => l.date >= filterDateFrom.value);
  }
  if (filterDateTo.value) {
    result = result.filter(l => l.date <= filterDateTo.value);
  }

  // Фильтр по оборудованию
  if (selectedEquipmentIds.value.length > 0) {
    result = result.filter(lesson => {
      const equipmentList = getEquipmentList(lesson);
      return equipmentList.some(eq => 
        selectedEquipmentIds.value.includes(eq.equipment_id)
      );
    });
  }

  return result;
});

// ============================================
//  ОБОРУДОВАНИЕ ИЗ ОТФИЛЬТРОВАННЫХ ЗАНЯТИЙ
// ============================================
const filteredEquipmentIds = computed(() => {
  const ids = new Set();
  for (const lesson of filteredLessons.value) {
    const equipmentList = getEquipmentList(lesson);
    for (const eq of equipmentList) {
      ids.add(eq.equipment_id);
    }
  }
  return ids;
});

// ✅ Использует allEquipment — чтобы отображать и неисправные тоже
const filteredEquipment = computed(() => {
  if (selectedEquipmentIds.value.length > 0) {
    return allEquipment.value.filter(eq => 
      selectedEquipmentIds.value.includes(eq.id)
    );
  }
  
  // Иначе — всё оборудование из отфильтрованных занятий
  const ids = filteredEquipmentIds.value;
  return allEquipment.value.filter(eq => ids.has(eq.id));
});

// ============================================
//  УНИКАЛЬНЫЕ ГРУППЫ
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
const getWorkTimeForLesson = (lessonId, equipmentId) => {
  return workTimeStore.items.find(
    wt => wt.lesson_id === lessonId && wt.equipment_id === equipmentId
  );
};

const getEquipmentLessons = (equipmentId) => {
  return filteredLessons.value.filter(lesson => {
    const equipmentList = getEquipmentList(lesson);
    return equipmentList.some(eq => eq.equipment_id === equipmentId);
  });
};

const getEquipmentLessonsCount = (equipmentId) => {
  return getEquipmentLessons(equipmentId).length;
};

const getEquipmentTotalHours = (equipmentId) => {
  let hours = 0;
  const lessons = getEquipmentLessons(equipmentId);
  for (const lesson of lessons) {
    const wt = getWorkTimeForLesson(lesson.id, equipmentId);
    if (wt) {
      hours += Number(wt.total_hours || 0);
    }
  }
  return hours;
};

const getEquipmentTotalParticipants = (equipmentId) => {
  let participants = 0;
  const lessons = getEquipmentLessons(equipmentId);
  for (const lesson of lessons) {
    participants += lesson.students_count || 0;
  }
  return participants;
};

const getLessonHoursForEquipment = (lessonId, equipmentId) => {
  const wt = getWorkTimeForLesson(lessonId, equipmentId);
  if (wt) {
    return formatHours(wt.total_hours);
  }
  const lesson = lessonsItems.value.find(l => l.id === lessonId);
  if (lesson && lesson.start_time && lesson.end_time) {
    return calculateLessonHours(lesson);
  }
  return '0 ч';
};

const calculateLessonHours = (lesson) => {
  if (!lesson.start_time || !lesson.end_time) return '0 ч';
  
  const parseTime = (timeStr) => {
    const parts = timeStr.split(':').map(Number);
    return parts[0] + parts[1] / 60 + (parts[2] || 0) / 3600;
  };
  
  const startHours = parseTime(lesson.start_time);
  const endHours = parseTime(lesson.end_time);
  const hours = endHours - startHours;
  
  return hours > 0 ? formatHours(hours) : '0 ч';
};

const totalHours = computed(() => {
  let hours = 0;
  for (const lesson of filteredLessons.value) {
    const equipmentList = getEquipmentList(lesson);
    for (const eq of equipmentList) {
      const wt = getWorkTimeForLesson(lesson.id, eq.equipment_id);
      if (wt) {
        hours += Number(wt.total_hours || 0);
      }
    }
  }
  return hours;
});

const totalParticipants = computed(() => {
  return filteredLessons.value.reduce((sum, l) => sum + (l.students_count || 0), 0);
});

const totalLessons = computed(() => filteredLessons.value.length);

// ============================================
//  КАТЕГОРИИ УЧАСТНИКОВ
// ============================================
const getCategoryLabel = (type) => {
  const labels = {
    student: 'Студенты',
    intern: 'Интерны',
    resident: 'Ординаторы',
    doctor: 'Врачи',
    nurse: 'Медсестры'
  };
  return labels[type] || 'Не указана';
};

const getCategoryClass = (type) => {
  const classes = {
    student: 'category-student',
    intern: 'category-intern',
    resident: 'category-resident',
    doctor: 'category-doctor',
    nurse: 'category-nurse'
  };
  return classes[type] || 'category-unspecified';
};

// ============================================
//  МЕТОДЫ
// ============================================
const toggleEquipment = (id) => {
  const index = expandedEquipment.value.indexOf(id);
  if (index === -1) {
    expandedEquipment.value.push(id);
  } else {
    expandedEquipment.value.splice(index, 1);
  }
};

const toggleLesson = (id) => {
  const index = expandedLessons.value.indexOf(id);
  if (index === -1) {
    expandedLessons.value.push(id);
  } else {
    expandedLessons.value.splice(index, 1);
  }
};

const applyFilters = () => {
  // Сохраняем в store
  filters.value.analytics = {
    group: filterGroup.value,
    participantType: filterParticipantType.value,
    dateFrom: filterDateFrom.value,
    dateTo: filterDateTo.value,
    equipmentIds: selectedEquipmentIds.value
  };
  
  currentPage.value = 1;
  expandedEquipment.value = [];
  expandedLessons.value = [];
};

const resetFilters = () => {
  filterGroup.value = '';
  filterParticipantType.value = '';
  filterDateFrom.value = '';
  filterDateTo.value = '';
  selectedEquipmentIds.value = [];
  
  filters.value.analytics = {
    group: '',
    participantType: '',
    dateFrom: '',
    dateTo: '',
    equipmentIds: []
  };
  
  currentPage.value = 1;
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
    
    console.log('✅ Загружено занятий:', lessonsItems.value.length);
    console.log('✅ Загружено оборудования:', equipmentItems.value.length);
    console.log('✅ Загружено записей учета:', workTimeStore.items.length);
    
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
const totalPages = computed(() => {
  return Math.ceil(filteredEquipment.value.length / pageSize.value) || 1;
});

const paginatedEquipment = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredEquipment.value.slice(start, end);
});

const showPagination = computed(() => {
  return filteredEquipment.value.length > pageSize.value;
});

// ============================================
//  WATCH - восстановление фильтров из store
// ============================================
watch(() => filters.value.analytics, (val) => {
  if (val) {
    filterGroup.value = val.group || '';
    filterParticipantType.value = val.participantType || '';
    filterDateFrom.value = val.dateFrom || '';
    filterDateTo.value = val.dateTo || '';
    selectedEquipmentIds.value = val.equipmentIds || [];
  }
}, { immediate: true, deep: true });

// ============================================
//  LIFECYCLE
// ============================================
onMounted(async () => {
  await loadAllData();
});

onActivated(() => {
  loadAllData();
});
</script>

<style scoped>
.analytics-view {
  padding: 0;
  margin: 0 auto;
}

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
   ФИЛЬТРЫ
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
  min-width: 160px;
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

.btn-primary {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
}

.btn-primary:hover {
  background: #0b5ed7;
  border-color: #0a58ca;
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
   ЗАГРУЗКА / ПУСТО
   ============================================ */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: #6c757d;
}

.loading-icon {
  width: 24px;
  height: 24px;
  stroke: #6c757d;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

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
   АККОРДЕОН ОБОРУДОВАНИЯ
   ============================================ */
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

.equipment-status.badge-success { background: #d4edda; color: #155724; }
.equipment-status.badge-warning { background: #fff3cd; color: #856404; }
.equipment-status.badge-danger { background: #f8d7da; color: #721c24; }
.equipment-status.badge-secondary { background: #e9ecef; color: #495057; }

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

.info-value.badge-success { color: #155724; }
.info-value.badge-warning { color: #856404; }
.info-value.badge-danger { color: #721c24; }
.info-value.badge-secondary { color: #495057; }

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

.lesson-id {
  font-weight: 600;
  color: #0d6efd;
  font-size: 12px;
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

.lesson-status.badge-success { background: #d4edda; color: #155724; }
.lesson-status.badge-warning { background: #fff3cd; color: #856404; }
.lesson-status.badge-danger { background: #f8d7da; color: #721c24; }

.lesson-category {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.lesson-category.category-student { background: #cfe2ff; color: #084298; }
.lesson-category.category-intern { background: #d1e7dd; color: #0f5132; }
.lesson-category.category-resident { background: #fff3cd; color: #664d03; }
.lesson-category.category-doctor { background: #f8d7da; color: #842029; }
.lesson-category.category-nurse { background: #e2d9f3; color: #432874; }
.lesson-category.category-unspecified { background: #e9ecef; color: #495057; }

.lesson-date {
  font-size: 12px;
  color: #6c757d;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.date-icon {
  width: 12px;
  height: 12px;
  stroke: #6c757d;
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
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
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
  
  .equipment-main {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .lesson-info {
    flex-direction: column;
    align-items: flex-start;
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