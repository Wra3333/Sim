<template>
  <transition name="modal">
    <div
      v-if="open"
      class="modal-overlay"
      @click.self="$emit('close')"
    >
      <div class="modal">
        <div class="modal-header">
          <span>Меню</span>
          <button class="modal-close" @click="$emit('close')" title="Закрыть">
            <IconClose />
          </button>
        </div>

        <div class="modal-list">
          <router-link
            to="/"
            class="modal-item"
            exact-active-class="active"
            @click="$emit('close')"
          >
            <span class="icon"><IconDashboard /></span>
            <span>Дашборд</span>
          </router-link>
        <router-link
            to="/repairs"
            class="modal-item"
            exact-active-class="active"
            @click="$emit('close')"
          >
            <span class="icon"><IconRepairs /></span>
            <span>Неисправности</span>
          </router-link>

          <router-link
            to="/analytics"
            class="modal-item"
            active-class="active"
            @click="$emit('close')"
          >
            <span class="icon"><IconAnalytics /></span>
            <span>Аналитика</span>
          </router-link>

          <router-link
            v-if="authStore.isAdmin"
            to="/logs"
            class="modal-item"
            active-class="active"
            @click="$emit('close')"
          >
            <span class="icon"><IconLogs /></span>
            <span>Журнал</span>
          </router-link>

          <router-link
            v-if="authStore.isAdmin"
            to="/users"
            class="modal-item"
            active-class="active"
            @click="$emit('close')"
          >
            <span class="icon"><IconUser /></span>
            <span>Пользователи</span>
          </router-link>
        </div>

        <div class="modal-user">
          <div class="modal-user-info">
            <div class="modal-avatar"><IconUser /></div>
            <div class="modal-user-text">
              <div class="modal-name">{{ authStore.user?.name || 'Пользователь' }}</div>
              <div class="modal-role">{{ roleLabel }}</div>
            </div>
          </div>
          <button
            class="modal-logout"
            @click="$emit('logout')"
            :disabled="loggingOut"
          >
            <IconLogout />
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../../stores/auth.store';
import {
  IconDashboard,
  IconAnalytics,
  IconRepairs,
  IconLogs,
  IconUser,
  IconLogout,
  IconClose
} from '../icons';

defineProps({
  open: { type: Boolean, default: false },
  loggingOut: { type: Boolean, default: false }
});
defineEmits(['close', 'logout']);

const authStore = useAuthStore();

const roleLabel = computed(() => {
  const labels = {
    admin: 'Администратор',
    methodist: 'Методист',
    lab_assistant: 'Лаборант',
    technician: 'Техник'
  };
  return labels[authStore.role] || '';
});
</script>

<style scoped>
/* По умолчанию (десктоп) — скрыто */
.modal-overlay {
  display: none;
}

@media (max-width: 768px) {
  .modal-overlay {
    display: flex;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1200;
    align-items: center;
    justify-content: center;
    padding: 16px;
    box-sizing: border-box;
  }

  .modal {
    width: 100%;
    max-width: 400px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    padding: 8px 0 12px;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    animation: modalIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: block;
    position: relative;
    height: auto;
  }

  @keyframes modalIn {
    from { transform: scale(0.92); opacity: 0.5; }
    to   { transform: scale(1);    opacity: 1; }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px 12px;
    font-size: 15px;
    font-weight: 700;
    color: #0d47a1;
    border-bottom: 1px solid #eef2f7;
  }

  .modal-close {
    background: #f1f5f9;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #475569;
    padding: 0;
  }
  .modal-close:hover { background: #e2e8f0; }
  .modal-close :deep(svg) { stroke: currentColor; width: 16px; height: 16px; }

  .modal-list {
    display: flex;
    flex-direction: column;
    padding: 6px 8px;
  }

  .modal-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 12px;
    border-radius: 12px;
    text-decoration: none;
    color: #1e293b;
    font-size: 15px;
    font-weight: 500;
    transition: background 0.15s;
  }
  .modal-item:hover { background: #f1f5f9; }
  .modal-item.active { background: #e8f0fe; color: #0d47a1; }

  .modal-item .icon {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1565c0;
    flex-shrink: 0;
  }
  .modal-item .icon :deep(svg) { stroke: currentColor; width: 20px; height: 20px; }

  .modal-user {
    margin-top: 8px;
    padding: 12px 16px 4px;
    border-top: 1px solid #eef2f7;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .modal-user-info { display: flex; align-items: center; gap: 12px; }

  .modal-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e8f0fe;
    color: #1565c0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal-avatar :deep(svg) { stroke: #1565c0; width: 20px; height: 20px; }

  .modal-name { font-size: 14px; font-weight: 600; color: #1e293b; }
  .modal-role { font-size: 12px; color: #64748b; margin-top: 2px; }

  .modal-logout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #fee2e2;
    color: #b91c1c;
    border: none;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    width: 100%;
  }
  .modal-logout:hover:not(:disabled) { background: #fecaca; }
  .modal-logout:disabled { opacity: 0.6; cursor: not-allowed; }
  .modal-logout :deep(svg) { stroke: currentColor; width: 16px; height: 16px; }

  /* Анимация закрытия */
  .modal-leave-active { transition: opacity 0.2s ease; }
  .modal-leave-to { opacity: 0; }
  .modal-leave-active .modal {
    transition: transform 0.2s ease;
    transform: scale(0.92);
  }
}
</style>