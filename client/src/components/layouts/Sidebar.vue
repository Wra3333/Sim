<template>
  <!-- ТРИГГЕР -->
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
      
      <router-link to="/templates" class="nav-link" active-class="active">
        <span class="icon"><IconTemplates /></span>
        <span class="nav-text">Шаблоны</span>
      </router-link>
      
      <router-link to="/lessons" class="nav-link" active-class="active">
        <span class="icon"><IconLessons /></span>
        <span class="nav-text">Занятия</span>
      </router-link>
      
      <router-link to="/analytics" class="nav-link" active-class="active">
        <span class="icon"><IconAnalytics /></span>
        <span class="nav-text">Аналитика</span>
      </router-link>
      
      <router-link to="/logs" class="nav-link" active-class="active">
        <span class="icon"><IconLogs /></span>
        <span class="nav-text">Журнал</span>
      </router-link>
    </nav>

    <div class="user">
      <div class="avatar"><IconUser /></div>
      <div class="user-info">
        <div class="name" :title="authStore.user?.name || 'Пользователь'">
          {{ truncateName(authStore.user?.name || 'Пользователь', 18) }}
        </div>
        <div class="role" :title="authStore.user?.email || 'email@example.com'">
          {{ truncateEmail(authStore.user?.email || 'email@example.com', 22) }}
        </div>
      </div>
      <div class="user-actions">
        <router-link to="/register" class="add-user-btn" title="Создать пользователя">
          <IconPlus />
        </router-link>
        <button 
          class="logout-btn" 
          @click="handleLogout" 
          :disabled="loggingOut"
          title="Выйти"
        >
          <IconLogout />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../../stores/auth.store';
import { useRouter } from 'vue-router';
import { useAppStore } from '../../stores/appStore';
import IconLogo from '../icons/IconLogo.vue';
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
  IconLogout
} from '../icons';

const authStore = useAuthStore();
const router = useRouter();
const appStore = useAppStore();

const loggingOut = ref(false);

const sidebarVisible = computed(() => appStore.sidebar.visible);

const showSidebar = () => appStore.showSidebar();
const hideSidebar = () => appStore.hideSidebar();
const toggleSidebar = () => appStore.toggleSidebar();

// ============================================
//  ВЫХОД
// ============================================
const handleLogout = async () => {
  if (loggingOut.value) return;
  
  loggingOut.value = true;
  console.log('🚪 [Sidebar] handleLogout вызван');
  
  try {
    await authStore.logout();
    console.log('✅ [Sidebar] logout выполнен, редирект на /login');
  } catch (e) {
    console.error('❌ [Sidebar] Ошибка logout:', e);
  } finally {
    loggingOut.value = false;
    // ✅ Редирект в любом случае
    router.push('/login');
  }
};

const truncateName = (name, maxLength) => {
  if (!name) return 'Пользователь';
  if (name.length <= maxLength) return name;
  return name.substring(0, maxLength) + '...';
};

const truncateEmail = (email, maxLength) => {
  if (!email) return 'email@example.com';
  if (email.length <= maxLength) return email;
  return email.substring(0, maxLength) + '...';
};

// ============================================
//  ХОТКЕЙ: ESCAPE
// ============================================
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    toggleSidebar();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
/* ============================================
   ТРИГГЕР
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

.sidebar-trigger:hover {
  background: rgba(13, 110, 253, 0.08);
}

/* ============================================
   САЙДБАР
   ============================================ */
.sidebar {
  width: 260px;
  min-height: 100vh;
  background: linear-gradient(180deg, #1565c0 0%, #0d47a1 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  flex-shrink: 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(0);
  will-change: transform;
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

/* ============================================
   ЛОГО
   ============================================ */
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 0 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  margin-bottom: 20px;
}

.logo-link {
  display: block;
  width: 100%;
  text-decoration: none;
}

.sidebar-hidden .logo {
  display: none;
}

/* ============================================
   НАВИГАЦИЯ
   ============================================ */
.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  transition: all 0.2s;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.nav-link.active {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-link .icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-link .icon :deep(svg) {
  stroke: currentColor;
  width: 20px;
  height: 20px;
}

.nav-link.active .icon :deep(svg) {
  stroke-width: 2.5px;
}

.sidebar-hidden .nav-link {
  display: none;
}

/* ============================================
   ПОЛЬЗОВАТЕЛЬ
   ============================================ */
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
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #ffffff;
}

.avatar :deep(svg) {
  stroke: #ffffff;
  width: 20px;
  height: 20px;
}

.user-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user .name {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.user .role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.user-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  align-items: center;
}

.add-user-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: rgba(255, 255, 255, 0.6);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  text-decoration: none;
}

.add-user-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.add-user-btn :deep(svg) {
  stroke: currentColor;
  width: 18px;
  height: 18px;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: rgba(255, 255, 255, 0.6);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.logout-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.logout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.logout-btn :deep(svg) {
  stroke: currentColor;
  width: 18px;
  height: 18px;
}

.sidebar-hidden .user {
  display: none;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 768px) {
  .sidebar {
    width: 220px;
    padding: 16px 12px;
  }
  
  .sidebar-hidden {
    width: 0;
    padding: 0;
  }
  
  .sidebar-trigger {
    width: 12px;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 200px;
    padding: 12px 10px;
  }
  
  .nav-link {
    font-size: 13px;
    padding: 10px 12px;
  }
  
  .user .name {
    max-width: 80px;
    font-size: 13px;
  }
  
  .user .role {
    max-width: 80px;
    font-size: 11px;
  }
  
  .sidebar-trigger {
    width: 10px;
  }
}
</style>