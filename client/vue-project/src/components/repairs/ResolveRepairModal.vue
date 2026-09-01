<script setup>
import { ref, watch, computed } from 'vue';
import { repairsApi, equipmentApi } from '../../api';
import { useToastStore } from '../../stores/toastStore';

const props = defineProps({
  visible: { type: Boolean, default: false },
  repair: { type: Object, default: null },
  isEditing: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'resolve']);

const toast = useToastStore();
const loading = ref(false);
const resolvedBy = ref('');
const resolutionStatus = ref('resolved');
const writeOffReason = ref('');

const isImpossible = computed(() => resolutionStatus.value === 'impossible');

const close = () => {
  resolvedBy.value = '';
  resolutionStatus.value = 'resolved';
  writeOffReason.value = '';
  emit('close');
};

const confirmResolve = async () => {
  if (!resolvedBy.value.trim()) {
    toast.warning('Укажите, кто проводил проверку');
    return;
  }

  if (isImpossible.value && !writeOffReason.value.trim()) {
    toast.warning('Укажите причину списания');
    return;
  }

  try {
    loading.value = true;

    if (props.isEditing) {
      await repairsApi.updateResolvedBy(props.repair.id, {
        resolved_by: resolvedBy.value
      });
      toast.success('✅ Информация об устранении обновлена');
    } else {
      if (isImpossible.value) {
        await repairsApi.resolve(props.repair.id, {
          resolved_by: resolvedBy.value,
          resolution_date: new Date().toISOString(),
          is_resolved: true,
          resolution_status: 'impossible',
          write_off_reason: writeOffReason.value
        });

        await equipmentApi.update(props.repair.equipment_id, {
          write_off_status: 'На списание',
          working_status: 'Требует ремонта'
        });
        toast.success('✅ Оборудование отправлено на списание');
      } else {
        await repairsApi.resolve(props.repair.id, {
          resolved_by: resolvedBy.value,
          resolution_date: new Date().toISOString(),
          is_resolved: true,
          resolution_status: 'resolved'
        });

        await equipmentApi.update(props.repair.equipment_id, {
          working_status: 'Исправен'
        });
        toast.success('✅ Заявка устранена');
      }
    }

    emit('resolve');
    close();
  } catch (error) {
    toast.error(error?.response?.data?.message || "Ошибка");
  } finally {
    loading.value = false;
  }
};

watch(() => props.visible, (val) => {
  if (val && props.repair) {
    resolvedBy.value = props.repair.resolved_by || '';
    resolutionStatus.value = 'resolved';
    writeOffReason.value = '';
  }
});
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal modal-md">
        <div class="modal-header">
          <h3>{{ isEditing ? '✏️ Редактировать устранение' : '✅ Устранение заявки' }}</h3>
          <button class="btn-close" @click="close">×</button>
        </div>

        <div class="modal-body">
          <p><strong>Оборудование:</strong> {{ repair?.equipment?.name || '—' }}</p>
          <p><strong>Описание:</strong> {{ repair?.nature_of_malfunction || '—' }}</p>
          <p v-if="isEditing"><strong>Текущий:</strong> {{ repair?.resolved_by || 'Не указан' }}</p>

          <div v-if="!isEditing" class="form-group">
            <label>Результат проверки *</label>
            <select v-model="resolutionStatus" class="form-control">
              <option value="resolved">✅ Устранено</option>
              <option value="impossible">❌ Невозможно устранить (списание)</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ isImpossible ? 'Кто проводил проверку':'Кто устранил'  }} *</label>
            <input 
              v-model="resolvedBy" 
              class="form-control" 
              placeholder="Введите ФИО"
              required
            />
          </div>

          <div v-if="isImpossible && !isEditing" class="form-group">
            <label>Причина списания *</label>
            <textarea
              v-model="writeOffReason"
              class="form-control"
              rows="3"
              placeholder="Укажите причину..."
              required
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-outline-secondary" @click="close" :disabled="loading">
            Отмена
          </button>
          <button 
            class="btn" 
            :class="isImpossible ? 'btn-danger' : 'btn-success'"
            @click="confirmResolve" 
            :disabled="loading || (isImpossible && !writeOffReason.trim())"
          >
            {{ loading ? 'Сохранение...' : isImpossible ? '🗑️ Списать' : '✅ Устранить' }}
          </button>
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
  border-radius: 12px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  position: relative;
  height: auto;
  display: block;
}

.modal-md {
  max-width: 520px;
  margin: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #212529;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0 4px;
  line-height: 1;
}

.btn-close:hover {
  color: #333;
}

.modal-body p {
  margin: 6px 0;
  font-size: 14px;
  color: #333;
}

.modal-body p strong {
  color: #212529;
}

.form-group {
  margin-top: 16px;
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
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

textarea.form-control {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-success {
  background: #198754;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #157347;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border: 1px solid #ced4da;
}

.btn-outline-secondary:hover:not(:disabled) {
  background: #e9ecef;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>