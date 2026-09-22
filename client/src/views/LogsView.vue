<template>
  <div class="logs-view">
    <!-- TOOLBAR -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>
          <IconLogs class="title-icon" />
          <span class="title-text">Журнал действий</span>
        </h2>
        <span v-if="!isMobile" class="count">Всего записей: {{ total }}</span>
        <span v-if="!isMobile" class="count count-blue">
          На странице: {{ logs.length }}
        </span>
      </div>

      <div class="toolbar-right">
        <button
          class="btn btn-outline-danger btn-sm btn-mobile-icon"
          @click="confirmCleanup"
          title="Очистить старые"
        >
          <IconTrash class="btn-icon" />
          <span class="btn-text">Очистить старые</span>
        </button>

        <button
          v-if="isNarrow || isMobile"
          class="btn btn-outline-secondary btn-sm btn-mobile-icon"
          :class="{ 'btn-active': mobileFiltersOpen }"
          @click="mobileFiltersOpen = true"
          title="Фильтры"
        >
          <IconFilter class="btn-icon" />
          <span class="btn-text">Фильтры</span>
          <span v-if="activeFiltersCount > 0" class="badge">{{ activeFiltersCount }}</span>
        </button>

        <button
          class="btn btn-outline-secondary btn-sm btn-mobile-icon"
          @click="loadLogs"
          title="Обновить"
        >
          <IconRefresh class="btn-icon" />
          <span class="btn-text">Обновить</span>
        </button>
      </div>
    </div>

    <!-- DESKTOP: ФИЛЬТРЫ — только > 1600px -->
    <div v-if="!isNarrow && !isMobile" class="filters">
      <div class="filters-row">
        <div class="filter-group">
          <label>Пользователь</label>
          <input
            v-model="filters.user_id"
            type="number"
            class="form-control"
            placeholder="ID пользователя"
          />
        </div>

        <div class="filter-group">
          <label>Действие</label>
          <select v-model="filters.action" class="form-control">
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
          <select v-model="filters.entity" class="form-control">
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
          <input v-model="filters.date_from" type="date" class="form-control" />
          <label>До</label>
          <input v-model="filters.date_to" type="date" class="form-control" />
        </div>
      </div>

      <div class="filters-actions">
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
    <div class="stats-grid" :class="{ 'is-mobile': isMobile }">
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
          <div class="stat-label">Пользователей</div>
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

    <!-- DESKTOP: ТАБЛИЦА -->
    <template v-if="!isMobile">
      <div class="table-container">
        <div v-if="loading" class="text-center text-muted" style="padding: 40px;">
          <IconLoading class="loading-icon" />
          Загрузка...
        </div>
        <table v-else class="table">
          <thead>
            <tr>
              <th class="col-id">ID</th>
              <th class="col-user">Пользователь</th>
              <th class="col-action">Действие</th>
              <th class="col-entity">Сущность</th>
              <th class="col-entity-id">ID сущности</th>
              <th class="col-date">Дата</th>
              <th class="col-details">Детали</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!logs || logs.length === 0">
              <td colspan="7" class="text-center text-muted">Нет записей</td>
            </tr>
            <tr
              v-for="log in logs"
              :key="'row-' + log.id"
              @click="openDetails(log)"
              class="clickable-row"
            >
              <td class="cell-id">{{ log.id }}</td>
              <td class="cell-user">
                <strong>{{ log.user_name || 'Система' }}</strong>
                <span v-if="log.user_id" class="user-id">(ID: {{ log.user_id }})</span>
              </td>
              <td class="cell-action">
                <span class="badge" :class="getActionClass(log.action)">
                  {{ log.action }}
                </span>
              </td>
              <td class="cell-entity">
                <span class="badge badge-entity">{{ getEntityLabel(log.entity) }}</span>
              </td>
              <td class="cell-entity-id">{{ log.entity_id || '—' }}</td>
              <td class="cell-date">
                <div class="date-cell">
                  <div class="date">{{ formatDate(log.created_at) }}</div>
                  <div class="time">{{ formatTime(log.created_at) }}</div>
                </div>
              </td>
              <td class="cell-details">
                <button
                  v-if="log.details"
                  class="btn btn-sm btn-outline-info"
                  @click.stop="openDetails(log)"
                >
                  <IconEye class="btn-icon" />
                  Детали
                </button>
                <span v-else class="text-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- MOBILE: КАРТОЧКИ -->
    <template v-else>
      <div v-if="loading" class="loading-state">
        <IconLoading class="loading-icon" />
        Загрузка...
      </div>

      <div v-else-if="logs.length === 0" class="empty-state">
        <IconList class="empty-icon" />
        <span>Нет записей</span>
      </div>

      <div v-else class="logs-cards">
        <LogMobileCard
          v-for="log in logs"
          :key="log.id"
          :log="log"
          @open-details="openDetails"
        />
      </div>
    </template>

    <!-- ПАГИНАЦИЯ -->
    <Pagination
      v-if="showPagination"
      v-model:current-page="currentPage"
      :total-pages="totalPages"
      :loading="loading"
    />

    <!-- OFF-CANVAS ФИЛЬТРЫ -->
    <transition name="drawer-fade">
      <div
        v-if="mobileFiltersOpen"
        class="drawer-overlay"
        @click.self="mobileFiltersOpen = false"
      >
        <transition name="drawer-slide" appear>
          <div class="drawer-window">
            <div class="drawer-header">
              <h3><IconFilter class="drawer-icon" /> Фильтры</h3>
              <button class="drawer-close" @click="mobileFiltersOpen = false">×</button>
            </div>

            <div class="drawer-body">
              <div class="filter-group">
                <label>Пользователь (ID)</label>
                <input
                  v-model="filters.user_id"
                  type="number"
                  class="form-control"
                  placeholder="ID пользователя"
                />
              </div>

              <div class="filter-group">
                <label>Действие</label>
                <select v-model="filters.action" class="form-control">
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
                <select v-model="filters.entity" class="form-control">
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

              <div class="filter-group">
                <label>От</label>
                <input v-model="filters.date_from" type="date" class="form-control" />
              </div>

              <div class="filter-group">
                <label>До</label>
                <input v-model="filters.date_to" type="date" class="form-control" />
              </div>
            </div>

            <div class="drawer-footer">
              <button class="btn btn-outline-secondary" @click="resetAllFilters">
                <IconReset class="btn-icon" />
                Сбросить
              </button>
              <button class="btn btn-primary" @click="applyFiltersAndClose">
                <IconSearch class="btn-icon" />
                Применить
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ -->
    <Teleport to="body">
      <div v-if="selectedLog" class="modal-overlay" @click="closeDetails">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Детали записи #{{ selectedLog.id }}</h3>
            <button class="btn-close" @click="closeDetails">×</button>
          </div>
          <div class="modal-body">
            <div class="details-grid" :class="{ 'is-mobile': isMobile }">
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
                  <span class="badge badge-entity">{{ getEntityLabel(selectedLog.entity) }}</span>
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
                <span class="detail-value">
                  {{ formatDate(selectedLog.created_at) }} {{ formatTime(selectedLog.created_at) }}
                </span>
              </div>
            </div>

            <div v-if="getDetailsParams(selectedLog.details)" class="params-section">
              <div class="params-header" @click="showParams = !showParams">
                <span>Параметры действия</span>
                <span class="toggle-icon">{{ showParams ? '▼' : '▶' }}</span>
              </div>
              <div v-if="showParams" class="params-grid" :class="{ 'is-mobile': isMobile }">
                <div
                  v-for="(value, key) in getDetailsParams(selectedLog.details)"
                  :key="key"
                  class="param-item"
                >
                  <span class="param-key">{{ formatParamKey(key) }}:</span>
                  <span class="param-value">{{ formatParamValue(value) }}</span>
                </div>
              </div>
            </div>

            <div v-if="getDetailsDuration(selectedLog.details)" class="duration-section">
              <span class="duration-label">Время выполнения:</span>
              <span class="duration-value">{{ getDetailsDuration(selectedLog.details) }}</span>
            </div>

            <div class="json-section">
              <div class="json-header" @click="showJson = !showJson">
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
    </Teleport>

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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { logsApi } from '../api';
import Pagination from '../components/Pagination.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import LogMobileCard from '../components/logs/LogMobileCard.vue';
import { useToastStore } from '../stores/toastStore';
import { useFormatters } from '../composables/useFormatters';
import {
  IconLogs, IconTrash, IconRefresh, IconReset, IconSearch,
  IconList, IconUser, IconCalendar, IconLoading, IconEye,
  IconFilter
} from '../components/icons';

