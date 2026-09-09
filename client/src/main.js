import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'; // ← ДОБАВИТЬ!
import App from './App.vue';
import router from './router';
import './main.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Создаем Pinia с плагином
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate); // ← ДОБАВИТЬ!

const app = createApp(App);
app.use(pinia);      // ← Используем настроенный pinia
app.use(router);
app.mount('#app');