<template>
  <!-- ТРИГГЕР (только десктоп) -->
  <div
    class="sidebar-trigger"
    @mouseenter="showSidebar"
  ></div>

  <aside
    class="sidebar"
    :class="{ 'sidebar-hidden': !sidebarVisible }"
    @mouseenter="showSidebar"
    @mouseleave="hideSidebar"
  >
    <!-- ============================== -->
    <!-- ДЕСКТОП                         -->
    <!-- ============================== -->
    <template v-if="!isMobile">
      <div class="logo">
        <router-link to="/" exact-active-class="active" class="logo-link">
          <IconLogo />
        </router-link>
      </div>

      <nav class="nav">
        <router-link to="/" class="nav-link" exact-active-class="active">
          <span class="icon"><IconDashboard /></span>
          <span class="nav-text">Дашборд</span>
        </router-link>

        <router-link to="/equipment" class="nav-link" active-class="active">
          <span class="icon"><IconEquipment /></span>
          <span class="nav-text">Оборудование</span>
        </router-link>

        <router-link to="/repairs" class="nav-link" active-class="active">
          <span class="icon"><IconRepairs /></span>
          <span class="nav-text">Неисправности</span>
        </router-link>

        <router-link to="/lessons" class="nav-link" active-class="active">
          <span class="icon"><IconLessons /></span>
          <span class="nav-text">Занятия</span>
        </router-link>

        <router-link to="/templates" class="nav-link" active-class="active">
          <span class="icon"><IconTemplates /></span>
          <span class="nav-text">Шаблоны</span>
        </router-link>

        <router-link to="/analytics" class="nav-link" active-class="active">
          <span class="icon"><IconAnalytics /></span>
          <span class="nav-text">Аналитика</span>
        </router-link>

        <router-link
          v-if="authStore.isAdmin"
          to="/logs"
          class="nav-link"
          active-class="active"
        >
          <span class="icon"><IconLogs /></span>
          <span class="nav-text">Журнал</span>
        </router-link>

        <router-link
          v-if="authStore.isAdmin"
          to="/users"
          class="nav-link"
          active-class="active"
        >
          <span class="icon"><IconUser /></span>
          <span class="nav-text">Пользователи</span>
        </router-link>
      </nav>

      <div class="user">
        <div class="avatar"><IconUser /></div>
        <div class="user-info">
          <div class="name" :title="authStore.user?.name || 'Пользователь'">
            {{ truncate(authStore.user?.name || 'Пользователь', 18) }}
          </div>
          <div class="role" :title="authStore.user?.email || 'email@example.com'">
            {{ truncate(authStore.user?.email || 'email@example.com', 22) }}
          </div>
          <div class="role-badge">{{ roleLabel }}</div>
        </div>
        <div class="user-actions">
          <router-link
            v-if="authStore.isAdmin"
            to="/users"
            class="icon-btn"
            title="Создать пользователя"
          >
            <IconPlus />
          </router-link>
          <button
            class="icon-btn"
            @click="handleLogout"
            :disabled="loggingOut"
            title="Выйти"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </template>

    <!-- ============================== -->
    <!-- МОБИЛКА — НИЖНЯЯ ПАНЕЛЬ         -->
    <!-- ============================== -->
    <template v-else>
      <nav class="bottom-bar">
        <router-link to="/equipment" class="bottom-link" active-class="active">
          <span class="icon"><IconEquipment /></span>
          <span class="nav-text">Оборудование</span>
        </router-link>

        <router-link to="/templates" class="bottom-link" active-class="active">
          <span class="icon"><IconTemplates /></span>
          <span class="nav-text">Шаблоны</span>
        </router-link>

        <router-link to="/lessons" class="bottom-link" active-class="active">
          <span class="icon"><IconLessons /></span>
          <span class="nav-text">Занятия</span>
        </router-link>

        <button
          class="bottom-link more-btn"
          :class="{ active: moreOpen }"
          @click="openMore"
          type="button"
        >
          <span class="icon"><IconMore /></span>
          <span class="nav-text">Ещё</span>
        </button>
      </nav>
    </template>
  </aside>

  <!-- ============================== -->
  <!-- ДИАЛОГОВОЕ ОКНО "ЕЩЁ"           -->
  <!-- ============================== -->
  <SidebarMoreModal
    :open="moreOpen"
    :logging-out="loggingOut"
    @close="closeMore"
    @logout="handleLogout"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import { useUiStore } from '../../stores/ui.store';
import IconLogo from '../icons/IconLogo.vue';
import SidebarMoreModal from '../sidebar/SidebarMoreModal.vue';
import {
  IconDashboard,
  IconEquipment,
  IconRepairs,
  IconTemplates,
  IconLessons,
  IconAnalytics,
  IconLogs,
  IconUser,
  IconPlus,
  IconLogout,
  IconMore
} from '../icons';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const uiStore = useUiStore();

const loggingOut = ref(false);
const moreOpen = ref(false);
const isMobile = ref(window.innerWidth <= 768);

const sidebarVisible = computed(() => uiStore.sidebar.visible);

const showSidebar = () => uiStore.showSidebar();
const hideSidebar = () => uiStore.hideSidebar();
const toggleSidebar = () => uiStore.toggleSidebar();

const openMore = () => { moreOpen.value = true; };
const closeMore = () => { moreOpen.value = false; };

const roleLabel = computed(() => {
  const labels = {
    admin: 'Администратор',
    methodist: 'Методист',
    lab_assistant: 'Лаборант',
    technician: 'Техник'
  };
  return labels[authStore.role] || '';
});

const truncate = (str, max) => {
  if (!str) return '';
  return str.length <= max ? str : str.slice(0, max) + '...';
};

