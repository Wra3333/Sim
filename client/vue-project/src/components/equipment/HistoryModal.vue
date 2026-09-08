<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>
            <IconHistory class="header-icon" />
            История поломок
          </h3>
          <button class="btn-close" @click="close">×</button>
        </div>

        <div class="modal-body">
          <div class="equipment-info">
            <h4>
              <IconEquipment class="info-icon" />
              {{ equipment?.name || 'Оборудование' }}
            </h4>
            <p>
              <IconTag class="info-icon" />
              <strong>Инв. номер:</strong> {{ equipment?.inventory_number || '—' }}
            </p>
            <p>
              <IconAlert class="info-icon" />
              <strong>Статус:</strong> 
              <span class="badge" :class="getStatusClass(equipment?.working_status)">
                {{ equipment?.working_status || '—' }}
              </span>
            </p>
          </div>

          <hr />

          <div v-if="loading" class="text-center">
            <IconLoading class="loading-icon" />
            Загрузка истории...
          </div>
          <div v-else-if="repairs.length === 0" class="empty-state">
            <IconCheck class="empty-icon" />
            <span>Нет записей о поломках для этого оборудования</span>
          </div>
          <div v-else class="history-list">
            <div 
              v-for="repair in repairs" 
              :key="repair.id" 
              class="history-item"
              :class="{ 'resolved': repair.is_resolved }"
            >
              <div class="history-header">
                <span class="history-id">
                  <IconTag class="id-icon" />
                  #{{ repair.id }}
                </span>
                <span class="history-status" :class="repair.is_resolved ? 'status-resolved' : 'status-active'">
                  <IconCheck v-if="repair.is_resolved" class="status-icon" />
                  <IconAlert v-else class="status-icon" />
                  {{ repair.is_resolved ? 'Устранена' : 'Активна' }}
                </span>
              </div>
              <div class="history-body">
                <p class="history-desc">
                  <IconFileText class="desc-icon" />
                  {{ repair.nature_of_malfunction }}
                </p>
                <div class="history-meta">
                  <span>
                    <IconCalendar class="meta-icon" />
                    {{ formatDateTime(repair.detection_date) }}
                  </span>
                  <span>
                    <IconUser class="meta-icon" />
                    {{ repair.detected_by }}
                  </span>
                  <span v-if="repair.is_resolved">
                    <IconCheck class="meta-icon" />
                    {{ repair.resolved_by || 'Неизвестно' }}
                  </span>
                  <span v-if="repair.is_resolved">
                    <IconCalendar class="meta-icon" />
                    {{ formatDateTime(repair.resolution_date) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="close">
            <IconClose class="btn-icon" />
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import { repairsApi } from '../../api';
import { useToastStore } from '../../stores/toastStore';
import { useFormatters } from '../../composables/useFormatters';
import {
  IconHistory,
  IconEquipment,
  IconTag,
  IconAlert,
  IconLoading,
  IconCheck,
  IconFileText,
  IconCalendar,
  IconUser,
  IconClose
} from '../icons';

const props = defineProps({
  visible: { type: Boolean, default: false },
  equipment: { type: Object, default: null }
});

const emit = defineEmits(['close']);

const toast = useToastStore();
const { formatDateTime } = useFormatters();
const repairs = ref([]);
const loading = ref(false);

const getStatusClass = (status) => {
  if (!status) return 'badge-secondary';
  const classes = {
    'Исправен': 'badge-success',
    'В ремонте': 'badge-warning',
    'Требует ремонта': 'badge-danger'
  };
  return classes[status] || 'badge-secondary';
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-header h3 .header-icon {
  width: 22px;
  height: 22px;
  stroke: #212529;
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.equipment-info h4 .info-icon {
  width: 18px;
  height: 18px;
  stroke: #1a1a2e;
}

.equipment-info p {
  margin: 4px 0;
  color: #555;
  display: flex;
  align-items: center;
  gap: 4px;
}

.equipment-info p .info-icon {
  width: 14px;
  height: 14px;
  stroke: #555;
}

.badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.badge-success {
  background: #d1e7dd;
  color: #0f5132;
}

.badge-warning {
  background: #fff3cd;
  color: #664d03;
}

.badge-danger {
  background: #f8d7da;
  color: #842029;
}

.badge-secondary {
  background: #e9ecef;
  color: #41464b;
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
  display: flex;
  align-items: center;
  gap: 4px;
}

.history-id .id-icon {
  width: 14px;
  height: 14px;
  stroke: #0d6efd;
}

.history-status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.history-status .status-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
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
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.history-desc .desc-icon {
  width: 16px;
  height: 16px;
  stroke: #333;
  flex-shrink: 0;
  margin-top: 2px;
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

.history-meta .meta-icon {
  width: 14px;
  height: 14px;
  stroke: #6c757d;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-state .empty-icon {
  width: 32px;
  height: 32px;
  stroke: #6c757d;
}

.text-center {
  text-align: center;
  padding: 20px;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.text-center .loading-icon {
  width: 20px;
  height: 20px;
  stroke: #6c757d;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn .btn-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5c636a;
}
</style>