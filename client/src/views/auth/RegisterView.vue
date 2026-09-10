<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-logo">
          <IconLogo color="#00447c" class="logo-icon" />
        </div>
        <h1>Регистрация</h1>
        <p class="subtitle">Создайте аккаунт для входа в систему</p>
      </div>

      <div v-if="error" class="error-message">
        <IconAlert class="error-icon" />
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>
            <IconUser class="label-icon" />
            Имя
          </label>
          <input
            v-model="name"
            type="text"
            class="form-control"
            placeholder="Введите ваше имя"
            required
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <label>
            <IconInbox class="label-icon" />  <!-- Вместо IconMail -->
            Email
          </label>
          <input
            v-model="email"
            type="email"
            class="form-control"
            placeholder="example@mail.ru"
            required
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label>
            <IconLock class="label-icon" />
            Пароль
          </label>
          <input
            v-model="password"
            type="password"
            class="form-control"
            placeholder="Минимум 6 символов"
            required
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <label>
            <IconLock class="label-icon" />
            Подтвердите пароль
          </label>
          <input
            v-model="confirmPassword"
            type="password"
            class="form-control"
            placeholder="Повторите пароль"
            required
            autocomplete="new-password"
          />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          <IconPlus class="btn-icon" />  <!-- Вместо IconUserPlus -->
          {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Уже есть аккаунт?
          <router-link to="/login">Войти</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';
import {
  IconLogo,
  IconUser,
  IconInbox,   // Используем вместо IconMail
  IconLock,
  IconAlert,
  IconPlus,    // Используем вместо IconUserPlus
} from '../../components/icons';

const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const handleSubmit = async () => {
  if (!name.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = 'Заполните все поля';
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Пароли не совпадают';
    return;
  }

  if (password.value.length < 6) {
    error.value = 'Пароль должен содержать минимум 6 символов';
    return;
  }

  loading.value = true;
  error.value = '';

  const result = await authStore.register({
    name: name.value,
    email: email.value,
    password: password.value
  });

  loading.value = false;

  if (result.success) {
    await new Promise(resolve => setTimeout(resolve, 200));
    router.push('/');
  } else {
    error.value = result.error || 'Ошибка регистрации';
  }
};
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f8fa;
}
.auth-page .logo-wrapper{
  display: block;
}

.auth-card {
  background: white;
  padding: 45px 65px 100px;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 630px;
  border: 1px solid #e8ecf1;
}

.auth-header {
  text-align: center;
  margin-bottom: 28px;
}

.auth-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.auth-header h1 {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #1a1a1a;
}

.auth-header .subtitle {
  color: #6c757d;
  font-size: 14px;
  margin: 0;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fce4ec;
  color: #c62828;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  border: 1px solid #ef9a9a;
}

.error-message .error-icon {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  flex-shrink: 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
  margin-bottom: 4px;
}

.form-group label .label-icon {
  width: 16px;
  height: 16px;
  stroke: #6c757d;
}

.form-control {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #dce1e8;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  background: #fafbfc;
}

.form-control:focus {
  border-color: #0077c8;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 119, 200, 0.12);
  background: white;
}

.form-control::placeholder {
  color: #adb5bd;
}

.btn {
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.btn .btn-icon {
  width: 18px;
  height: 18px;
  stroke: currentColor;
}

.btn-primary {
  background: #0077c8;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #00447c;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
  color: #6c757d;
  font-size: 14px;
}

.auth-footer a {
  color: #0077c8;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.auth-footer a:hover {
  color: #00447c;
  text-decoration: underline;
}
</style>