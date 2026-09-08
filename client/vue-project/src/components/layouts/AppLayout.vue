<template>
  <div class="app">
    <Sidebar />
    <div class="main">
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <div class="page-container" :key="$route.path">
              <component :is="Component" />
            </div>
          </transition>
        </router-view>
      </div>
    </div>
    <ToastContainer />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth.store';
import Sidebar from './Sidebar.vue';
import ToastContainer from '../ToastContainer.vue';
import { useAppState } from '../../composables/useAppState'

const authStore = useAuthStore();
useAppState()

onMounted(async () => {
  await authStore.init();
});
</script>

<style scoped>
.app {
  display: flex;
  min-height: 100vh;
}

.main {
  flex: 1;
  margin-left: 0;
  padding: 24px 32px;
  background: #f4f7fc;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.content-wrapper {
  flex: 1;
  min-height: 500px;
}

.page-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  min-height: 500px;
}

.fade-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-leave-active {
  transition: none; 
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 768px) {
  .main {
    padding: 16px;
  }
  
  .page-container {
    padding: 16px;
  }
}
</style>