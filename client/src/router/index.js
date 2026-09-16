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
import LogsView from '../views/LogsView.vue';
import UsersView from '../views/auth/UsersView.vue';       
import ForbiddenView from '../views/ForbiddenView.vue';

const routes = [
  { path: '/login', name: 'Login', component: LoginView, meta: { guest: true, title: 'Вход' } },
  {
    path: '/403',
    name: 'Forbidden',
    component: ForbiddenView,
    meta: { requiresAuth: true, title: 'Доступ запрещён' }
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
  meta: { title: 'Дашборд', roles: ['admin', 'methodist', 'lab_assistant', 'technician'] }
},
      {
        path: 'equipment', name: 'Equipment', component: EquipmentView,
        meta: { title: 'Оборудование', roles: ['admin', 'methodist', 'lab_assistant', 'technician'] }
      },
      {
        path: 'repairs', name: 'Repairs', component: RepairsView,
        meta: { title: 'Неисправности', roles: ['admin', 'methodist', 'lab_assistant', 'technician'] }
      },
      {
        path: 'templates', name: 'Templates', component: TemplatesView,
        meta: { title: 'Шаблоны', roles: ['admin', 'methodist', 'lab_assistant', 'technician'] }
      },
      {
        path: 'lessons', name: 'Lessons', component: LessonsView,
        meta: { title: 'Занятия', roles: ['admin', 'methodist', 'lab_assistant', 'technician'] }
      },
      {
        path: 'analytics', name: 'Analytics', component: AnalyticsView,
        meta: { title: 'Аналитика', roles: ['admin', 'methodist', 'lab_assistant', 'technician'] }
      },
      {
        path: 'logs', name: 'Logs', component: LogsView,
        meta: { title: 'Журнал', roles: ['admin'] }
      },
      {
        path: 'users', name: 'Users', component: UsersView,
        meta: { title: 'Пользователи', roles: ['admin'] }
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach(async (to, from) => {
  const authStore = useAuthStore();

  if (!authStore.initialized) {
    await authStore.init();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) return '/login';
  if (to.meta.guest && authStore.isAuthenticated) return '/';

  // ✅ ПРОВЕРКА РОЛЕЙ
  if (to.meta.roles && authStore.isAuthenticated) {
    if (!authStore.hasRole(...to.meta.roles)) {
      return '/403';
    }
  }

  return true;
});

export default router;