<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { workTimeApi } from '../api';
import { useEquipmentStore } from '../stores';
import { useFormatters } from '../composables/useFormatters';
import { usePagination } from '../composables/usePagination';
import { useFilters } from '../composables/useFilters';
import { useFilteredItems } from '../composables/useFilteredItems';
import { useToastStore } from '../stores/toastStore';
import Pagination from '../components/Pagination.vue';
import EquipmentMultiSelect from '../components/EquipmentMultiSelect.vue';

// ============================================
// ✅ STORE
// ============================================
const equipmentStore = useEquipmentStore();
const toast = useToastStore();
const { items: equipmentItems } = storeToRefs(equipmentStore);

// ============================================
// ✅ КОМПОЗАБЛЫ
// ============================================
const { formatDate, formatTime, formatHours } = useFormatters();

// ============================================
// ✅ СОСТОЯНИЕ
// ============================================
const workTimes = ref([]);
const loading = ref(true);

// ============================================
// ✅ ФИЛЬТРЫ
// ============================================
const { filters, resetFilters, setFilter } = useFilters({
  equipmentIds: [],
  dateFrom: '',
  dateTo: ''
});

// ============================================
// ✅ КОНФИГУРАЦИЯ ФИЛЬТРОВ
// ============================================
const filterConfig = {
  equipmentIds: {
    filterFn: (item, value) => {
      if (!value || value.length === 0) return true;
      const ids = value.map(id => Number(id));
      return ids.includes(item.equipment_id);
    }
  },
  dateFrom: {
    filterFn: (item, value) => {
      if (!value) return true;
      const from = new Date(value);
      from.setHours(0, 0, 0, 0);
      return new Date(item.start_time) >= from;
    }
  },
  dateTo: {
    filterFn: (item, value) => {
      if (!value) return true;
      const to = new Date(value);
      to.setHours(23, 59, 59, 999);
      return new Date(item.start_time) <= to;
    }
  }
};

// ============================================
// ✅ ФИЛЬТРАЦИЯ
// ============================================
const filteredWorkTimes = useFilteredItems(workTimes, filters, filterConfig);

// ============================================
// ✅ ПАГИНАЦИЯ
// ============================================
const { 
  currentPage, 
  paginatedItems, 
  totalPages, 
  showPagination,
  resetPage 
} = usePagination(filteredWorkTimes, { pageSize: 8 });

// ============================================
// ✅ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
const lessonTitle = (item) => item.lesson?.title || '—';
const studentsCount = (item) => item.students_count || 0;

// ============================================
// ✅ СТАТИСТИКА
// ============================================
const totalHours = computed(() => {
  return filteredWorkTimes.value.reduce((sum, item) => sum + Number(item.total_hours || 0), 0);
});

const totalStudents = computed(() => {
  return filteredWorkTimes.value.reduce((sum, item) => sum + Number(item.students_count || 0), 0);
});

const avgHoursPerSession = computed(() => {
  const count = filteredWorkTimes.value.length;
  return count > 0 ? totalHours.value / count : 0;
});

// ============================================
// ✅ ЗАГРУЗКА ДАННЫХ
// ============================================
const loadData = async () => {
  loading.value = true;
  try {
    const workTimeRes = await workTimeApi.getAll();
    workTimes.value = workTimeRes.data || [];
    
    if (equipmentItems.value.length === 0) {
      await equipmentStore.fetchAll();
    }
    
    resetPage();
  } catch (error) {
    console.error('❌ Ошибка загрузки:', error);
    toast.error(error?.response?.data?.message || "Ошибка загрузки данных:");
  } finally {
    loading.value = false;
  }
};

// ============================================
// ✅ СБРОС ФИЛЬТРОВ
// ============================================
const resetAllFilters = () => {
  resetFilters();
  resetPage();
};

// ============================================
// ✅ WATCH
// ============================================
watch([() => filters.value.equipmentIds, () => filters.value.dateFrom, () => filters.value.dateTo], () => {
  resetPage();
}, { deep: true });

// ============================================
// ✅ LIFECYCLE
// ============================================
onMounted(loadData);
onActivated(loadData);
</script>

