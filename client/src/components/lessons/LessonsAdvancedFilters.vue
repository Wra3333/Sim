<template>
  <div class="sidebar-card">
    <h4>
      <IconFilter class="sidebar-icon" />
      Расширенные фильтры
    </h4>

    <!-- ФАКУЛЬТЕТ -->
    <div class="filter-group sidebar-filter-group">
      <label>Факультет</label>
      <select v-model="faculty" class="form-control-sm">
        <option value="">Все факультеты</option>
        <option v-for="f in uniqueFaculties" :key="f" :value="f">
          {{ f }}
        </option>
      </select>
    </div>

    <!-- СПЕЦИАЛЬНОСТЬ -->
    <div class="filter-group sidebar-filter-group">
      <label>Специальность</label>
      <select v-model="specialty" class="form-control-sm">
        <option value="">Все специальности</option>
        <option v-for="s in uniqueSpecialties" :key="s" :value="s">
          {{ s }}
        </option>
      </select>
    </div>

    <!-- КУРС -->
    <div class="filter-group sidebar-filter-group">
      <label>Курс</label>
      <select v-model="course" class="form-control-sm">
        <option value="">Все курсы</option>
        <option v-for="c in uniqueCourses" :key="c" :value="c">
          {{ c }} курс
        </option>
      </select>
    </div>

    <!-- УРОВЕНЬ ОБРАЗОВАНИЯ -->
    <div class="filter-group sidebar-filter-group">
      <label>Уровень образования</label>
      <select v-model="level" class="form-control-sm">
        <option value="">Все уровни</option>
        <option v-for="lvl in EDUCATION_LEVELS" :key="lvl.value" :value="lvl.value">
          {{ lvl.label }}
        </option>
      </select>
    </div>

    <!-- ПРЕПОДАВАТЕЛЬ -->
    <div class="filter-group sidebar-filter-group">
      <label>Преподаватель</label>
      <select v-model="teacher" class="form-control-sm">
        <option value="">Все преподаватели</option>
        <option v-for="t in uniqueTeachers" :key="t" :value="t">
          {{ t }}
        </option>
      </select>
    </div>

    <button
      class="btn btn-outline-secondary btn-sm btn-reset"
      @click="resetFilters"
    >
      <IconReset class="btn-icon" />
      Сбросить расширенные
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useLessonsStore } from '../../stores';
import { useUiStore } from '../../stores/ui.store';
import { EDUCATION_LEVELS } from '../../constants/education';
import { IconFilter, IconReset } from '../icons';

// ============================================
//  STORE
// ============================================
const lessonsStore = useLessonsStore();
const uiStore = useUiStore();

const { items: lessonsItems } = storeToRefs(lessonsStore);
const { filters } = storeToRefs(uiStore);

// ============================================
//  ГАРАНТИРУЕМ, ЧТО filters.lessons СУЩЕСТВУЕТ
// ============================================
const f = computed(() => {
  if (!filters.value.lessons) {
    filters.value.lessons = {
      status: '',
      group: '',
      search: '',
      dateFrom: '',
      dateTo: '',
      faculty: '',
      specialty: '',
      course: '',
      participant_type: '',
      teacher: '',
      sortField: 'created_at',
      sortDirection: 'desc'
    };
  }
  return filters.value.lessons;
});

// ============================================
//  ДВУСТОРОННИЕ COMPUTED ДЛЯ v-model
// ============================================
const faculty = computed({
  get: () => f.value.faculty || '',
  set: (v) => { f.value.faculty = v; }
});

const specialty = computed({
  get: () => f.value.specialty || '',
  set: (v) => { f.value.specialty = v; }
});

const course = computed({
  get: () => f.value.course || '',
  set: (v) => { f.value.course = v; }
});

const level = computed({
  get: () => f.value.participant_type || '',
  set: (v) => { f.value.participant_type = v; }
});

const teacher = computed({
  get: () => f.value.teacher || '',
  set: (v) => { f.value.teacher = v; }
});

// ============================================
//  СПИСКИ УНИКАЛЬНЫХ ЗНАЧЕНИЙ
// ============================================
const uniqueFaculties = computed(() => {
  const values = lessonsItems.value
    .map((l) => l.faculty)
    .filter((v) => v && v.trim() !== '');
  return [...new Set(values)].sort();
});

const uniqueSpecialties = computed(() => {
  const base = f.value.faculty
    ? lessonsItems.value.filter((l) => l.faculty === f.value.faculty)
    : lessonsItems.value;

  const values = base
    .map((l) => l.specialty)
    .filter((v) => v && v.trim() !== '');
  return [...new Set(values)].sort();
});

const uniqueCourses = computed(() => {
  let base = lessonsItems.value;

  if (f.value.faculty) {
    base = base.filter((l) => l.faculty === f.value.faculty);
  }
  if (f.value.specialty) {
    base = base.filter((l) => l.specialty === f.value.specialty);
  }

  const values = base
    .map((l) => l.course)
    .filter((v) => v !== null && v !== undefined && v !== '');

  return [...new Set(values)].sort((a, b) => Number(a) - Number(b));
});

const uniqueTeachers = computed(() => {
  const values = lessonsItems.value
    .map((l) => l.teacher)
    .filter((v) => v && v.trim() !== '');
  return [...new Set(values)].sort();
});

// ============================================
//  СБРОС
// ============================================
const resetFilters = () => {
  filters.value.lessons = {
    ...f.value,
    faculty: '',
    specialty: '',
    course: '',
    participant_type: '',
    teacher: ''
  };
  uiStore.resetPage('lessons');
};
</script>

<style scoped>
.sidebar-card {
  background: white;
  border-radius: 8px;
  padding: 14px 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.sidebar-card h4 {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sidebar-card h4 .sidebar-icon {
  width: 16px;
  height: 16px;
  stroke: #212529;
}

.sidebar-filter-group {
  margin-bottom: 10px;
}

.sidebar-filter-group label {
  font-size: 12px;
  font-weight: 500;
  color: #495057;
  margin-bottom: 3px;
  display: block;
}

.sidebar-filter-group .form-control-sm {
  padding: 4px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 13px;
  width: 100%;
  background: white;
  height: 30px;
}

.sidebar-filter-group .form-control-sm:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.btn-reset {
  width: 100%;
  margin-top: 2px;
  justify-content: center;
  height: 30px;
  font-size: 12px;
  padding: 0 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #6c757d;
  border-radius: 4px;
  background: transparent;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.15s;
}

.btn:hover {
  background: #6c757d;
  color: white;
}

.btn .btn-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}
</style>