const handleLogout = async () => {
  if (loggingOut.value) return;
  loggingOut.value = true;
  try {
    await authStore.logout();
  } catch (e) {
    console.error('❌ [Sidebar] Ошибка logout:', e);
  } finally {
    loggingOut.value = false;
    closeMore();
    router.push('/login');
  }
};

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
  if (!isMobile.value) closeMore();
};

// Закрываем модалку при смене маршрута
watch(() => route.fullPath, () => { moreOpen.value = false; });

const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    if (moreOpen.value) {
      e.preventDefault();
      closeMore();
    } else if (!isMobile.value) {
      e.preventDefault();
      toggleSidebar();
    }
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);
  if (isMobile.value) uiStore.showSidebar();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
/* ============================================
   ТРИГГЕР (десктоп)
   ============================================ */
.sidebar-trigger {
  position: fixed;
  top: 0;
  left: 0;
  width: 16px;
  height: 100vh;
  z-index: 999;
  cursor: pointer;
  background: transparent;
  transition: background 0.2s;
}
.sidebar-trigger:hover { background: rgba(13, 110, 253, 0.08); }

/* ============================================
   САЙДБАР (десктоп)
   ============================================ */
.sidebar {
  width: 260px;
  min-height: 100vh;
  background: linear-gradient(180deg, #1565c0 0%, #0d47a1 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  flex-shrink: 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(0);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;
  z-index: 10;
}
.sidebar-hidden {
  width: 0;
  padding: 0;
  min-height: 0;
  overflow: hidden;
  box-shadow: none;
  transform: translateX(-100%);
}

/* Лого */
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 0 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  margin-bottom: 20px;
}
.logo-link { display: block; width: 100%; text-decoration: none; }

/* Навигация */
.nav { flex: 1; display: flex; flex-direction: column; gap: 2px; }

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
}
.nav-link:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
.nav-link.active {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.nav-link .icon {
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.nav-link .icon :deep(svg) { stroke: currentColor; width: 20px; height: 20px; }
.nav-link.active .icon :deep(svg) { stroke-width: 2.5px; }

/* Пользователь */
.user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  margin-top: auto;
  min-height: 60px;
}
.avatar {
  width: 40px; height: 40px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: #fff;
}
.avatar :deep(svg) { stroke: #fff; width: 20px; height: 20px; }

.user-info { flex: 1; min-width: 0; overflow: hidden; }
.name {
  font-size: 14px; font-weight: 600; color: #fff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 120px;
}
.role {
  font-size: 12px; color: rgba(255, 255, 255, 0.7);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 120px;
}
.role-badge {
  font-size: 10px; color: rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 6px; border-radius: 6px;
  display: inline-block; margin-top: 2px;
  text-transform: uppercase; letter-spacing: 0.3px;
}
.user-actions { display: flex; gap: 4px; flex-shrink: 0; align-items: center; }

.icon-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: rgba(255, 255, 255, 0.6);
  width: 32px; height: 32px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
  text-decoration: none;
}
.icon-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.2); color: #fff; }
.icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.icon-btn :deep(svg) { stroke: currentColor; width: 18px; height: 18px; }

/* Скрываем нижнюю панель на десктопе */
.bottom-bar { display: none; }

/* ============================================
   📱 МОБИЛЬНАЯ ВЕРСИЯ
   ============================================ */
@media (max-width: 768px) {
  .sidebar-trigger { display: none; }

  .sidebar {
    position: fixed;
    bottom: 0; left: 0; right: 0; top: auto;
    width: 100%;
    min-height: 0;
    height: 64px;
    padding: 0;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    transform: none;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.2);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 1000;
    overflow: hidden;
  }
  .sidebar-hidden {
    width: 100%;
    height: 64px;
    padding: 0;
    transform: none;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }

  .bottom-bar {
    display: flex;
    flex-direction: row;
    flex: 1;
    height: 100%;
    align-items: center;
    justify-content: space-around;
    width: 100%;
  }

  .bottom-link {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 2px;
    padding: 6px 2px;
    height: 100%;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: inherit;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    font-size: 10px;
    font-weight: 500;
    text-align: center;
    line-height: 1.1;
    position: relative;
    transition: background 0.2s, color 0.2s;
    min-width: 0;
  }
  .bottom-link:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
  .bottom-link.active { background: rgba(255, 255, 255, 0.12); color: #fff; }
  .bottom-link.active::before {
    content: '';
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 24px; height: 3px;
    background: #fff;
    border-radius: 0 0 3px 3px;
  }
  .bottom-link .icon {
    width: 22px; height: 22px;
    display: flex; align-items: center; justify-content: center;
  }
  .bottom-link .icon :deep(svg) { stroke: currentColor; width: 20px; height: 20px; }
  .bottom-link.active .icon :deep(svg) { stroke-width: 2.5px; }
  .bottom-link .nav-text {
    font-size: 10px;
    line-height: 1.1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
}

/* ============================================
   📱 ОЧЕНЬ УЗКИЕ ЭКРАНЫ
   ============================================ */
@media (max-width: 480px) {
  .sidebar,
  .sidebar-hidden { height: 58px; }

  .bottom-link { font-size: 9px; padding: 4px 1px; }
  .bottom-link .icon { width: 20px; height: 20px; }
  .bottom-link .icon :deep(svg) { width: 18px; height: 18px; }
  .bottom-link .nav-text { font-size: 9px; }
  .bottom-link.active::before { width: 20px; height: 2px; }
}

/* ============================================
   БЕЗОПАСНАЯ ЗОНА iPhone (notch)
   ============================================ */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  @media (max-width: 768px) {
    .sidebar {
      height: calc(64px + env(safe-area-inset-bottom));
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
}
</style>