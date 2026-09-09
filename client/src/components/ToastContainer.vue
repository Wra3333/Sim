<script setup>
import { useToastStore } from '../stores/toastStore';
import {
  IconCheck,
  IconAlert,
  IconClose,
  IconInfo
} from './icons';

const toastStore = useToastStore();

const getIcon = (type) => {
  const icons = {
    success: IconCheck,
    error: IconAlert,
    warning: IconAlert,
    info: IconInfo
  };
  return icons[type] || IconInfo;
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

const getBgColor = (type) => {
  const colors = {
    success: '#ecfdf5',
    error: '#fef2f2',
    warning: '#fffbeb',
    info: '#eff6ff'
  };
  return colors[type] || '#eff6ff';
};
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast"
        :style="{
          borderLeftColor: getColor(toast.type),
          background: getBgColor(toast.type)
        }"
      >
        <div class="toast-icon" :style="{ color: getColor(toast.type) }">
          <component :is="getIcon(toast.type)" />
        </div>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="toastStore.removeToast(toast.id)">
          <IconClose class="close-icon" />
        </button>
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
  max-width: 420px;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  padding: 14px 18px;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border-left: 4px solid #3b82f6;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideIn 0.3s ease;
  min-width: 280px;
  transition: all 0.2s;
  display: flex !important;
}

.toast:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-icon svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
  word-break: break-word;
  line-height: 1.4;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  color: #adb5bd;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #495057;
}

.toast-close .close-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
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