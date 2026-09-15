<template>
  <div class="sidebar-card">
    <h4>
      <IconFilter class="sidebar-icon" />
      Расширенные фильтры
      <span v-if="activeCount > 0" class="active-count">{{ activeCount }}</span>
    </h4>

    <!-- ЧИПЫ АКТИВНЫХ -->
    <div v-if="activeChips.length" class="chips">
      <button
        v-for="chip in activeChips"
        :key="chip.key"
        class="chip"
        @click="clearChip(chip.key)"
        :title="'Снять: ' + chip.label"
      >
        <span class="chip-text">{{ chip.label }}</span>
        <span class="chip-close">×</span>
      </button>
      <button class="chip chip-clear" @click="resetAdvanced">
        Очистить все
      </button>
    </div>

    <!-- ФАКУЛЬТЕТ -->
    <div class="sidebar-filter-group" :class="{ active: !!faculty }">
      <label>Факультет</label>
      <SearchSelect
        v-model="faculty"
        :options="facultyOptions"
        placeholder="Все факультеты"
        all-label="Все факультеты"
      />
    </div>

    <!-- СПЕЦИАЛЬНОСТЬ -->
    <div class="sidebar-filter-group" :class="{ active: !!specialty }">
      <label>Специальность</label>
      <SearchSelect
        v-model="specialty"
        :options="specialtyOptions"
        placeholder="Все специальности"
        all-label="Все специальности"
      />
    </div>

    <!-- КУРС -->
    <div class="sidebar-filter-group" :class="{ active: !!course }">
      <label>Курс</label>
      <SearchSelect
        v-model="course"
        :options="courseOptions"
        placeholder="Все курсы"
        all-label="Все курсы"
      />
    </div>

    <!-- ПРЕПОДАВАТЕЛЬ -->
    <div class="sidebar-filter-group" :class="{ active: !!teacher }">
      <label>Преподаватель</label>
      <SearchSelect
        v-model="teacher"
        :options="teacherOptions"
        placeholder="Все преподаватели"
        all-label="Все преподаватели"
      />
    </div>

    <!-- СОРТИРОВКА -->
    <div class="sidebar-filter-group">
      <label>Сортировка по дате</label>
      <select v-model="sortDirection" class="form-control-sm">
        <option value="desc">Сначала новые</option>
        <option value="asc">Сначала старые</option>
      </select>
    </div>

    <button
      class="btn btn-outline-secondary btn-sm btn-reset"
      @click="resetAdvanced"
      :disabled="activeCount === 0"
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
import { IconFilter, IconReset } from '../icons';
import SearchSelect from './SearchSelect.vue';

// ============================================
//  STORE
// ============================================
const lessonsStore = useLessonsStore();
const uiStore = useUiStore();

const { items: lessonsItems } = storeToRefs(lessonsStore);
const { filters } = storeToRefs(uiStore);

// ============================================
//  ГАРАНТИРУЕМ, ЧТО filters.analytics СУЩЕСТВУЕТ
// ============================================
const a = computed(() => {
  if (!filters.value.analytics) {
    filters.value.analytics = {
      equipmentIds: [],
      dateFrom: '',
      dateTo: '',
      group: '',
      participantType: '',
      faculty: '',
      specialty: '',
      course: '',
      teacher: '',
      sortDirection: 'desc'
    };
  }
  return filters.value.analytics;
});

// ============================================
//  ДВУСТОРОННИЕ COMPUTED С СБРОСОМ ЗАВИСИМЫХ
// ============================================
const faculty = computed({
  get: () => a.value.faculty || '',
  set: (v) => {
    a.value.faculty = v;
    a.value.specialty = '';
    a.value.course = '';
    a.value.teacher = '';
  }
});

const specialty = computed({
  get: () => a.value.specialty || '',
  set: (v) => {
    a.value.specialty = v;
    a.value.course = '';
    a.value.teacher = '';
  }
});

const course = computed({
  get: () => a.value.course || '',
  set: (v) => {
    a.value.course = v;
    a.value.teacher = '';
  }
});

const teacher = computed({
  get: () => a.value.teacher || '',
  set: (v) => { a.value.teacher = v; }
});

const sortDirection = computed({
  get: () => a.value.sortDirection || 'desc',
  set: (v) => { a.value.sortDirection = v; }
});

