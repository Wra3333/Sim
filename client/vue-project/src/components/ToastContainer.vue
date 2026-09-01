<script setup>
import { useToastStore } from '../stores/toastStore';

const toastStore = useToastStore();

const getIcon = (type) => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  return icons[type] || 'ℹ️';
};

const getColor = (type) => {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  return colors[type] || '#3b82f6';
};
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast"
        :style="{ borderLeftColor: getColor(toast.type) }"
      >
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  background: white;
  padding: 14px 18px;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border-left: 4px solid #3b82f6;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: slideIn 0.3s ease;
  min-width: 280px;
  display: block !important;
}

.toast-icon {
  font-size: 18px;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  color: #1a1a2e;
  word-break: break-word;
}

.toast-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  padding: 0 4px;
  line-height: 1;
}

.toast-close:hover {
  color: #333;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>