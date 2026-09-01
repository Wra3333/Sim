<script setup>
import { ref, watch } from 'vue';
import { repairsApi } from '../../api';
import { useToastStore } from '../../stores/toastStore';

const props = defineProps({
  visible: { type: Boolean, default: false },
  equipment: { type: Object, default: null }
});

const emit = defineEmits(['close']);

const toast = useToastStore();
const repairs = ref([]);
const loading = ref(false);

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const loadHistory = async () => {
  if (!props.equipment) return;

  loading.value = true;
  try {
    const { data } = await repairsApi.getByEquipment(props.equipment.id);
    repairs.value = data || [];
  } catch (error) {
    toast.error('Ошибка загрузки истории');
    repairs.value = [];
  } finally {
    loading.value = false;
  }
};

watch(() => props.visible, (val) => {
  if (val) {
    loadHistory();
  } else {
    repairs.value = [];
  }
});

const close = () => {
  emit('close');
};
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>📋 История поломок</h3>
          <button class="btn-close" @click="close">×</button>
        </div>

        <div class="modal-body">
          <div class="equipment-info">
            <h4>{{ equipment?.name || 'Оборудование' }}</h4>
            <p><strong>Инв. номер:</strong> {{ equipment?.inventory_number || '—' }}</p>
            <p><strong>Статус:</strong> {{ equipment?.working_status || '—' }}</p>
          </div>

          <hr />

          <div v-if="loading" class="text-center">⏳ Загрузка истории...</div>
          <div v-else-if="repairs.length === 0" class="empty-state">
            ✅ Нет записей о поломках для этого оборудования
          </div>
          <div v-else class="history-list">
            <div 
              v-for="repair in repairs" 
              :key="repair.id" 
              class="history-item"
              :class="{ 'resolved': repair.is_resolved }"
            >
              <div class="history-header">
                <span class="history-id">#{{ repair.id }}</span>
                <span class="history-status" :class="repair.is_resolved ? 'status-resolved' : 'status-active'">
                  {{ repair.is_resolved ? '✅ Устранена' : '⚠️ Активна' }}
                </span>
              </div>
              <div class="history-body">
                <p class="history-desc">{{ repair.nature_of_malfunction }}</p>
                <div class="history-meta">
                  <span>📅 {{ formatDate(repair.detection_date) }}</span>
                  <span>👤 {{ repair.detected_by }}</span>
                  <span v-if="repair.is_resolved">✅ {{ repair.resolved_by || 'Неизвестно' }}</span>
                  <span v-if="repair.is_resolved">📅 {{ formatDate(repair.resolution_date) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="close">Закрыть</button>
        </div>
      </div>
    </div>
  </Teleport>
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
}

.modal {
  background: white;
  border-radius: 16px;
  width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin: 20px;
  display: block;
  position: relative;
}

.modal-lg {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #212529;
}

.btn-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #6c757d;
  padding: 0 8px;
  line-height: 1;
}

.btn-close:hover {
  color: #212529;
}

.equipment-info h4 {
  margin: 0 0 8px 0;
  color: #1a1a2e;
}

.equipment-info p {
  margin: 4px 0;
  color: #555;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 14px 16px;
  border-left: 4px solid #ffc107;
}

.history-item.resolved {
  border-left-color: #28a745;
  opacity: 0.85;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.history-id {
  font-weight: 600;
  color: #0d6efd;
  font-size: 14px;
}

.history-status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 12px;
}

.status-active {
  background: #fff3cd;
  color: #664d03;
}

.status-resolved {
  background: #d1e7dd;
  color: #0f5132;
}

.history-desc {
  margin: 4px 0 8px 0;
  font-size: 14px;
  color: #333;
}

.history-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6c757d;
  flex-wrap: wrap;
}

.history-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-size: 16px;
}

.text-center {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 8px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5c636a;
}
</style>