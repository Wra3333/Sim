import { createRouter, createWebHistory } from 'vue-router';
import AppLayout from '../components/layouts/AppLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import EquipmentView from '../views/EquipmentView.vue';
import RepairsView from '../views/RepairsView.vue';
import TemplatesView from '../views/TemplatesView.vue';
import LessonsView from '../views/LessonsView.vue';
import AnalyticsView from '../views/AnalyticsView.vue';

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'dashboard', component: DashboardView, meta: { title: 'Дашборд' } },
      { path: 'equipment', name: 'equipment', component: EquipmentView, meta: { title: 'Оборудование' } },
      { path: 'repairs', name: 'repairs', component: RepairsView, meta: { title: 'Неисправности' } },
      { path: 'templates', name: 'templates', component: TemplatesView, meta: { title: 'Шаблоны' } },
      { path: 'lessons', name: 'lessons', component: LessonsView, meta: { title: 'Занятия' } },
      { path: 'analytics', name: 'analytics', component: AnalyticsView, meta: { title: 'Аналитика' } }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;