const toast = useToastStore();
const { formatDate, formatTime } = useFormatters();

// ============================================
//  MOBILE (≤ 1275px)
// ============================================
const isMobile = ref(false);
let mediaQuery = null;
const mobileFiltersOpen = ref(false);

const updateIsMobile = (e) => {
  isMobile.value = e.matches;
  if (!isMobile.value) mobileFiltersOpen.value = false;
};

// ============================================
//  NARROW (≤ 1600px)
// ============================================
const isNarrow = ref(false);
let narrowQuery = null;

const updateIsNarrow = (e) => { isNarrow.value = e.matches; };

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    mediaQuery = window.matchMedia('(max-width: 1275px)');
    isMobile.value = mediaQuery.matches;
    mediaQuery.addEventListener('change', updateIsMobile);

    narrowQuery = window.matchMedia('(max-width: 1600px)');
    isNarrow.value = narrowQuery.matches;
    narrowQuery.addEventListener('change', updateIsNarrow);
  }
});

onBeforeUnmount(() => {
  if (mediaQuery) mediaQuery.removeEventListener('change', updateIsMobile);
  if (narrowQuery) narrowQuery.removeEventListener('change', updateIsNarrow);
});

// ============================================
//  СОСТОЯНИЕ
// ============================================
const logs = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = 8;
const totalPages = ref(1);
const showCleanupModal = ref(false);
const cleanupMessage = ref('');