<template>
  <div class="analytics-view">
    <!-- TOOLBAR -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>📊 Учет времени работы оборудования</h2>
        <span class="count">Всего записей: {{ workTimes.length }}</span>
        <span class="count" style="margin-left: 16px; color: #0d6efd;">
          Оборудования: {{ equipmentItems.length }}
        </span>
      </div>
    </div>

    <!-- ФИЛЬТРЫ -->
    <div class="filters">
      <div class="filter-group">
        <EquipmentMultiSelect
          :model-value="filters.equipmentIds"
          @update:model-value="(val) => setFilter('equipmentIds', val)"
          :equipment-options="equipmentItems"
          placeholder="Введите название или инв. номер..."
        />
      </div>

      <div class="filter-group date-filters">
        <label>От</label>
        <input 
          :value="filters.dateFrom" 
          @input="(e) => setFilter('dateFrom', e.target.value)"
          type="date" 
          class="form-control" 
        />
        <label>До</label>
        <input 
          :value="filters.dateTo" 
          @input="(e) => setFilter('dateTo', e.target.value)"
          type="date" 
          class="form-control" 
        />
      </div>

      <div class="filter-group actions">
        <button class="btn btn-outline-secondary" @click="resetAllFilters">
          Сбросить фильтры
        </button>
      </div>
    </div>

    <!-- СТАТИСТИКА -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-info">
          <div class="stat-value">{{ formatHours(totalHours) }}</div>
          <div class="stat-label">Всего часов</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <div class="stat-value">{{ filteredWorkTimes.length }}</div>
          <div class="stat-label">Кол-во сеансов</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ totalStudents }}</div>
          <div class="stat-label">Всего студентов</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-info">
          <div class="stat-value">{{ formatHours(avgHoursPerSession) }}</div>
          <div class="stat-label">Среднее за сеанс</div>
        </div>
      </div>
    </div>

    <!-- ТАБЛИЦА -->
    <div class="table-container">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Оборудование</th>
            <th>Занятие</th>
            <th>Дата</th>
            <th>Начало</th>
            <th>Конец</th>
            <th>Студентов</th>
            <th>Время</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="text-center text-muted">Загрузка...</td>
          </tr>
          <tr v-else-if="workTimes.length === 0">
            <td colspan="7" class="text-center text-muted">Нет записей в базе</td>
          </tr>
          <tr v-else-if="filteredWorkTimes.length === 0">
            <td colspan="7" class="text-center text-muted">
              Нет данных по выбранным фильтрам
            </td>
          </tr>
          <tr v-for="item in paginatedItems" :key="item.id">
            <td>
              <strong>{{ equipmentStore.getName(item.equipment_id) }}</strong>
              <span class="inv-number">Инв. № {{ equipmentStore.getInventoryNumber(item.equipment_id) }}</span>
            </td>
            <td>{{ lessonTitle(item) }}</td>
            <td>{{ formatDate(item.start_time) }}</td>
            <td>{{ formatTime(item.start_time) }}</td>
            <td>{{ formatTime(item.end_time) }}</td>
            <td>{{ studentsCount(item) }}</td>
            <td><strong>{{ formatHours(item.total_hours) }}</strong></td>
          </tr>
        </tbody>
      </table>
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

<style scoped>
.analytics-view { padding: 0; }
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
}
.toolbar-left .count {
  font-size: 13px;
  color: #888;
}
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: flex-start;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-grow: 1;
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
.actions {
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
  padding-top: 0;
}
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
.stat-icon { font-size: 28px; }
.stat-value { font-size: 24px; font-weight: 700; color: #1a1a2e; }
.stat-label { font-size: 13px; color: #888; }
.table-container {
  background: white;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow-x: auto;
}
.table { margin: 0; font-size: 14px; width: 100%; border-collapse: collapse; }
.table th { background: #f4f7fc; font-weight: 600; color: #555; border-bottom: 2px solid #e0e0e0; padding: 12px 16px; text-align: left; }
.table td { padding: 10px 16px; vertical-align: middle; border-bottom: 1px solid #e9ecef; }
.inv-number { display: block; font-size: 12px; color: #888; }
.text-center { text-align: center; }
.text-muted { color: #888; }
.btn {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-primary { background: #0d6efd; color: white; border-color: #0d6efd; }
.btn-primary:hover { background: #0b5ed7; border-color: #0a58ca; }
.btn-outline-secondary { background: transparent; color: #6c757d; border-color: #6c757d; }
.btn-outline-secondary:hover { background: #6c757d; color: white; }
</style>