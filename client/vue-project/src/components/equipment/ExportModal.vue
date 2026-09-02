<script setup>
import { ref } from 'vue';

const props = defineProps({
  fields: { type: Array, required: true },
  labels: { type: Object, required: true }
});
const emit = defineEmits(['close', 'export']);

const selectedFields = ref([...props.fields]);

const toggleField = (field) => {
  if (selectedFields.value.includes(field)) {
    selectedFields.value = selectedFields.value.filter(f => f !== field);
  } else {
    selectedFields.value.push(field);
  }
};
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>Экспорт оборудования</h3>
        <button class="btn-close" @click="emit('close')">×</button>
      </div>
      <div class="modal-body">
        <h4>Выберите поля для экспорта:</h4>
        <div class="checkbox-list">
          <div class="checkbox-item" v-for="field in props.fields" :key="field">
            <label>
              <input type="checkbox" :checked="selectedFields.includes(field)" @change="toggleField(field)" />
              {{ props.labels[field] || field }}
            </label>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-outline-secondary" @click="emit('close')">Отмена</button>
        <!-- 👇 Передаем выбранные поля в родительский компонент -->
        <button type="button" class="btn btn-primary" @click="emit('export', selectedFields)">Экспорт</button>
      </div>
    </div>
  </div>
</template>

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
  z-index: 9999;
  pointer-events: auto;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: block;
  position: relative;
  height: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #1a1a2e;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #888;
}

.btn-close:hover {
  color: #333;
}

.modal-body {
  margin-bottom: 16px;
}

.modal-body h4 {
  font-size: 14px;
  font-weight: 500;
  color: #555;
  margin-bottom: 8px;
}

.checkbox-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.checkbox-item {
  font-size: 13px;
  color: #666;
}

.checkbox-item label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.checkbox-item input {
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4361ee;
  color: white;
}

.btn-primary:hover {
  background: #3a56d4;
}

.btn-outline-secondary {
  background: transparent;
  color: #555;
  border: 1px solid #ddd;
}

.btn-outline-secondary:hover {
  background: #f0f0f0;
}
</style>