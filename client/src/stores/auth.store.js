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
  const role = ref(localStorage.getItem('userRole') || null);   // ← ДОБАВЛЕНО
  const loading = ref(false);
  const initialized = ref(false);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  // ============================================
  //  ГЕТТЕРЫ РОЛИ — ДОБАВЛЕНО
  // ============================================
  const isAdmin = computed(() => role.value === 'admin');
  const isMethodist = computed(() => role.value === 'methodist');
  const isLab = computed(() => role.value === 'lab_assistant');
  const isTechnician = computed(() => role.value === 'technician');
  const hasRole = (...roles) => !!role.value && roles.includes(role.value);

  // ============================================
  //  ОЧИСТКА — ДОБАВЛЕНО
  // ============================================
  const clearAuth = () => {
    token.value = null;
    user.value = null;
    role.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
  };

  const init = async () => {
    const savedToken = localStorage.getItem('accessToken');
    if (!savedToken) {
      initialized.value = true;
      return;
    }

    token.value = savedToken;

    try {
      loading.value = true;
      const response = await authApi.validate();

      if (response.data.valid) {
        user.value = response.data.user;
        role.value = response.data.user.role;                        // ← ДОБАВЛЕНО
        localStorage.setItem('userRole', response.data.user.role);   // ← ДОБАВЛЕНО
      } else {
        clearAuth();
      }
    } catch (error) {
      clearAuth();
    } finally {
      loading.value = false;
      initialized.value = true;
    }
  };

  const register = async (data) => {
    try {
      loading.value = true;
      const response = await authApi.register(data);
      // токены не выдаём — пользователя создаёт админ
      toast.success('Пользователь создан');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка создания';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      loading.value = false;
    }
  };

  const login = async (email, password) => {
    try {
      loading.value = true;
      const response = await authApi.login({ email, password });

      token.value = response.data.accessToken;
      user.value = response.data.user;
      role.value = response.data.user.role;                        // ← ДОБАВЛЕНО

      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('userRole', response.data.user.role);   // ← ДОБАВЛЕНО
      localStorage.setItem('userName', response.data.user.name);   // ← ДОБАВЛЕНО
      localStorage.setItem('userId', response.data.user.id);       // ← ДОБАВЛЕНО

      toast.success('Вход выполнен!');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка входа';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    clearAuth();

    if (refreshTokenValue) {
      try {
        loading.value = true;
        await axios.post(`${API_URL}/auth/logout`, { refreshToken: refreshTokenValue });
      } catch (e) {
        // игнорируем
      } finally {
        loading.value = false;
      }
    }

    toast.info('👋 Вы вышли из системы');
  };

  const refreshToken = async () => {
    try {
      const response = await authApi.refresh();
      token.value = response.data.accessToken;
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return { success: true };
    } catch (error) {
      await logout();
      return { success: false };
    }
  };

  return {
    user,
    token,
    role,           // ← ДОБАВЛЕНО
    loading,
    initialized,
    isAuthenticated,
    isAdmin,        // ← ДОБАВЛЕНО
    isMethodist,    // ← ДОБАВЛЕНО
    isLab,          // ← ДОБАВЛЕНО
    isTechnician,   // ← ДОБАВЛЕНО
    hasRole,        // ← ДОБАВЛЕНО
    init,
    register,
    login,
    logout,
    refreshToken
  };
});