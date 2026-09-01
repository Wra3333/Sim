<template>
  <div class="analytics-view">
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>📊 Учет времени работы оборудования</h2>
        <span class="count">Всего записей: {{ workTimes.length }}</span>
        <span class="count" style="margin-left: 16px; color: #0d6efd;">
          Оборудования: {{ equipmentList.length }}
        </span>
      </div>
    </div>

    <div class="filters">
      <div class="filter-group">
        <EquipmentMultiSelect
          v-model="filters.equipmentIds"
          :equipment-options="equipmentList"
          placeholder="Введите название или инв. номер..."
          @update:model-value="applyFilters"
        />
      </div>

      <div class="filter-group date-filters">
        <label>От</label>
        <input v-model="filters.dateFrom" type="date" class="form-control" />
        <label>До</label>
        <input v-model="filters.dateTo" type="date" class="form-control" />
      </div>

      <div class="filter-group actions">
        <button class="btn btn-primary" @click="applyFilters">Обновить</button>
        <button class="btn btn-outline-secondary" @click="resetFilters">Сбросить</button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-info">
          <div class="stat-value">{{ formattedTotalHours }}</div>
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
          <div class="stat-value">{{ formattedAvgHoursPerSession }}</div>
          <div class="stat-label">Среднее за сеанс</div>
        </div>
      </div>
    </div>

    <div class="table-container">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Оборудование</th>
            <th>Занятие</th>
            <th>Начало</th>
            <th>Конец</th>
            <th>Студентов</th>
            <th>Часы</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="text-center text-muted">Загрузка...</td>
          </tr>
          <tr v-else-if="workTimes.length === 0">
            <td colspan="6" class="text-center text-muted">Нет записей в базе</td>
          </tr>
          <tr v-else-if="filteredWorkTimes.length === 0">
            <td colspan="6" class="text-center text-muted">
              Нет данных по выбранным фильтрам
            </td>
          </tr>
          <tr v-for="item in paginatedItems" :key="item.id">
            <td>
              <strong>{{ equipmentName(item) }}</strong>
              <span class="inv-number">Инв. № {{ equipmentInventory(item) }}</span>
            </td>
            <td>{{ lessonTitle(item) }}</td>
            <td>{{ formatDateTime(item.start_time) }}</td>
            <td>{{ formatDateTime(item.end_time) }}</td>
            <td>{{ studentsCount(item) }}</td>
            <td><strong>{{ formatTotalHours(item) }}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination 
      v-if="showPagination"
      v-model:current-page="currentPage"
      :total-pages="totalPages"
      :loading="loading"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { workTimeApi, equipmentApi } from '../api';
import { useFormatters } from '../composables/useFormatters';
import { usePagination } from '../composables/usePagination';
import { useToastStore } from '../stores/toastStore';
import Pagination from '../components/Pagination.vue';
import EquipmentMultiSelect from '../components/EquipmentMultiSelect.vue';

const toast = useToastStore();
const { formatDateTime, formatHours } = useFormatters();

const workTimes = ref([]);
const equipmentList = ref([]);
const loading = ref(false);

const filters = ref({
  equipmentIds: [],
  dateFrom: '',
  dateTo: ''
});

const equipmentName = (item) => item.equipment?.name || '❌ Оборудование не найдено';
const equipmentInventory = (item) => item.equipment?.inventory_number || '—';
const lessonTitle = (item) => item.lesson?.title || '—';
const studentsCount = (item) => item.students_count || 0;
const formatTotalHours = (item) => `${Number(item.total_hours || 0).toFixed(2)}ч`;

const filteredWorkTimes = computed(() => {
  let items = workTimes.value;

  // Фильтр по оборудованию (из EquipmentMultiSelect)
  if (filters.value.equipmentIds && filters.value.equipmentIds.length > 0) {
    const ids = filters.value.equipmentIds.map(id => Number(id));
    items = items.filter(item => ids.includes(item.equipment_id));
  }

  // Фильтр по дате
  if (filters.value.dateFrom) {
    const from = new Date(filters.value.dateFrom);
    from.setHours(0, 0, 0, 0);
    items = items.filter(item => new Date(item.start_time) >= from);
  }
  if (filters.value.dateTo) {
    const to = new Date(filters.value.dateTo);
    to.setHours(23, 59, 59, 999);
    items = items.filter(item => new Date(item.start_time) <= to);
  }

  return items;
});

const { 
  currentPage, 
  paginatedItems, 
  totalPages,
  resetPage,
  showPagination
} = usePagination(filteredWorkTimes, { pageSize: 8 });

const totalHours = computed(() => {
  return filteredWorkTimes.value.reduce((sum, item) => sum + Number(item.total_hours || 0), 0);
});

const formattedTotalHours = computed(() => formatHours(totalHours.value));

const totalStudents = computed(() => {
  return filteredWorkTimes.value.reduce((sum, item) => sum + Number(item.students_count || 0), 0);
});

const avgHoursPerSession = computed(() => {
  const count = filteredWorkTimes.value.length;
  return count > 0 ? totalHours.value / count : 0;
});

const formattedAvgHoursPerSession = computed(() => formatHours(avgHoursPerSession.value));

const loadData = async () => {
  loading.value = true;
  try {
    const [workTimeRes, equipmentRes] = await Promise.all([
      workTimeApi.getAll(),
      equipmentApi.getAll()
    ]);
    workTimes.value = workTimeRes.data || [];
    equipmentList.value = equipmentRes.data || [];
    resetPage();
  } catch (error) {
    console.error('❌ Ошибка загрузки:', error);
    toast.error(error?.response?.data?.message || "Ошибка загрузки данных:");
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  resetPage();
};

const resetFilters = () => {
  filters.value = {
    equipmentIds: [],
    dateFrom: '',
    dateTo: ''
  };
  resetPage();
};

watch([() => filters.value.equipmentIds, () => filters.value.dateFrom, () => filters.value.dateTo], () => {
  resetPage();
}, { deep: true });

onMounted(loadData);
</script>

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