const selectedLog = ref(null);
const showParams = ref(false);
const showJson = ref(false);

// ============================================
//  ФИЛЬТРЫ
// ============================================
const filters = ref({
  user_id: '',
  action: '',
  entity: '',
  date_from: '',
  date_to: ''
});

const activeFiltersCount = computed(() => {
  let n = 0;
  if (filters.value.user_id) n++;
  if (filters.value.action) n++;
  if (filters.value.entity) n++;
  if (filters.value.date_from) n++;
  if (filters.value.date_to) n++;
  return n;
});

// ============================================
//  СТАТИСТИКА
// ============================================
const uniqueUsers = computed(() => {
  const users = new Set(logs.value.map((l) => l.user_id).filter(Boolean));
  return users.size;
});

const uniqueEntities = computed(() => {
  const entities = new Set(logs.value.map((l) => l.entity).filter(Boolean));
  return entities.size;
});

const todayLogs = computed(() => {
  const today = new Date().toDateString();
  return logs.value.filter(
    (l) => new Date(l.created_at).toDateString() === today
  ).length;
});

const showPagination = computed(() => totalPages.value > 1);

// ============================================
//  ЗАГРУЗКА
// ============================================
const loadLogs = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize,
      ...filters.value
    };

    Object.keys(params).forEach((key) => {
      if (!params[key] && key !== 'page' && key !== 'limit') {
        delete params[key];
      }
    });

    const res = await logsApi.getAll(params);
    logs.value = res.data.logs || [];
    total.value = res.data.total || 0;
    totalPages.value = res.data.totalPages || 1;
  } catch (error) {
    console.error('Ошибка загрузки логов:', error);
    toast.error('Ошибка загрузки логов');
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  currentPage.value = 1;
  loadLogs();
};

const applyFiltersAndClose = () => {
  applyFilters();
  mobileFiltersOpen.value = false;
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
  mobileFiltersOpen.value = false;
};

