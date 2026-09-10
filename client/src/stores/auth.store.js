import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { authApi } from '../api';
import { useToastStore } from './toastStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const useAuthStore = defineStore('auth', () => {
  const toast = useToastStore();

  const user = ref(null);
  const token = ref(localStorage.getItem('accessToken') || null);
  const loading = ref(false);
  const initialized = ref(false);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  // ============================================
  //  ИНИЦИАЛИЗАЦИЯ
  // ============================================
  const init = async () => {
    const savedToken = localStorage.getItem('accessToken');

    console.log('🔍 [init] Начало, savedToken:', savedToken ? 'ЕСТЬ' : 'НЕТ');

    if (!savedToken) {
      console.log('⚠️ [init] Нет токена в localStorage, пропускаем');
      initialized.value = true;
      return;
    }

    token.value = savedToken;

    try {
      loading.value = true;
      console.log('📡 [init] Отправка validate запроса...');

      const response = await authApi.validate();
      console.log('✅ [init] Ответ validate:', response.data);

      if (response.data.valid) {
        user.value = response.data.user;
        console.log('✅ [init] Сессия восстановлена, пользователь:', user.value);
      } else {
        console.log('⚠️ [init] Токен невалидный, очищаем данные');
        token.value = null;
        user.value = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.error('❌ [init] Ошибка валидации:', error.message);
      token.value = null;
      user.value = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      loading.value = false;
      initialized.value = true;
      console.log('✅ [init] Завершен, isAuthenticated:', isAuthenticated.value);
    }
  };

  // ============================================
  //  РЕГИСТРАЦИЯ
  // ============================================
  const register = async (data) => {
    console.log('📝 [register] Начало');
    try {
      loading.value = true;
      const response = await authApi.register(data);

      console.log('✅ [register] Ответ получен');
      console.log('✅ [register] AccessToken:', response.data.accessToken ? 'ЕСТЬ' : 'НЕТ');
      console.log('✅ [register] RefreshToken:', response.data.refreshToken ? 'ЕСТЬ' : 'НЕТ');

      token.value = response.data.accessToken;
      user.value = response.data.user;
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);

      console.log('✅ [register] Успешно, пользователь:', user.value);
      toast.success('Регистрация успешна!');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка регистрации';
      console.error('❌ [register] Ошибка:', message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      loading.value = false;
    }
  };

  // ============================================
  //  ВХОД
  // ============================================
  const login = async (email, password) => {
    console.log('🔑 [login] Начало');
    try {
      loading.value = true;
      const response = await authApi.login({ email, password });

      console.log('✅ [login] Ответ получен');
      console.log('✅ [login] AccessToken:', response.data.accessToken ? 'ЕСТЬ' : 'НЕТ');
      console.log('✅ [login] RefreshToken:', response.data.refreshToken ? 'ЕСТЬ' : 'НЕТ');

      token.value = response.data.accessToken;
      user.value = response.data.user;
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);

      console.log('✅ [login] Успешно, пользователь:', user.value);
      toast.success('Вход выполнен!');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка входа';
      console.error('❌ [login] Ошибка:', message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      loading.value = false;
    }
  };

  // ============================================
  //  ВЫХОД
  // ============================================
  const logout = async () => {
    console.log('🚪 [logout] Начало');

    // 1. Берём refresh ДО очистки
    const refreshTokenValue = localStorage.getItem('refreshToken');

    // 2. СНАЧАЛА чистим локально
    //    (чтобы axios-перехватчик не пытался сделать refresh)
    token.value = null;
    user.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // 3. Потом отправляем на сервер через ПРЯМОЙ axios
    //    (без interceptors — они бы попытались refresh на 401)
    if (refreshTokenValue) {
      try {
        loading.value = true;
        console.log('📡 [logout] Отправка refresh на сервер для отзыва...');

        await axios.post(`${API_URL}/auth/logout`, {
          refreshToken: refreshTokenValue
        });

        console.log('✅ [logout] Сервер отозвал refresh');
      } catch (e) {
        console.log('⚠️ [logout] Ошибка сервера (игнорируем):', e.message);
      } finally {
        loading.value = false;
      }
    }

    toast.info('👋 Вы вышли из системы');
    console.log('✅ [logout] Завершен, данные очищены');
  };

  // ============================================
  //  ОБНОВЛЕНИЕ ТОКЕНА
  // ============================================
  const refreshToken = async () => {
    console.log('🔄 [refreshToken] Начало');
    try {
      const response = await authApi.refresh();
      token.value = response.data.accessToken;
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      console.log('✅ [refreshToken] Успешно');
      return { success: true };
    } catch (error) {
      console.error('❌ [refreshToken] Ошибка:', error.message);
      await logout();
      return { success: false };
    }
  };

  return {
    user,
    token,
    loading,
    initialized,
    isAuthenticated,
    init,
    register,
    login,
    logout,
    refreshToken
  };
});