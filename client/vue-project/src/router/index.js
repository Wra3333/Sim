import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import AppLayout from '../components/layouts/AppLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import EquipmentView from '../views/EquipmentView.vue';
import RepairsView from '../views/RepairsView.vue';
import TemplatesView from '../views/TemplatesView.vue';
import LessonsView from '../views/LessonsView.vue';
import AnalyticsView from '../views/AnalyticsView.vue';
import LoginView from '../views/auth/LoginView.vue';
import RegisterView from '../views/auth/RegisterView.vue';
import LogsView from '../views/LogsView.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { guest: true, title: 'Вход' }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    //  ТЕПЕРЬ ТРЕБУЕТ АВТОРИЗАЦИЮ
    meta: { requiresAuth: true, title: 'Регистрация' }
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { 
        path: '', 
        name: 'Dashboard', 
        component: DashboardView, 
        meta: { title: 'Дашборд' } 
      },
      { 
        path: 'equipment', 
        name: 'Equipment', 
        component: EquipmentView, 
        meta: { title: 'Оборудование' } 
      },
      { 
        path: 'repairs', 
        name: 'Repairs', 
        component: RepairsView, 
        meta: { title: 'Неисправности' } 
      },
      { 
        path: 'templates', 
        name: 'Templates', 
        component: TemplatesView, 
        meta: { title: 'Шаблоны' } 
      },
      { 
        path: 'lessons', 
        name: 'Lessons', 
        component: LessonsView, 
        meta: { title: 'Занятия' } 
      },
      { 
        path: 'analytics', 
        name: 'Analytics', 
        component: AnalyticsView, 
        meta: { title: 'Аналитика' } 
      },
      { 
        path: 'logs', 
        name: 'Logs', 
        component: LogsView, 
        meta: { title: 'Журнал' } 
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Навигационный гард (без next())
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore();

  if (!authStore.initialized) {
    await authStore.init();
  }

  console.log('🔍 Роутер:', {
    to: to.path,
    requiresAuth: to.meta.requiresAuth,
    isAuthenticated: authStore.isAuthenticated,
    guest: to.meta.guest
  });

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('➡️ Редирект на /login (требуется авторизация)');
    return '/login';
  }

  if (to.meta.guest && authStore.isAuthenticated) {
    console.log('➡️ Редирект на / (пользователь уже авторизован)');
    return '/';
  }

  return true;
});

export default router;