// ============================================
//  БАЗА ДЛЯ ЗАВИСИМЫХ СПИСКОВ
// ============================================
const baseForFaculties = computed(() => lessonsItems.value);

const baseForSpecialties = computed(() => {
  if (!faculty.value) return lessonsItems.value;
  return lessonsItems.value.filter((l) => l.faculty === faculty.value);
});

const baseForCourses = computed(() => {
  let base = lessonsItems.value;
  if (faculty.value) base = base.filter((l) => l.faculty === faculty.value);
  if (specialty.value) base = base.filter((l) => l.specialty === specialty.value);
  return base;
});

const baseForTeachers = computed(() => {
  let base = lessonsItems.value;
  if (faculty.value) base = base.filter((l) => l.faculty === faculty.value);
  if (specialty.value) base = base.filter((l) => l.specialty === specialty.value);
  if (course.value) base = base.filter((l) => String(l.course) === String(course.value));
  return base;
});

// ============================================
//  ПОСТРОЕНИЕ ОПЦИЙ (БЕЗ СЧЁТЧИКОВ)
// ============================================
const buildOptions = (items, field, formatter = (v) => v) => {
  const set = new Set();

  for (const item of items) {
    const raw = item[field];
    if (raw === null || raw === undefined || raw === '') continue;
    set.add(String(raw));
  }

  return [...set]
    .map((value) => ({ value, label: formatter(value) }))
    .sort((x, y) =>
      typeof x.value === 'number' && typeof y.value === 'number'
        ? Number(x.value) - Number(y.value)
        : String(x.value).localeCompare(String(y.value))
    );
};

const facultyOptions = computed(() =>
  buildOptions(baseForFaculties.value, 'faculty')
);

const specialtyOptions = computed(() =>
  buildOptions(baseForSpecialties.value, 'specialty')
);

const courseOptions = computed(() =>
  buildOptions(baseForCourses.value, 'course', (v) => `${v} курс`)
);

const teacherOptions = computed(() =>
  buildOptions(baseForTeachers.value, 'teacher')
);

// ============================================
//  ЧИПЫ
// ============================================
const activeChips = computed(() => {
  const chips = [];
  if (faculty.value) chips.push({ key: 'faculty', label: `Факультет: ${faculty.value}` });
  if (specialty.value) chips.push({ key: 'specialty', label: `Специальность: ${specialty.value}` });
  if (course.value) chips.push({ key: 'course', label: `Курс: ${course.value}` });
  if (teacher.value) chips.push({ key: 'teacher', label: `Преподаватель: ${teacher.value}` });
  return chips;
});

const activeCount = computed(() => activeChips.value.length);

const clearChip = (key) => {
  if (key === 'faculty') faculty.value = '';
  else if (key === 'specialty') specialty.value = '';
  else if (key === 'course') course.value = '';
  else if (key === 'teacher') teacher.value = '';
  uiStore.resetPage('analytics');
};

// ============================================
//  СБРОС РАСШИРЕННЫХ
// ============================================
const resetAdvanced = () => {
  a.value.faculty = '';
  a.value.specialty = '';
  a.value.course = '';
  a.value.teacher = '';
  a.value.sortDirection = 'desc';
  uiStore.resetPage('analytics');
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

.active-count {
  margin-left: auto;
  background: #0d6efd;
  color: white;
  font-size: 11px;
  border-radius: 10px;
  padding: 1px 7px;
  font-weight: 600;
}

/* ============================================
   ЧИПЫ
   ============================================ */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #e7f1ff;
  color: #0d6efd;
  border: 1px solid #b6d4fe;
  font-size: 11px;
  cursor: pointer;
  max-width: 100%;
  transition: all 0.15s;
}

.chip:hover {
  background: #cfe2ff;
}

.chip-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}

.chip-close {
  font-size: 13px;
  line-height: 1;
  opacity: 0.7;
}

.chip-clear {
  background: transparent;
  color: #6c757d;
  border-color: #ced4da;
}

.chip-clear:hover {
  background: #6c757d;
  color: white;
}

/* ============================================
   ГРУППЫ ФИЛЬТРОВ
   ============================================ */
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

.sidebar-filter-group.active label {
  color: #0d6efd;
  font-weight: 600;
}

.sidebar-filter-group.active :deep(.search-select-trigger) {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.15rem rgba(13, 110, 253, 0.15);
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

/* ============================================
   КНОПКИ
   ============================================ */
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

.btn:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn .btn-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}
</style>