<template>
  <div class="logs-view">
    <!-- TOOLBAR -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>
          <IconLogs class="title-icon" />
          Журнал действий
        </h2>
        <span class="count">Всего записей: {{ total }}</span>
        <span class="count" style="margin-left: 16px; color: #0d6efd;">
          На странице: {{ logs.length }}
        </span>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-outline-danger btn-sm" @click="confirmCleanup">
          <IconTrash class="btn-icon" />
          Очистить старые
        </button>
        <button class="btn btn-outline-secondary btn-sm" @click="loadLogs">
          <IconRefresh class="btn-icon" />
          Обновить
        </button>
      </div>
    </div>

    <!-- ФИЛЬТРЫ -->
    <div class="filters">
      <div class="filter-group">
        <label>Пользователь</label>
        <input 
          v-model="filters.user_id" 
          type="number" 
          class="form-control" 
          placeholder="ID пользователя"
          @input="applyFilters"
        />
      </div>

      <div class="filter-group">
        <label>Действие</label>
        <select v-model="filters.action" class="form-control" @change="applyFilters">
          <option value="">Все действия</option>
          <optgroup label="Авторизация">
            <option value="login">Вход</option>
            <option value="logout">Выход</option>
            <option value="register">Регистрация</option>
            <option value="change_password">Смена пароля</option>
            <option value="refresh">Обновление токена</option>
          </optgroup>
          <optgroup label="Оборудование">
            <option value="create">Создание</option>
            <option value="update">Обновление</option>
            <option value="delete">Удаление</option>
            <option value="import">Импорт</option>
            <option value="export">Экспорт</option>
            <option value="upload_photo">Загрузка фото</option>
            <option value="delete_photo">Удаление фото</option>
          </optgroup>
          <optgroup label="Занятия">
            <option value="complete">Завершение</option>
          </optgroup>
          <optgroup label="Ремонты">
            <option value="resolve">Закрытие заявки</option>
          </optgroup>
          <optgroup label="Шаблоны">
            <option value="add_equipment">Добавление оборудования</option>
            <option value="remove_equipment">Удаление оборудования</option>
            <option value="sync">Синхронизация</option>
          </optgroup>
          <optgroup label="Ошибки">
            <option value="error">Ошибка</option>
          </optgroup>
        </select>
      </div>

      <div class="filter-group">
        <label>Сущность</label>
        <select v-model="filters.entity" class="form-control" @change="applyFilters">
          <option value="">Все сущности</option>
          <option value="auth">Авторизация</option>
          <option value="equipment">Оборудование</option>
          <option value="lessons">Занятия</option>
          <option value="templates">Шаблоны</option>
          <option value="repairs">Ремонты</option>
          <option value="worktime">Время работы</option>
          <option value="logs">Логи</option>
        </select>
      </div>

      <div class="filter-group date-filters">
        <label>От</label>
        <input v-model="filters.date_from" type="date" class="form-control" @change="applyFilters" />
        <label>До</label>
        <input v-model="filters.date_to" type="date" class="form-control" @change="applyFilters" />
      </div>

      <div class="filter-group actions">
        <button class="btn btn-outline-secondary" @click="resetAllFilters">
          <IconReset class="btn-icon" />
          Сбросить
        </button>
        <button class="btn btn-primary" @click="applyFilters">
          <IconSearch class="btn-icon" />
          Применить
        </button>
      </div>
    </div>

    <!-- СТАТИСТИКА -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon"><IconList /></div>
        <div class="stat-info">
          <div class="stat-value">{{ total }}</div>
          <div class="stat-label">Всего записей</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><IconUser /></div>
        <div class="stat-info">
          <div class="stat-value">{{ uniqueUsers }}</div>
          <div class="stat-label">Уникальных пользователей</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><IconList /></div>
        <div class="stat-info">
          <div class="stat-value">{{ uniqueEntities }}</div>
          <div class="stat-label">Сущностей</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"><IconCalendar /></div>
        <div class="stat-info">
          <div class="stat-value">{{ todayLogs }}</div>
          <div class="stat-label">За сегодня</div>
        </div>
      </div>
    </div>

    <!-- ТАБЛИЦА ЛОГОВ -->
    <div class="table-container">
      <div v-if="loading" class="text-center text-muted" style="padding: 40px;">
        <IconLoading class="loading-icon" />
        Загрузка...
      </div>
      <table v-else class="table table-hover">
        <thead>
          <tr>
            <th style="width: 60px;">ID</th>
            <th style="min-width: 150px;">Пользователь</th>
            <th style="min-width: 140px;">Действие</th>
            <th style="min-width: 120px;">Сущность</th>
            <th style="width: 80px;">ID</th>
            <th style="min-width: 150px;">Дата</th>
            <th style="width: 60px;">Детали</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!logs || logs.length === 0">
            <td colspan="7" class="text-center text-muted">Нет записей</td>
          </tr>
          <tr v-for="log in logs" :key="'row-' + log.id" @click="openDetails(log)" style="cursor: pointer;">
            <td>{{ log.id }}</td>
            <td>
              <strong>{{ log.user_name || 'Система' }}</strong>
              <span v-if="log.user_id" class="user-id">(ID: {{ log.user_id }})</span>
            </td>
            <td>
              <span class="badge" :class="getActionClass(log.action)">
                {{ log.action }}
              </span>
            </td>
            <td>
              <span class="badge badge-entity">
                {{ getEntityLabel(log.entity) }}
              </span>
            </td>
            <td>{{ log.entity_id || '—' }}</td>
            <td>
              <div class="date-cell">
                <div class="date">{{ formatDate(log.created_at) }}</div>
                <div class="time">{{ formatTime(log.created_at) }}</div>
              </div>
            </td>
            <td>
              <button v-if="log.details" class="btn btn-sm btn-outline-info" @click.stop="openDetails(log)">
                <IconEye class="btn-icon" />
                Детали
              </button>
              <span v-else class="text-muted">—</span>
            </td>
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

    <!-- МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ -->
    <div v-if="selectedLog" class="modal-overlay" @click="closeDetails">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Детали записи #{{ selectedLog.id }}</h3>
          <button class="btn-close" @click="closeDetails">×</button>
        </div>
        <div class="modal-body">
          <!-- Основная информация -->
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Пользователь:</span>
              <span class="detail-value">{{ selectedLog.user_name || 'Система' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Действие:</span>
              <span class="detail-value">
                <span class="badge" :class="getActionClass(selectedLog.action)">
                  {{ selectedLog.action }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Сущность:</span>
              <span class="detail-value">
                <span class="badge badge-entity">
                  {{ getEntityLabel(selectedLog.entity) }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ID сущности:</span>
              <span class="detail-value">{{ selectedLog.entity_id || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">IP:</span>
              <span class="detail-value">{{ selectedLog.ip || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Дата:</span>
              <span class="detail-value">{{ formatDate(selectedLog.created_at) }} {{ formatTime(selectedLog.created_at) }}</span>
            </div>
          </div>

          <!-- Параметры действия -->
          <div v-if="getDetailsParams(selectedLog.details)" class="params-section">
            <div class="params-header" @click="toggleParams">
              <span>Параметры действия</span>
              <span class="toggle-icon">{{ showParams ? '▼' : '▶' }}</span>
            </div>
            <div v-if="showParams" class="params-grid">
              <div v-for="(value, key) in getDetailsParams(selectedLog.details)" :key="key" class="param-item">
                <span class="param-key">{{ formatParamKey(key) }}:</span>
                <span class="param-value">{{ formatParamValue(value) }}</span>
              </div>
            </div>
          </div>

          <!-- Время выполнения -->
          <div v-if="getDetailsDuration(selectedLog.details)" class="duration-section">
            <span class="duration-label">Время выполнения:</span>
            <span class="duration-value">{{ getDetailsDuration(selectedLog.details) }}</span>
          </div>

          <!-- JSON -->
          <div class="json-section">
            <div class="json-header" @click="toggleJson">
              <span>JSON (сырые данные)</span>
              <span class="toggle-icon">{{ showJson ? '▼' : '▶' }}</span>
            </div>
            <div v-if="showJson" class="json-body">
              <pre class="json-content">{{ formatDetails(selectedLog.details) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- МОДАЛ ПОДТВЕРЖДЕНИЯ ОЧИСТКИ -->
    <ConfirmModal 
      v-model:visible="showCleanupModal"
      title="Очистка логов"
      :message="cleanupMessage"
      confirm-text="Очистить"
      confirm-variant="danger"
      @confirm="handleCleanup"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { logsApi } from '../api';
import Pagination from '../components/Pagination.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import { useToastStore } from '../stores/toastStore';
import { useFormatters } from '../composables/useFormatters';
import {
  IconLogs,
  IconTrash,
  IconRefresh,
  IconReset,
  IconSearch,
  IconList,
  IconUser,
  IconCalendar,
  IconLoading,
  IconEye
} from '../components/icons';

const toast = useToastStore();
const { formatDate, formatTime } = useFormatters();

// ============================================
// СОСТОЯНИЕ
// ============================================
const logs = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = 8;
const totalPages = ref(1);
const showCleanupModal = ref(false);
const cleanupMessage = ref('');

// Модальное окно
const selectedLog = ref(null);
const showParams = ref(false);
const showJson = ref(false);

// ============================================
// ФИЛЬТРЫ
// ============================================
const filters = ref({
  user_id: '',
  action: '',
  entity: '',
  date_from: '',
  date_to: ''
});

// ============================================
// СТАТИСТИКА
// ============================================
const uniqueUsers = computed(() => {
  const users = new Set(logs.value.map(l => l.user_id).filter(id => id));
  return users.size;
});

const uniqueEntities = computed(() => {
  const entities = new Set(logs.value.map(l => l.entity).filter(e => e));
  return entities.size;
});

const todayLogs = computed(() => {
  const today = new Date().toDateString();
  return logs.value.filter(l => {
    const date = new Date(l.created_at);
    return date.toDateString() === today;
  }).length;
});

const showPagination = computed(() => totalPages.value > 1);

// ============================================
// ЗАГРУЗКА ЛОГОВ
// ============================================
const loadLogs = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize,
      ...filters.value
    };
    
    Object.keys(params).forEach(key => {
      if (!params[key] && key !== 'page' && key !== 'limit') {
        delete params[key];
      }
    });

    const res = await logsApi.getAll(params);
    logs.value = res.data.logs || [];
    total.value = res.data.total || 0;
    totalPages.value = res.data.totalPages || 1;
    
    console.log('Загружено логов:', logs.value.length);
  } catch (error) {
    console.error('Ошибка загрузки логов:', error);
    toast.error('Ошибка загрузки логов');
  } finally {
    loading.value = false;
  }
};

// ============================================
// ПРИМЕНЕНИЕ ФИЛЬТРОВ
// ============================================
const applyFilters = () => {
  currentPage.value = 1;
  loadLogs();
};

const resetAllFilters = () => {
  filters.value = {
    user_id: '',
    action: '',
    entity: '',
    date_from: '',
    date_to: ''
  };
  currentPage.value = 1;
  loadLogs();
};

// ============================================
// МОДАЛЬНОЕ ОКНО
// ============================================
const openDetails = (log) => {
  selectedLog.value = log;
  showParams.value = false;
  showJson.value = false;
  document.body.style.overflow = 'hidden';
};

const closeDetails = () => {
  selectedLog.value = null;
  document.body.style.overflow = '';
};

const toggleParams = () => {
  showParams.value = !showParams.value;
};

const toggleJson = () => {
  showJson.value = !showJson.value;
};

// ============================================
// ОЧИСТКА ЛОГОВ
// ============================================
const confirmCleanup = () => {
  cleanupMessage.value = 'Вы уверены, что хотите удалить все логи старше 90 дней? Это действие нельзя отменить!';
  showCleanupModal.value = true;
};

const handleCleanup = async () => {
  try {
    const res = await logsApi.cleanup({ days: 90 });
    toast.success(res.data.message || 'Логи очищены');
    showCleanupModal.value = false;
    await loadLogs();
  } catch (error) {
    console.error('Ошибка очистки:', error);
    toast.error('Ошибка очистки логов');
  }
};

// ============================================
// ПАРСИНГ ДЕТАЛЕЙ
// ============================================
const parseDetails = (details) => {
  if (!details) return null;
  try {
    if (typeof details === 'string') {
      return JSON.parse(details);
    }
    return details;
  } catch {
    return null;
  }
};

const getDetailsParams = (details) => {
  const parsed = parseDetails(details);
  if (!parsed) return null;
  const { action, duration, success, error, ...params } = parsed;
  if (Object.keys(params).length === 0) return null;
  return params;
};

const getDetailsDuration = (details) => {
  const parsed = parseDetails(details);
  if (!parsed) return null;
  return parsed.duration || null;
};

// ============================================
// ФОРМАТИРОВАНИЕ
// ============================================
const formatParamKey = (key) => {
  const labels = {
    'id': 'ID',
    'user_id': 'ID пользователя',
    'email': 'Email',
    'name': 'Имя',
    'title': 'Название',
    'group': 'Группа',
    'teacher': 'Преподаватель',
    'students_count': 'Количество студентов',
    'date': 'Дата',
    'start_time': 'Время начала',
    'end_time': 'Время окончания',
    'status': 'Статус',
    'notes': 'Заметки',
    'template_id': 'ID шаблона',
    'equipment_id': 'ID оборудования',
    'equipment_ids': 'ID оборудования',
    'quantity': 'Количество',
    'inventory_number': 'Инвентарный номер',
    'inventory_name': 'Название по инвентарю',
    'year_of_release': 'Год выпуска',
    'description': 'Описание',
    'purchase_basis': 'Основание приобретения',
    'working_status': 'Рабочий статус',
    'write_off_status': 'Статус списания',
    'price': 'Цена',
    'country': 'Страна',
    'manufacturer': 'Производитель',
    'original_name': 'Оригинальное название',
    'realism_class': 'Класс реалистичности',
    'photo': 'Фото',
    'detection_date': 'Дата обнаружения',
    'nature_of_malfunction': 'Характер неисправности',
    'detected_by': 'Кто обнаружил',
    'repair_possibility': 'Возможность ремонта',
    'resolved_by': 'Кто закрыл',
    'resolution_date': 'Дата закрытия',
    'resolution_status': 'Статус закрытия',
    'write_off_reason': 'Причина списания',
    'repair_notes': 'Примечания к ремонту',
    'is_resolved': 'Закрыта',
    'is_active': 'Активна',
    'discipline': 'Дисциплина',
    'module': 'Модуль',
    'equipment_list': 'Список оборудования',
    'file': 'Файл',
    'created': 'Создано',
    'errors': 'Ошибки',
    'items': 'Элементы',
    'fields': 'Поля',
    'records': 'Записей',
    'size': 'Размер'
  };
  return labels[key] || key;
};

const formatParamValue = (value) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return formatDate(value) + ' ' + formatTime(value);
  }
  return String(value);
};

const formatDetails = (details) => {
  try {
    if (typeof details === 'string') {
      return JSON.stringify(JSON.parse(details), null, 2);
    }
    return JSON.stringify(details, null, 2);
  } catch {
    return details;
  }
};

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
const getActionClass = (action) => {
  const classes = {
    'login': 'badge-success',
    'logout': 'badge-secondary',
    'register': 'badge-primary',
    'change_password': 'badge-info',
    'refresh': 'badge-info',
    'create': 'badge-success',
    'update': 'badge-warning',
    'delete': 'badge-danger',
    'import': 'badge-primary',
    'export': 'badge-primary',
    'upload_photo': 'badge-info',
    'delete_photo': 'badge-danger',
    'complete': 'badge-success',
    'resolve': 'badge-success',
    'add_equipment': 'badge-success',
    'remove_equipment': 'badge-danger',
    'sync': 'badge-warning',
    'error': 'badge-danger'
  };
  return classes[action] || 'badge-secondary';
};

const getEntityLabel = (entity) => {
  const labels = {
    'auth': 'Авторизация',
    'equipment': 'Оборудование',
    'lessons': 'Занятия',
    'templates': 'Шаблоны',
    'repairs': 'Ремонты',
    'worktime': 'Время работы',
    'logs': 'Логи'
  };
  return labels[entity] || entity || '—';
};

// ============================================
// WATCH
// ============================================
watch(currentPage, () => {
  loadLogs();
});

// ============================================
// LIFECYCLE
// ============================================
onMounted(loadLogs);
</script>

<style scoped>
.logs-view {
  padding: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
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
  flex: 1;
  min-width: 140px;
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
  background: white;
  width: 100%;
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
  min-width: 130px;
}

.actions {
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
  padding-top: 0;
}

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

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border-color: #dc3545;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

.btn-outline-info {
  background: transparent;
  color: #0dcaf0;
  border-color: #0dcaf0;
}

.btn-outline-info:hover {
  background: #0dcaf0;
  color: white;
}

.btn-sm {
  padding: 2px 8px;
  font-size: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0d6efd;
  flex-shrink: 0;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
  stroke: currentColor;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 12px;
  color: #888;
}

.table-container {
  background: white;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow-x: auto;
}

.table {
  margin: 0;
  font-size: 14px;
  width: 100%;
  border-collapse: collapse;
}

.table th {
  background: #f4f7fc;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #e0e0e0;
  padding: 12px 16px;
  text-align: left;
  white-space: nowrap;
}

.table td {
  padding: 10px 16px;
  vertical-align: middle;
  border-bottom: 1px solid #e9ecef;
}

.table tbody tr:hover {
  background: #f8f9fa;
}

.text-center {
  text-align: center;
}

.text-muted {
  color: #888;
}

.user-id {
  font-size: 12px;
  color: #888;
  margin-left: 4px;
}

.badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.badge-success { background: #d4edda; color: #155724; }
.badge-danger { background: #f8d7da; color: #721c24; }
.badge-warning { background: #fff3cd; color: #856404; }
.badge-primary { background: #cce5ff; color: #004085; }
.badge-secondary { background: #e2e3e5; color: #383d41; }
.badge-info { background: #d1ecf1; color: #0c5460; }
.badge-entity { background: #e9ecef; color: #495057; }

.date-cell {
  display: flex;
  flex-direction: column;
}

.date-cell .date {
  font-size: 13px;
  color: #212529;
}

.date-cell .time {
  font-size: 12px;
  color: #888;
}

.loading-icon {
  width: 18px;
  height: 18px;
  stroke: #888;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============================================
   МОДАЛЬНОЕ ОКНО
   ============================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(30px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 2px solid #e9ecef;
  background: #f8f9fa;
  position: sticky;
  top: 0;
  z-index: 1;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #212529;
}

.btn-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #888;
  line-height: 1;
  padding: 0 4px;
  transition: color 0.15s;
}

.btn-close:hover {
  color: #212529;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  max-height: calc(80vh - 70px);
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.detail-label {
  font-weight: 600;
  color: #495057;
  font-size: 13px;
  min-width: 100px;
}

.detail-value {
  color: #212529;
  font-size: 13px;
}

.params-section {
  margin: 12px 0;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.params-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: #f1f3f5;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  color: #495057;
  transition: background 0.15s;
}

.params-header:hover {
  background: #e9ecef;
}

.toggle-icon {
  font-size: 12px;
  color: #888;
}

.params-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 20px;
  padding: 10px 14px;
  background: white;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  font-size: 13px;
}

.param-key {
  font-weight: 500;
  color: #495057;
  min-width: 120px;
}

.param-value {
  color: #212529;
  word-break: break-word;
}

.duration-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
}

.duration-label {
  font-weight: 500;
  color: #495057;
}

.duration-value {
  color: #0d6efd;
  font-weight: 600;
}

.json-section {
  margin: 12px 0 0 0;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.json-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: #f1f3f5;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  color: #495057;
  transition: background 0.15s;
}

.json-header:hover {
  background: #e9ecef;
}

.json-body {
  padding: 12px 14px;
  background: #1a1a2e;
  max-height: 300px;
  overflow: auto;
}

.json-content {
  margin: 0;
  padding: 8px;
  background: transparent;
  color: #00ff9d;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Адаптивность */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .date-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .params-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .param-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .modal-content {
    width: 95%;
    max-height: 90vh;
  }

  .modal-body {
    padding: 16px;
  }
}
</style>