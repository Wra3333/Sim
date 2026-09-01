<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ repair ? '✏️ Редактировать заявку' : '➕ Создать заявку о неисправности' }}</h3>
          <button class="btn-close" @click="close">×</button>
        </div>

        <form @submit.prevent="submit">
          <div class="form-group">
            <label>Оборудование *</label>
            <EquipmentMultiSelect
              v-model="form.equipment_ids"
              :equipment-options="equipmentList"
              placeholder="Введите название или инв. номер..."
              :max-items="10"
            />
            <small class="text-muted">Можно выбрать несколько устройств</small>
          </div>

          <div class="form-group">
            <label>Дата выявления *</label>
            <input
              v-model="form.detection_date"
              type="datetime-local"
              class="form-control"
              required
            />
          </div>

          <div class="form-group">
            <label>Описание неисправности *</label>
            <textarea
              v-model="form.nature_of_malfunction"
              class="form-control"
              rows="4"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label>Кто выявил *</label>
            <input v-model="form.detected_by" class="form-control" required />
          </div>

          <div class="form-group">
            <label>Возможность устранения</label>
            <select v-model="form.repair_possibility" class="form-control">
              <option value="Самостоятельно">Самостоятельно</option>
              <option value="Требуется сервисный инженер">Требуется сервисный инженер</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline-secondary" @click="close">
              Отмена
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Сохранение...' : 'Создать заявку' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { repairsApi, equipmentApi } from '../../api';
import { useToastStore } from '../../stores/toastStore';
import EquipmentMultiSelect from '../../components/EquipmentMultiSelect.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  equipmentId: {
    type: Number,
    default: null
  },
  repair: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'save']);

const toast = useToastStore();
const equipmentList = ref([]);
const loading = ref(false);

const form = ref({
  equipment_ids: [],
  detection_date: '',
  nature_of_malfunction: '',
  detected_by: '',
  repair_possibility: 'Самостоятельно'
});

const fillForm = (data) => {
  if (data) {
    form.value = {
      equipment_ids: data.equipment_ids || (data.equipment_id ? [data.equipment_id] : []),
      detection_date: data.detection_date || '',
      nature_of_malfunction: data.nature_of_malfunction || '',
      detected_by: data.detected_by || '',
      repair_possibility: data.repair_possibility || 'Самостоятельно'
    };
  }
};

watch(() => props.repair, (val) => {
  if (val) {
    fillForm(val);
  }
}, { immediate: true, deep: true });

watch(() => props.visible, (val) => {
  if (val && props.repair) {
    fillForm(props.repair);
  }
  if (val && !props.repair) {
    form.value = {
      equipment_ids: props.equipmentId ? [props.equipmentId] : [],
      detection_date: '',
      nature_of_malfunction: '',
      detected_by: '',
      repair_possibility: 'Самостоятельно'
    };
  }
}, { immediate: true });

watch(() => props.equipmentId, (val) => {
  if (val && !props.repair) {
    form.value.equipment_ids = [val];
  }
}, { immediate: true });

const loadEquipment = async () => {
  try {
    const { data } = await equipmentApi.getAll();
    equipmentList.value = data;
  } catch (error) {
    console.error('Error loading equipment:', error);
    toast.error(error?.response?.data?.message || "Ошибка загрузки списка оборудования");
  }
};

const close = () => {
  emit('close');
};

const submit = async () => {
  // ✅ Проверяем, что выбран хотя бы один элемент
  if (!form.value.equipment_ids || form.value.equipment_ids.length === 0) {
    toast.warning('Выберите оборудование');
    return;
  }
  if (!form.value.detection_date) {
    toast.warning('Укажите дату выявления');
    return;
  }
  if (!form.value.nature_of_malfunction) {
    toast.warning('Опишите неисправность');
    return;
  }
  if (!form.value.detected_by) {
    toast.warning('Укажите, кто выявил неисправность');
    return;
  }

  try {
    loading.value = true;

    // ✅ Отправляем массив equipment_ids
    const payload = {
      equipment_ids: form.value.equipment_ids,
      detection_date: form.value.detection_date,
      nature_of_malfunction: form.value.nature_of_malfunction,
      detected_by: form.value.detected_by,
      repair_possibility: form.value.repair_possibility
    };

    if (props.repair) {
      await repairsApi.update(props.repair.id, payload);
      toast.success('✅ Заявка обновлена');
    } else {
      const result = await repairsApi.create(payload);
      toast.success(result?.message || '✅ Заявки созданы');
    }

    emit('save');
    close();
  } catch (error) {
    toast.error(error?.response?.data?.message || "Ошибка сохранения");
  } finally {
    loading.value = false;
  }
};

onMounted(loadEquipment);
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
  pointer-events: auto;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  margin: auto;
  display: block;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
  margin-bottom: 4px;
}

.text-muted {
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  background: #fff;
  color: #212529;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
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

.btn-primary {
  background: #0d6efd;
  color: white;
}

.btn-primary:hover {
  background: #0b5ed7;
}

.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border: 1px solid #ced4da;
}

.btn-outline-secondary:hover {
  background: #e9ecef;
}
</style>