// ============================================
//  МОДАЛЬНОЕ ОКНО
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

// ============================================
//  ОЧИСТКА
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
//  ПАРСИНГ ДЕТАЛЕЙ
// ============================================
const parseDetails = (details) => {
  if (!details) return null;
  try {
    return typeof details === 'string' ? JSON.parse(details) : details;
  } catch {
    return null;
  }
};

const getDetailsParams = (details) => {
  const parsed = parseDetails(details);
  if (!parsed) return null;
  const { action, duration, success, error, ...params } = parsed;
  return Object.keys(params).length === 0 ? null : params;
};

const getDetailsDuration = (details) => {
  const parsed = parseDetails(details);
  return parsed?.duration || null;
};

// ============================================
//  ФОРМАТИРОВАНИЕ
// ============================================
const formatParamKey = (key) => {
  const labels = {
    id: 'ID',
    user_id: 'ID пользователя',
    email: 'Email',
    name: 'Имя',
    title: 'Название',
    group: 'Группа',
    teacher: 'Преподаватель',
    students_count: 'Количество студентов',
    date: 'Дата',
    start_time: 'Время начала',
    end_time: 'Время окончания',
    status: 'Статус',
    notes: 'Заметки',
    template_id: 'ID шаблона',
    equipment_id: 'ID оборудования',
    equipment_ids: 'ID оборудования',
    quantity: 'Количество',
    inventory_number: 'Инвентарный номер',
    inventory_name: 'Название по инвентарю',
    year_of_release: 'Год выпуска',
    description: 'Описание',
    purchase_basis: 'Основание приобретения',
    working_status: 'Рабочий статус',
    write_off_status: 'Статус списания',
    price: 'Цена',
    country: 'Страна',
    manufacturer: 'Производитель',
    original_name: 'Оригинальное название',
    realism_class: 'Класс реалистичности',
    photo: 'Фото',
    detection_date: 'Дата обнаружения',
    nature_of_malfunction: 'Характер неисправности',
    detected_by: 'Кто обнаружил',
    repair_possibility: 'Возможность ремонта',
    resolved_by: 'Кто закрыл',
    resolution_date: 'Дата закрытия',
    resolution_status: 'Статус закрытия',
    write_off_reason: 'Причина списания',
    repair_notes: 'Примечания к ремонту',
    is_resolved: 'Закрыта',
    is_active: 'Активна',
    discipline: 'Дисциплина',
    module: 'Модуль',
    equipment_list: 'Список оборудования',
    file: 'Файл',
    created: 'Создано',
    errors: 'Ошибки',
    items: 'Элементы',
    fields: 'Поля',
    records: 'Записей',
    size: 'Размер'
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
    return typeof details === 'string'
      ? JSON.stringify(JSON.parse(details), null, 2)
      : JSON.stringify(details, null, 2);
  } catch {
    return details;
  }
};

// ============================================
//  ВСПОМОГАТЕЛЬНЫЕ
// ============================================
const getActionClass = (action) => {
  const classes = {
    login: 'badge-success',
    logout: 'badge-secondary',
    register: 'badge-primary',
    change_password: 'badge-info',
    refresh: 'badge-info',
    create: 'badge-success',
    update: 'badge-warning',
    delete: 'badge-danger',
    import: 'badge-primary',
    export: 'badge-primary',
    upload_photo: 'badge-info',
    delete_photo: 'badge-danger',
    complete: 'badge-success',
    resolve: 'badge-success',
    add_equipment: 'badge-success',
    remove_equipment: 'badge-danger',
    sync: 'badge-warning',
    error: 'badge-danger'
  };
  return classes[action] || 'badge-secondary';
};

const getEntityLabel = (entity) => {
  const labels = {
    auth: 'Авторизация',
    equipment: 'Оборудование',
    lessons: 'Занятия',
    templates: 'Шаблоны',
    repairs: 'Ремонты',
    worktime: 'Время работы',
    logs: 'Логи'
  };
  return labels[entity] || entity || '—';
};

watch(currentPage, () => {
  loadLogs();
});

