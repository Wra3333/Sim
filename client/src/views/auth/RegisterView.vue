<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const handleSubmit = async () => {
  if (!name.value || !email.value || !password.value) {
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
    router.push('/dashboard');
  } else {
    error.value = result.error;
  }
};
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <h1>📝 Регистрация</h1>
        <p class="subtitle">Создайте аккаунт для входа в систему</p>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Имя</label>
          <input
            v-model="name"
            type="text"
            class="form-control"
            placeholder="Введите ваше имя"
            required
          />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            class="form-control"
            placeholder="example@mail.ru"
            required
          />
        </div>

        <div class="form-group">
          <label>Пароль</label>
          <input
            v-model="password"
            type="password"
            class="form-control"
            placeholder="Минимум 6 символов"
            required
          />
        </div>

        <div class="form-group">
          <label>Подтвердите пароль</label>
          <input
            v-model="confirmPassword"
            type="password"
            class="form-control"
            placeholder="Повторите пароль"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
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

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f7fa;
}

.auth-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 400px;
}

.auth-header {
  text-align: center;
  margin-bottom: 24px;
}

.auth-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #212529;
}

.subtitle {
  color: #6c757d;
  font-size: 14px;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
  margin-bottom: 4px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.15s;
}

.form-control:focus {
  border-color: #80bdff;
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary {
  background: #0d6efd;
  color: white;
}

.btn-primary:hover {
  background: #0b5ed7;
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 16px;
  color: #6c757d;
  font-size: 14px;
}

.auth-footer a {
  color: #0d6efd;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>