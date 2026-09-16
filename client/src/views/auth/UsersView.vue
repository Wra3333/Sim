<template>
  <div class="users-view">
    <!-- ============================================
         TOOLBAR
         ============================================ -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>
          <IconUser class="title-icon" />
          Пользователи
        </h2>
        <span class="count">Всего: {{ total }}</span>
        <span class="count" style="margin-left: 16px; color: #0d6efd;">
          На странице: {{ users.length }}
        </span>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-outline-secondary btn-sm" @click="loadUsers">
          <IconRefresh class="btn-icon" />
          Обновить
        </button>
        <button class="btn btn-primary btn-sm" @click="openCreate">
          <IconPlus class="btn-icon" />
          Создать пользователя
        </button>
      </div>
    </div>

    <!-- ============================================
         ФИЛЬТРЫ
         ============================================ -->
    <div class="filters">
      <div class="filter-group">
        <label>Роль</label>
        <select v-model="filters.role" class="form-control">
          <option value="">Все роли</option>
          <option value="admin">Администратор</option>
          <option value="methodist">Методист</option>
          <option value="lab_assistant">Лаборант</option>
          <option value="technician">Техник</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Активность</label>
        <select v-model="filters.is_active" class="form-control">
          <option value="">Все</option>
          <option :value="true">Активные</option>
          <option :value="false">Заблокированные</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Поиск</label>
        <input
          v-model="filters.search"
          type="text"
          class="form-control"
          placeholder="Email или имя"
          @keyup.enter="applyFilters"
        />
      </div>

      <div class="filter-group actions">
        <button class="btn btn-outline-secondary" @click="resetFilters">
          <IconReset class="btn-icon" />
          Сбросить
        </button>
        <button class="btn btn-primary" @click="applyFilters">
          <IconSearch class="btn-icon" />
          Применить
        </button>
      </div>
    </div>

    <!-- ============================================
         ТАБЛИЦА
         ============================================ -->
    <div class="table-container">
      <div v-if="loading" class="loading-state">
        <IconLoading class="loading-icon" />
        Загрузка...
      </div>

      <table v-else class="users-table">
        <thead>
          <tr>
            <th style="width: 60px;">ID</th>
            <th style="min-width: 200px;">Email</th>
            <th style="min-width: 180px;">Имя</th>
            <th style="width: 140px;">Роль</th>
            <th style="width: 110px;">Статус</th>
            <th style="min-width: 150px;">Последний вход</th>
            <th style="width: 200px;">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="users.length === 0">
            <td colspan="7" class="empty-row">Нет пользователей</td>
          </tr>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>
              <div class="email-cell">
                <span class="email">{{ user.email }}</span>
                <span v-if="user.id === currentUserId" class="self-badge">это вы</span>
              </div>
            </td>
            <td>{{ user.name }}</td>
            <td>
              <span class="badge" :class="'badge-' + user.role">
                {{ getRoleLabel(user.role) }}
              </span>
            </td>
            <td>
              <span class="badge" :class="user.is_active ? 'badge-success' : 'badge-secondary'">
                {{ user.is_active ? 'Активен' : 'Заблокирован' }}
              </span>
            </td>
            <td>
              <div v-if="user.last_login" class="date-cell">
                <div class="date">{{ formatDate(user.last_login) }}</div>
                <div class="time">{{ formatTime(user.last_login) }}</div>
              </div>
              <span v-else class="text-muted">Никогда</span>
            </td>
            <td>
              <div class="actions-cell">
                <button
                  class="btn-icon-action"
                  title="Редактировать"
                  @click="openEdit(user)"
                >
                  <IconEdit />
                </button>

                <button
                  class="btn-icon-action"
                  title="Сбросить пароль"
                  @click="openResetPassword(user)"
                >
                  <IconLock />
                </button>

                <button
                  class="btn-icon-action"
                  :class="user.is_active ? 'warn' : 'success'"
                  :title="user.is_active ? 'Заблокировать' : 'Активировать'"
                  :disabled="user.id === currentUserId"
                  @click="toggleActive(user)"
                >
                  <IconClose v-if="user.is_active" />
                  <IconCheck v-else />
                </button>

                <button
                  class="btn-icon-action danger"
                  title="Удалить"
                  :disabled="user.id === currentUserId"
                  @click="confirmDelete(user)"
                >
                  <IconTrash />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ============================================
         ПАГИНАЦИЯ
         ============================================ -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        class="page-btn"
        :disabled="page <= 1"
        @click="goToPage(page - 1)"
      >
        ← Назад
      </button>
      <span class="page-info">
        Страница {{ page }} из {{ totalPages }}
      </span>
      <button
        class="page-btn"
        :disabled="page >= totalPages"
        @click="goToPage(page + 1)"
      >
        Вперёд →
      </button>
    </div>

    <!-- ============================================
         МОДАЛКА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ
         ============================================ -->
    <Teleport to="body">
      <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ modalMode === 'create' ? 'Создать пользователя' : 'Редактировать пользователя' }}</h3>
            <button class="btn-close" @click="closeModal">×</button>
          </div>

          <div class="modal-body">
            <div v-if="modalError" class="error-message">
              {{ modalError }}
            </div>

            <div class="form-group">
              <label>Email *</label>
              <input
                v-model="form.email"
                type="email"
                class="form-control"
                placeholder="user@example.com"
              />
            </div>

            <div v-if="modalMode === 'create'" class="form-group">
              <label>Пароль *</label>
              <input
                v-model="form.password"
                type="password"
                class="form-control"
                placeholder="Минимум 6 символов"
              />
            </div>

            <div class="form-group">
              <label>Имя *</label>
              <input
                v-model="form.name"
                type="text"
                class="form-control"
                placeholder="Иван Иванов"
              />
            </div>

            <div class="form-group">
              <label>Роль *</label>
              <select v-model="form.role" class="form-control">
                <option value="admin">Администратор</option>
                <option value="methodist">Методист</option>
                <option value="lab_assistant">Лаборант</option>
                <option value="technician">Техник</option>
              </select>
            </div>

            <div v-if="modalMode === 'edit'" class="form-group">
              <label class="checkbox-label">
                <input v-model="form.is_active" type="checkbox" />
                Активен
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" @click="closeModal">
              Отмена
            </button>
            <button
              class="btn btn-primary"
              :disabled="modalSaving"
              @click="saveUser"
            >
              {{ modalSaving ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ============================================
         МОДАЛКА СБРОСА ПАРОЛЯ
         ============================================ -->
    <Teleport to="body">
      <div v-if="resetModalOpen" class="modal-overlay" @click.self="closeResetModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Сбросить пароль</h3>
            <button class="btn-close" @click="closeResetModal">×</button>
          </div>

          <div class="modal-body">
            <p class="modal-description">
              Пользователь: <strong>{{ resetUser?.email }}</strong>
            </p>

            <div v-if="resetError" class="error-message">
              {{ resetError }}
            </div>

            <div class="form-group">
              <label>Новый пароль *</label>
              <input
                v-model="newPassword"
                type="password"
                class="form-control"
                placeholder="Минимум 6 символов"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" @click="closeResetModal">
              Отмена
            </button>
            <button
              class="btn btn-primary"
              :disabled="resetSaving"
              @click="saveResetPassword"
            >
              {{ resetSaving ? 'Сохранение...' : 'Сбросить' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ============================================
         МОДАЛКА ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ
         ============================================ -->
    <Teleport to="body">
      <div v-if="deleteModalOpen" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-content modal-confirm">
          <div class="modal-header">
            <h3>Удаление пользователя</h3>
            <button class="btn-close" @click="closeDeleteModal">×</button>
          </div>

          <div class="modal-body">
            <p>
              Вы уверены, что хотите удалить пользователя
              <strong>{{ deleteUser?.email }}</strong>?
            </p>
            <p class="warning-text">Это действие нельзя отменить!</p>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline-secondary" @click="closeDeleteModal">
              Отмена
            </button>
            <button
              class="btn btn-danger"
              :disabled="deleteSaving"
              @click="confirmDeleteUser"
            >
              {{ deleteSaving ? 'Удаление...' : 'Удалить' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth.store';
import { useToastStore } from '../../stores/toastStore';
import { authApi } from '../../api';
import { useFormatters } from '../../composables/useFormatters';
import {
  IconUser,
  IconPlus,
  IconRefresh,
  IconReset,
  IconSearch,
  IconEdit,
  IconLock,
  IconTrash,
  IconCheck,
  IconClose,
  IconLoading
} from '../../components/icons';

// ============================================
//  STORES
// ============================================
const authStore = useAuthStore();
const toast = useToastStore();
const { formatDate, formatTime } = useFormatters();

// ============================================
//  СОСТОЯНИЕ
// ============================================
const users = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = 20;
const loading = ref(false);

const currentUserId = computed(() => authStore.user?.id || null);

// ============================================
//  ФИЛЬТРЫ
// ============================================
const filters = ref({
  role: '',
  is_active: '',
  search: ''
});

// ============================================
//  МОДАЛКА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ
// ============================================
const modalOpen = ref(false);
const modalMode = ref('create');
const modalError = ref('');
const modalSaving = ref(false);
const editingId = ref(null);

const form = ref({
  email: '',
  password: '',
  name: '',
  role: 'lab_assistant',
  is_active: true
});

// ============================================
//  МОДАЛКА СБРОСА ПАРОЛЯ
// ============================================
const resetModalOpen = ref(false);
const resetUser = ref(null);
const newPassword = ref('');
const resetError = ref('');
const resetSaving = ref(false);

// ============================================
//  МОДАЛКА УДАЛЕНИЯ
// ============================================
const deleteModalOpen = ref(false);
const deleteUser = ref(null);
const deleteSaving = ref(false);

// ============================================
//  ПАГИНАЦИЯ
// ============================================
const totalPages = computed(() => Math.ceil(total.value / pageSize) || 1);

// ============================================
//  ЗАГРУЗКА
// ============================================
const loadUsers = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      limit: pageSize
    };

    if (filters.value.role) params.role = filters.value.role;
    if (filters.value.is_active !== '' && filters.value.is_active !== null) {
      params.is_active = filters.value.is_active;
    }
    if (filters.value.search) params.search = filters.value.search;

    const response = await authApi.getUsers(params);
    users.value = response.data.users || [];
    total.value = response.data.total || 0;
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
    toast.error(error.response?.data?.message || 'Ошибка загрузки пользователей');
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  page.value = 1;
  loadUsers();
};

const resetFilters = () => {
  filters.value = { role: '', is_active: '', search: '' };
  page.value = 1;
  loadUsers();
};

const goToPage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
  loadUsers();
};

// ============================================
//  СОЗДАНИЕ / РЕДАКТИРОВАНИЕ
// ============================================
const openCreate = () => {
  modalMode.value = 'create';
  editingId.value = null;
  form.value = {
    email: '',
    password: '',
    name: '',
    role: 'lab_assistant',
    is_active: true
  };
  modalError.value = '';
  modalOpen.value = true;
};

const openEdit = (user) => {
  modalMode.value = 'edit';
  editingId.value = user.id;
  form.value = {
    email: user.email,
    password: '',
    name: user.name,
    role: user.role,
    is_active: user.is_active
  };
  modalError.value = '';
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
  modalError.value = '';
};

const saveUser = async () => {
  modalError.value = '';

  if (!form.value.email || !form.value.name || !form.value.role) {
    modalError.value = 'Заполните все обязательные поля';
    return;
  }

  if (modalMode.value === 'create' && !form.value.password) {
    modalError.value = 'Пароль обязателен';
    return;
  }

  if (form.value.password && form.value.password.length < 6) {
    modalError.value = 'Пароль должен содержать минимум 6 символов';
    return;
  }

  modalSaving.value = true;

  try {
    if (modalMode.value === 'create') {
      await authApi.register({
        email: form.value.email,
        password: form.value.password,
        name: form.value.name,
        role: form.value.role
      });
      toast.success('Пользователь создан');
    } else {
      await authApi.updateUser(editingId.value, {
        email: form.value.email,
        name: form.value.name,
        role: form.value.role,
        is_active: form.value.is_active
      });
      toast.success('Пользователь обновлён');
    }

    closeModal();
    await loadUsers();
  } catch (error) {
    modalError.value = error.response?.data?.message || 'Ошибка сохранения';
    toast.error(modalError.value);
  } finally {
    modalSaving.value = false;
  }
};

// ============================================
//  СБРОС ПАРОЛЯ
// ============================================
const openResetPassword = (user) => {
  resetUser.value = user;
  newPassword.value = '';
  resetError.value = '';
  resetModalOpen.value = true;
};

const closeResetModal = () => {
  resetModalOpen.value = false;
  resetUser.value = null;
  newPassword.value = '';
  resetError.value = '';
};

const saveResetPassword = async () => {
  resetError.value = '';

  if (!newPassword.value) {
    resetError.value = 'Введите новый пароль';
    return;
  }

  if (newPassword.value.length < 6) {
    resetError.value = 'Пароль должен содержать минимум 6 символов';
    return;
  }

  resetSaving.value = true;

  try {
    await authApi.resetPassword(resetUser.value.id, {
      newPassword: newPassword.value
    });
    toast.success('Пароль сброшен');
    closeResetModal();
  } catch (error) {
    resetError.value = error.response?.data?.message || 'Ошибка сброса пароля';
    toast.error(resetError.value);
  } finally {
    resetSaving.value = false;
  }
};

// ============================================
//  БЛОКИРОВКА / АКТИВАЦИЯ
// ============================================
const toggleActive = async (user) => {
  try {
    await authApi.toggleActive(user.id);
    toast.success(user.is_active ? 'Пользователь заблокирован' : 'Пользователь активирован');
    await loadUsers();
  } catch (error) {
    toast.error(error.response?.data?.message || 'Ошибка изменения статуса');
  }
};

// ============================================
//  УДАЛЕНИЕ
// ============================================
const confirmDelete = (user) => {
  deleteUser.value = user;
  deleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  deleteModalOpen.value = false;
  deleteUser.value = null;
};

const confirmDeleteUser = async () => {
  deleteSaving.value = true;
  try {
    await authApi.deleteUser(deleteUser.value.id);
    toast.success('Пользователь удалён');
    closeDeleteModal();
    await loadUsers();
  } catch (error) {
    toast.error(error.response?.data?.message || 'Ошибка удаления');
  } finally {
    deleteSaving.value = false;
  }
};

// ============================================
//  ВСПОМОГАТЕЛЬНЫЕ
// ============================================
const getRoleLabel = (role) => {
  const labels = {
    admin: 'Администратор',
    methodist: 'Методист',
    lab_assistant: 'Лаборант',
    technician: 'Техник'
  };
  return labels[role] || role;
};

// ============================================
//  LIFECYCLE
// ============================================
onMounted(loadUsers);
</script>

<style scoped>
.users-view {
  padding: 0;
}

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
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
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
}

.filter-group .form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.filter-group.actions {
  flex-direction: row;
  align-items: flex-end;
  gap: 8px;
  flex: 0 0 auto;
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
  white-space: nowrap;
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

.btn-primary:hover:not(:disabled) {
  background: #0b5ed7;
  border-color: #0a58ca;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.btn-danger {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.btn-danger:hover:not(:disabled) {
  background: #bb2d3b;
  border-color: #b02a37;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 13px;
}

/* ============================================
   ТАБЛИЦА
   ============================================ */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  border: 1px solid #e9ecef;
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.users-table thead {
  background: #f8f9fa;
}

.users-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.users-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

.users-table tbody tr:hover {
  background: #f8f9fa;
}

.empty-row {
  text-align: center;
  color: #888;
  padding: 40px 16px !important;
}

/* ============================================
   ЯЧЕЙКИ
   ============================================ */
.email-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.email-cell .email {
  color: #212529;
  font-weight: 500;
}

.self-badge {
  font-size: 10px;
  background: #cfe2ff;
  color: #084298;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.date-cell .date {
  font-size: 13px;
  color: #212529;
}

.date-cell .time {
  font-size: 12px;
  color: #888;
}

.text-muted {
  color: #888;
  font-size: 13px;
}

/* ============================================
   БЕЙДЖИ
   ============================================ */
.badge {
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
  white-space: nowrap;
}

.badge-admin { background: #f8d7da; color: #721c24; }
.badge-methodist { background: #cfe2ff; color: #084298; }
.badge-lab_assistant { background: #d1e7dd; color: #0f5132; }
.badge-technician { background: #fff3cd; color: #664d03; }

.badge-success { background: #d1e7dd; color: #0f5132; }
.badge-secondary { background: #e2e3e5; color: #383d41; }

/* ============================================
   ДЕЙСТВИЯ (ИКОНКИ)
   ============================================ */
.actions-cell {
  display: flex;
  gap: 4px;
  align-items: center;
}

.btn-icon-action {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #6c757d;
}

.btn-icon-action:hover:not(:disabled) {
  background: #f1f3f5;
  border-color: #dee2e6;
  color: #212529;
}

.btn-icon-action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-icon-action.warn:hover:not(:disabled) {
  background: #fff3cd;
  color: #856404;
}

.btn-icon-action.success:hover:not(:disabled) {
  background: #d1e7dd;
  color: #0f5132;
}

.btn-icon-action.danger:hover:not(:disabled) {
  background: #f8d7da;
  color: #721c24;
}

.btn-icon-action :deep(svg) {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

/* ============================================
   ПАГИНАЦИЯ
   ============================================ */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.page-btn {
  padding: 6px 16px;
  border: 1px solid #ced4da;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #495057;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #6c757d;
}

/* ============================================
   ЗАГРУЗКА
   ============================================ */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #888;
  font-size: 14px;
  gap: 8px;
}

.loading-icon {
  width: 20px;
  height: 20px;
  stroke: #888;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============================================
   МОДАЛКИ
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
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content.modal-confirm {
  max-width: 440px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
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
}

.modal-description {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #495057;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

/* ============================================
   ФОРМА
   ============================================ */
.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #495057;
  margin-bottom: 6px;
}

.form-group .form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.form-group .form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* ============================================
   ОШИБКИ
   ============================================ */
.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 13px;
  border: 1px solid #f5c6cb;
}

.warning-text {
  color: #dc3545;
  font-weight: 500;
  margin-top: 8px;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-right {
    width: 100%;
  }

  .toolbar-right .btn {
    flex: 1;
    justify-content: center;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: 100%;
  }

  .filter-group.actions {
    flex-direction: row;
    width: 100%;
  }

  .filter-group.actions .btn {
    flex: 1;
    justify-content: center;
  }

  .users-table {
    font-size: 13px;
  }

  .users-table th,
  .users-table td {
    padding: 8px 10px;
  }

  .actions-cell {
    flex-wrap: wrap;
  }
}
</style>