onMounted(loadLogs);
</script>

<style scoped>
.logs-view { padding: 0; }

/* ============================================
   TOOLBAR
   ============================================ */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
}

.toolbar-left h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.toolbar-left h2 .title-icon {
  width: 24px; height: 24px; stroke: #212529; flex-shrink: 0;
}
.toolbar-left h2 .title-text {
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.toolbar-left .count {
  font-size: 13px; color: #888; white-space: nowrap;
}
.toolbar-left .count-blue { color: #0d6efd; }

.toolbar-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-mobile-icon .badge {
  background: #dc3545;
  color: white;
  border-radius: 999px;
  padding: 0 6px;
  font-size: 10.5px;
  line-height: 16px;
  min-width: 16px;
  text-align: center;
}

.btn-active {
  background: #e7f1ff !important;
  color: #0d6efd !important;
  border-color: #0d6efd !important;
}

/* ============================================
   ФИЛЬТРЫ (desktop)
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

.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
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
  background: white;
  width: 100%;
  min-width: 0;
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
  flex: 0 0 auto;
}

.date-filters label { font-size: 13px; color: #888; }
.date-filters .form-control { min-width: 130px; flex: 1; }

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
  white-space: nowrap;
}
.btn .btn-icon { width: 16px; height: 16px; stroke: currentColor; }

.btn-primary { background: #0d6efd; color: white; border-color: #0d6efd; }
.btn-primary:hover { background: #0b5ed7; border-color: #0a58ca; }

.btn-outline-secondary {
  background: transparent; color: #6c757d; border-color: #6c757d;
}
.btn-outline-secondary:hover { background: #6c757d; color: white; }

.btn-outline-danger {
  background: transparent; color: #dc3545; border-color: #dc3545;
}
.btn-outline-danger:hover { background: #dc3545; color: white; }

.btn-outline-info {
  background: transparent; color: #0dcaf0; border-color: #0dcaf0;
}
.btn-outline-info:hover { background: #0dcaf0; color: white; }

.btn-sm { padding: 2px 8px; font-size: 12px; }

/* ============================================
   СТАТИСТИКА
   ============================================ */
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
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  color: #0d6efd; flex-shrink: 0;
}
.stat-icon svg { width: 24px; height: 24px; stroke: currentColor; }
.stat-value { font-size: 18px; font-weight: 700; color: #1a1a2e; }
.stat-label { font-size: 12px; color: #888; }

/* ============================================
   ТАБЛИЦА — РЕЗИНОВАЯ
   ============================================ */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.table {
  margin: 0;
  font-size: 14px;
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.table thead { background: #f4f7fc; }

.table th {
  background: #f4f7fc;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #e0e0e0;
  padding: 12px 14px;
  text-align: left;
  vertical-align: middle;
  word-break: normal;
  overflow-wrap: break-word;
}

.table td {
  padding: 10px 14px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
  word-break: normal;
  overflow-wrap: break-word;
}

.table tbody tr:hover { background: #f8f9fa; }

.clickable-row { cursor: pointer; }

.text-center { text-align: center; }
.text-muted { color: #888; }

/* Ширины колонок */
.col-id         { width: 7%; }
.col-user       { width: 20%; }
.col-action     { width: 14%; }
.col-entity     { width: 14%; }
.col-entity-id  { width: 10%; }
.col-date       { width: 17%; }
.col-details    { width: 130px; }

.cell-id { color: #6c757d; font-size: 13px; }

.cell-user strong { color: #212529; }
.user-id {
  font-size: 12px;
  color: #888;
  margin-left: 4px;
}

.date-cell {
  display: flex;
  flex-direction: column;
}
.date-cell .date { font-size: 13px; color: #212529; }
.date-cell .time { font-size: 12px; color: #888; }

.cell-details { white-space: nowrap; text-align: right; }

/* ============================================
   БЕЙДЖИ
   ============================================ */
.badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
  white-space: nowrap;
}
.badge-success { background: #d4edda; color: #155724; }
.badge-danger { background: #f8d7da; color: #721c24; }
.badge-warning { background: #fff3cd; color: #856404; }
.badge-primary { background: #cce5ff; color: #004085; }
.badge-secondary { background: #e2e3e5; color: #383d41; }
.badge-info { background: #d1ecf1; color: #0c5460; }
.badge-entity { background: #e9ecef; color: #495057; }

/* ============================================
   ЗАГРУЗКА / ПУСТО
   ============================================ */
.loading-icon {
  width: 18px; height: 18px; stroke: #888;
  animation: spin 1s linear infinite;
  display: inline-block; margin-right: 8px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.loading-state {
  display: flex; align-items: center; justify-content: center;
  padding: 60px; color: #888; font-size: 14px; gap: 8px;
}

.empty-state {
  text-align: center; padding: 60px 20px; color: #6c757d;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.empty-state .empty-icon { width: 40px; height: 40px; stroke: #6c757d; }

.logs-cards { display: flex; flex-direction: column; }

/* ============================================
   МОДАЛЬНОЕ ОКНО
   ============================================ */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
  padding: 16px;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-content {
  background: white; border-radius: 12px;
  max-width: 700px; width: 100%; max-height: 80vh;
  overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 24px; border-bottom: 2px solid #e9ecef;
  background: #f8f9fa; flex-shrink: 0;
}
.modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; color: #212529; }
.btn-close {
  background: none; border: none; font-size: 28px;
  cursor: pointer; color: #888; line-height: 1; padding: 0 4px;
  transition: color 0.15s;
}
.btn-close:hover { color: #212529; }

.modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; }

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
  margin-bottom: 16px;
}
.detail-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.detail-label { font-weight: 600; color: #495057; font-size: 13px; min-width: 100px; }
.detail-value { color: #212529; font-size: 13px; }

.params-section {
  margin: 12px 0;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.params-header,
.json-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 14px; background: #f1f3f5; cursor: pointer;
  font-weight: 500; font-size: 13px; color: #495057;
  transition: background 0.15s;
}
.params-header:hover,
.json-header:hover { background: #e9ecef; }

.toggle-icon { font-size: 12px; color: #888; }

.params-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 20px;
  padding: 10px 14px;
  background: white;
}
.param-item { display: flex; align-items: center; gap: 6px; padding: 2px 0; font-size: 13px; }
.param-key { font-weight: 500; color: #495057; min-width: 120px; }
.param-value { color: #212529; word-break: break-word; }

.duration-section {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0; font-size: 13px;
}
.duration-label { font-weight: 500; color: #495057; }
.duration-value { color: #0d6efd; font-weight: 600; }

.json-section {
  margin: 12px 0 0 0;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}
.json-body {
  padding: 12px 14px;
  background: #1a1a2e;
  max-height: 300px;
  overflow: auto;
}
.json-content {
  margin: 0; padding: 8px;
  background: transparent;
  color: #00ff9d;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

/* ============================================
   OFF-CANVAS DRAWER
   ============================================ */
.drawer-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45);
  z-index: 1000; display: flex; justify-content: flex-end;
}
.drawer-window {
  background: white; width: 90vw; max-width: 420px; height: 100%;
  display: flex; flex-direction: column;
  box-shadow: -20px 0 60px rgba(0, 0, 0, 0.25);
  overflow: hidden; margin-left: auto;
}
.drawer-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid #e9ecef; flex-shrink: 0;
}
.drawer-header h3 {
  font-size: 16px; font-weight: 600; margin: 0; color: #212529;
  display: flex; align-items: center; gap: 8px;
}
.drawer-header .drawer-icon { width: 18px; height: 18px; stroke: #212529; }
.drawer-close {
  background: none; border: none; font-size: 26px; line-height: 1;
  color: #6c757d; cursor: pointer; padding: 0 6px;
}
.drawer-close:hover { color: #212529; }
.drawer-body {
  padding: 16px 20px; overflow-y: auto; flex: 1;
  display: flex; flex-direction: column; gap: 12px;
}
.drawer-footer {
  display: flex; justify-content: space-between; gap: 8px;
  padding: 14px 20px; border-top: 1px solid #e9ecef; flex-shrink: 0;
}

.drawer-fade-enter-active,
.drawer-fade-leave-active { transition: opacity 0.2s ease; }
.drawer-fade-enter-from,
.drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active,
.drawer-slide-leave-active { transition: transform 0.25s ease; }
.drawer-slide-enter-from,
.drawer-slide-leave-to { transform: translateX(100%); }

/* ============================================
   ПЛАВНОЕ СЖАТИЕ ТАБЛИЦЫ (1401 – 1600px)
   ============================================ */
@media (max-width: 1600px) {
  .table th, .table td { padding: 10px 12px; font-size: 13.5px; }
}
@media (max-width: 1500px) {
  .table th, .table td { padding: 9px 10px; font-size: 13px; }
}
@media (max-width: 1400px) {
  .table th, .table td { padding: 8px 8px; font-size: 12.5px; }
}

/* ============================================
   ≤ 1275px — МОБИЛЬНАЯ ВЁРСТКА
   ============================================ */
@media (max-width: 1275px) {
  .logs-view { padding: 0 10px; }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 18px;
  }
  .toolbar-left {
    justify-content: flex-start;
    gap: 10px;
    flex-wrap: wrap;
  }
  .toolbar-left h2 { font-size: 20px; }
  .toolbar-left h2 .title-icon { width: 22px; height: 22px; }

  .toolbar-right {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    width: 100%;
  }
  .toolbar-right .btn {
    flex: 1 1 0;
    min-width: 0;
    height: 40px;
    padding: 4px 10px;
    font-size: 12.5px;
    justify-content: center;
    white-space: nowrap;
  }
  .toolbar-right .btn .btn-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  .toolbar-right .btn .btn-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Статистика — 2 колонки */
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 16px;
  }
  .stat-card { padding: 10px 12px; gap: 10px; }
  .stat-icon { width: 24px; height: 24px; }
  .stat-icon svg { width: 20px; height: 20px; }
  .stat-value { font-size: 16px; }
  .stat-label { font-size: 11.5px; }

  /* Drawer */
  .drawer-body .filter-group .form-control {
    height: 40px;
    font-size: 14px;
  }
  .drawer-body .date-filters {
    flex-direction: column;
    align-items: stretch;
  }
  .drawer-body .date-filters label {
    font-size: 13px;
    margin-top: 4px;
  }
  .drawer-footer { flex-direction: column; }
  .drawer-footer .btn {
    width: 100%; justify-content: center; height: 42px;
  }

  /* Модалка — bottom sheet */
  .modal-overlay { padding: 0; align-items: flex-end; }
  .modal-content {
    max-width: 100%;
    width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 92vh;
  }
  .modal-header,
  .modal-body { padding-left: 18px; padding-right: 18px; }

  .details-grid { grid-template-columns: 1fr; gap: 4px; margin-bottom: 12px; }
  .detail-item { flex-direction: column; align-items: flex-start; gap: 2px; }
  .detail-label { min-width: 0; }

  .params-grid { grid-template-columns: 1fr; }
  .param-item { flex-direction: column; align-items: flex-start; gap: 2px; padding: 4px 0; }
  .param-key { min-width: 0; }

  .json-body { max-height: 220px; }
  .json-content { font-size: 11px; }
}

@media (max-width: 480px) {
  .logs-view { padding: 0 6px; }

  .toolbar-left h2 { font-size: 18px; }
  .toolbar-left h2 .title-text {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }

  .toolbar-right .btn .btn-text { display: none; }
  .toolbar-right .btn { height: 40px; padding: 4px 8px; }
  .toolbar-right .btn .btn-icon { width: 18px; height: 18px; }

  .stats-grid { grid-template-columns: 1fr 1fr; }

  .drawer-window { width: 100vw; max-width: 100vw; }
  .drawer-body { padding: 16px 14px 20px; }

  .modal-header h3 { font-size: 16px; }
}
</style>