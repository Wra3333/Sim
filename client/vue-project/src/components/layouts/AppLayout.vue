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
import Sidebar from './Sidebar.vue';
import ToastContainer from '../ToastContainer.vue';

</script>

<style scoped>
.app {
  display: flex;
  min-height: 100vh;
}

.main {
  flex: 1;
  margin-left: 260px;
  padding: 24px 32px;
  background: #f4f7fc;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 24px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.btn-test-toasts {
  padding: 6px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-test-toasts:hover {
  background: #5a6268;
  transform: translateY(-1px);
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

.sidebar {
  animation: slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>