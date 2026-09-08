<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal modal-confirm">
        <div class="modal-header">
          <h3>
            <IconAlert v-if="confirmVariant === 'danger'" class="header-icon danger" />
            <IconCheck v-else-if="confirmVariant === 'success'" class="header-icon success" />
            <IconAlert v-else class="header-icon warning" />
            {{ title }}
          </h3>
          <button class="btn-close" @click="close">×</button>
        </div>

        <div class="modal-body">
          <p>{{ message }}</p>
        </div>

        <div class="form-actions">
          <button class="btn btn-sm btn-outline-secondary" @click="close">
            <IconClose class="btn-icon" />
            {{ cancelText }}
          </button>
          <button 
            class="btn btn-sm" 
            :class="`btn-${confirmVariant}`" 
            @click="confirm"
          >
            <IconCheck v-if="confirmVariant === 'success'" class="btn-icon" />
            <IconTrash v-else-if="confirmVariant === 'danger'" class="btn-icon" />
            <IconSave v-else class="btn-icon" />
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import {
  IconAlert,
  IconCheck,
  IconClose,
  IconTrash,
  IconSave
} from './icons'; //  ПРАВИЛЬНЫЙ ПУТЬ

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: 'Подтверждение' },
  message: { type: String, default: 'Вы уверены?' },
  confirmText: { type: String, default: 'Да' },
  cancelText: { type: String, default: 'Отмена' },
  confirmVariant: { type: String, default: 'danger' }
});

const emit = defineEmits(['confirm', 'cancel', 'update:visible']);

const close = () => {
  emit('update:visible', false);
  emit('cancel');
};

const confirm = () => {
  emit('confirm');
  emit('update:visible', false);
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1999;
}

.modal-confirm {
  background: white;
  border-radius: 12px;
  width: 360px;
  height: auto;
  max-width: 90vw;
  padding: 20px 24px 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin: 20px;
  display: block;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.modal-header h3 {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-header h3 .header-icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
}

.modal-header h3 .header-icon.danger {
  color: #dc3545;
}

.modal-header h3 .header-icon.success {
  color: #198754;
}

.modal-header h3 .header-icon.warning {
  color: #ffc107;
}

.btn-close {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #999;
  padding: 0 4px;
  line-height: 1;
}

.btn-close:hover {
  color: #333;
}

.modal-body p {
  margin: 4px 0 12px 0;
  font-size: 14px;
  color: #555;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  padding: 5px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn .btn-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}

.btn-sm {
  padding: 4px 14px;
  font-size: 13px;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-primary {
  background: #0d6efd;
  color: white;
}

.btn-primary:hover {
  background: #0b5ed7;
}

.btn-success {
  background: #198754;
  color: white;
}

.btn-success:hover {
  background: #157347;
}

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border: 1px solid #ced4da;
}

.btn-outline-secondary:hover {
  background: #f8f9fa;
}
</style>