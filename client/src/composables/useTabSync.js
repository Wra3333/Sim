// src/composables/useTabSync.js
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import {
  useEquipmentStore,
  useLessonsStore,
  useTemplatesStore,
  useRepairsStore,
  useWorkTimeStore,
} from '../stores';
import { tabSync } from '../utils/tabSync';

export function useTabSync() {
  const router = useRouter();
  const authStore = useAuthStore();
  const equipmentStore = useEquipmentStore();
  const lessonsStore = useLessonsStore();
  const templatesStore = useTemplatesStore();
  const repairsStore = useRepairsStore();
  const workTimeStore = useWorkTimeStore();

  let unsubscribe = null;
  let lastRefresh = Date.now();
  const MIN_REFRESH_INTERVAL = 30000; // 30 секунд

  // ============================================
  //  ОБРАБОТКА СООБЩЕНИЙ ИЗ ДРУГИХ ВКЛАДОК
  // ============================================
  const handleMessage = async (msg) => {
    const { type, payload } = msg;
    if (!type) return;

    console.log('📩 [useTabSync] Получено:', type, payload);

    switch (type) {
      // ---------- ОБОРУДОВАНИЕ ----------
      case 'equipment:created':
      case 'equipment:updated':
      case 'equipment:deleted':
      case 'equipment:restored':
        await equipmentStore.fetchAll().catch(() => {});
        break;

      // ---------- ЗАНЯТИЯ ----------
      case 'lesson:created':
      case 'lesson:updated':
      case 'lesson:deleted':
      case 'lesson:completed':
        await Promise.all([
          lessonsStore.fetchAll().catch(() => {}),
          workTimeStore.fetchAll().catch(() => {}),
        ]);
        break;

      // ---------- ШАБЛОНЫ ----------
      case 'template:created':
      case 'template:updated':
      case 'template:deleted':
      case 'template:synced':
        await templatesStore.fetchAll().catch(() => {});
        // Синхронизация шаблона может затронуть занятия
        await lessonsStore.fetchAll().catch(() => {});
        break;

      // ---------- РЕМОНТЫ ----------
      case 'repair:created':
      case 'repair:updated':
      case 'repair:resolved':
      case 'repair:deleted':
        await repairsStore.fetchAll().catch(() => {});
        // При ремонте может меняться статус оборудования
        await equipmentStore.fetchAll().catch(() => {});
        break;

      // ---------- АВТОРИЗАЦИЯ ----------
      case 'auth:login':
        if (!authStore.isAuthenticated) {
          await authStore.init();
        }
        break;

      case 'auth:logout':
        if (authStore.isAuthenticated) {
          authStore.token = null;
          authStore.user = null;
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.push('/login');
        }
        break;
    }
  };

  // ============================================
  //  ОБНОВЛЕНИЕ ПРИ ВОЗВРАТЕ ВО ВКЛАДКУ
  // ============================================
  const refreshOnReturn = async () => {
    if (document.visibilityState !== 'visible') return;

    const now = Date.now();
    if (now - lastRefresh < MIN_REFRESH_INTERVAL) return;
    lastRefresh = now;

    console.log('🔄 [useTabSync] Обновление при возврате во вкладку');

    await Promise.allSettled([
      equipmentStore.fetchAll(),
      lessonsStore.fetchAll(),
      templatesStore.fetchAll(),
      repairsStore.fetchAll(),
      workTimeStore.fetchAll(),
    ]);
  };

  // ============================================
  //  FALLBACK: storage event (для logout и app_state)
  // ============================================
  const handleStorage = (e) => {
    // Logout в другой вкладке
    if (e.key === 'accessToken' && !e.newValue) {
      if (authStore.isAuthenticated) {
        authStore.token = null;
        authStore.user = null;
        router.push('/login');
      }
    }
  };

  // ============================================
  //  LIFECYCLE
  // ============================================
  onMounted(() => {
    tabSync.init();
    unsubscribe = tabSync.subscribe(handleMessage);

    document.addEventListener('visibilitychange', refreshOnReturn);
    window.addEventListener('focus', refreshOnReturn);
    window.addEventListener('storage', handleStorage);
  });

  onBeforeUnmount(() => {
    if (unsubscribe) unsubscribe();

    document.removeEventListener('visibilitychange', refreshOnReturn);
    window.removeEventListener('focus', refreshOnReturn);
    window.removeEventListener('storage', handleStorage);
  });
}