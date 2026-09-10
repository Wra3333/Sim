<template>
  <Teleport to="body">
    <div 
      class="drawer-overlay" 
      :class="{ 'drawer-overlay-visible': visible }"
      @click="close"
    ></div>

    <div 
      class="drawer" 
      :class="{ 'drawer-open': visible }"
    >
      <div class="drawer-header">
        <h3>
          <IconEdit v-if="repair" class="header-icon" />
          <IconPlus v-else class="header-icon" />
          {{ repair ? 'Редактировать заявку' : 'Создать заявку о неисправности' }}
        </h3>
        <button class="btn-close" @click="close">×</button>
      </div>

      <div class="drawer-body">
        <form @submit.prevent="submit">
          <div class="form-group">
            <label>
              <IconEquipment class="label-icon" />
              Оборудование *
            </label>
            <EquipmentMultiSelect
              v-model="form.equipment_ids"
              :equipment-options="equipmentList"
              placeholder="Введите название или инв. номер..."
              :max-items="10"
            />
            <small class="text-muted">Можно выбрать несколько устройств</small>
          </div>

          <div class="form-group">
            <label>
              <IconCalendar class="label-icon" />
              Дата выявления *
            </label>
            <input
              v-model="form.detection_date"
              type="datetime-local"
              class="form-control"
              required
            />
          </div>

          <div class="form-group">
            <label>
              <IconFileText class="label-icon" />
              Описание неисправности *
            </label>
            <textarea
              v-model="form.nature_of_malfunction"
              class="form-control"
              rows="4"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label>
              <IconUser class="label-icon" />
              Кто выявил *
            </label>
            <input v-model="form.detected_by" class="form-control" required />
          </div>

          <div class="form-group">
            <label>
              <IconWrench class="label-icon" />
              Возможность устранения
            </label>
            <select v-model="form.repair_possibility" class="form-control">
              <option value="Самостоятельно">Самостоятельно</option>
              <option value="Требуется сервисный инженер">Требуется сервисный инженер</option>
              <option value="Не подлежит ремонту">Не подлежит ремонту</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline-secondary" @click="close">
              <IconClose class="btn-icon" />
              Отмена
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <IconSave v-if="!loading" class="btn-icon" />
              <IconLoading v-else class="btn-icon spin" />
              {{ loading ? 'Сохранение...' : (repair ? 'Обновить заявку' : 'Создать заявку') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { repairsApi, equipmentApi } from '../../api';
import { useToastStore } from '../../stores/toastStore';
import EquipmentMultiSelect from '../../components/EquipmentMultiSelect.vue';
import {
  IconEdit,
  IconPlus,
  IconEquipment,
  IconCalendar,
  IconFileText,
  IconUser,
  IconWrench,
  IconClose,
  IconSave,
  IconLoading
} from '../icons';

const props = defineProps({
  visible: { type: Boolean, default: false },
  equipmentId: { type: Number, default: null },
  repair: { type: Object, default: null }
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

// ============================================
//  ДАТА
// ============================================
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

const toDateTimeLocal = (dateValue) => {
  if (!dateValue) return getCurrentDateTimeLocal();

  try {
    let date;

    if (typeof dateValue === 'string') {
      if (dateValue.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateValue)) {
        date = new Date(dateValue);
      } else {
        date = new Date(dateValue.length === 16 ? dateValue + ':00' : dateValue);
      }
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) {
      return getCurrentDateTimeLocal();
    }

    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  } catch (e) {
    return getCurrentDateTimeLocal();
  }
};

// ============================================
//  СКРОЛЛ
// ============================================
const toggleBodyScroll = (disable) => {
  if (disable) {
    document.documentElement.style.overflow = 'hidden';
  } else {
    document.documentElement.style.overflow = '';
  }
};

// ============================================
//  ЗАПОЛНЕНИЕ ФОРМЫ
// ============================================
const fillForm = (data) => {
  if (!data) return;

  form.value = {
    equipment_ids: data.equipment_ids || (data.equipment_id ? [data.equipment_id] : []),
    detection_date: toDateTimeLocal(data.detection_date),
    nature_of_malfunction: data.nature_of_malfunction || '',
    detected_by: data.detected_by || '',
    repair_possibility: data.repair_possibility || 'Самостоятельно'
  };
};

// ============================================
//  СБРОС ФОРМЫ
// ============================================
const resetForm = () => {
  form.value = {
    equipment_ids: props.equipmentId ? [props.equipmentId] : [],
    detection_date: getCurrentDateTimeLocal(),
    nature_of_malfunction: '',
    detected_by: '',
    repair_possibility: 'Самостоятельно'
  };
};

// ============================================
//  WATCH: visible
// ============================================
watch(() => props.visible, (val) => {
  toggleBodyScroll(val);

  if (!val) return;

  if (props.repair) {
    fillForm(props.repair);
  } else {
    resetForm();
  }
}, { immediate: false });

// ============================================
//  WATCH: repair (когда drawer уже открыт)
// ============================================
watch(() => props.repair, (val) => {
  if (!props.visible) return;

  if (val) {
    fillForm(val);
  } else {
    resetForm();
  }
});

// ============================================
//  ЗАГРУЗКА ОБОРУДОВАНИЯ
// ============================================
const loadEquipment = async () => {
  try {
    const { data } = await equipmentApi.getAll();
    equipmentList.value = data;
  } catch (error) {
    console.error('Error loading equipment:', error);
    toast.error(error?.response?.data?.message || 'Ошибка загрузки списка оборудования');
  }
};

// ============================================
//  ЗАКРЫТИЕ
// ============================================
const close = () => {
  toggleBodyScroll(false);
  emit('close');
};

// ============================================
//  SUBMIT
// ============================================
const submit = async () => {
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

    const detectionDate = form.value.detection_date.length === 16
      ? form.value.detection_date + ':00'
      : form.value.detection_date;

    const payload = {
      equipment_ids: form.value.equipment_ids,
      detection_date: detectionDate,
      nature_of_malfunction: form.value.nature_of_malfunction,
      detected_by: form.value.detected_by,
      repair_possibility: form.value.repair_possibility
    };

    if (props.repair) {
      await repairsApi.update(props.repair.id, payload);
      toast.success('Заявка обновлена');
    } else {
      const result = await repairsApi.create(payload);
      toast.success(result?.message || 'Заявки созданы');
    }

    emit('save');
    close();
  } catch (error) {
    toast.error(error?.response?.data?.message || 'Ошибка сохранения');
  } finally {
    loading.value = false;
  }
};

// ============================================
//  LIFECYCLE
// ============================================
onMounted(loadEquipment);

onBeforeUnmount(() => {
  toggleBodyScroll(false);
});
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9998;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
}

.drawer-overlay-visible {
  opacity: 1;
  pointer-events: auto;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 620px;
  height: 100vh;
  background: white;
  z-index: 9999;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  will-change: transform;
}

.drawer-open {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
  background: white;
}

.drawer-header h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-header h3 .header-icon {
  width: 20px;
  height: 20px;
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
  transition: color 0.2s;
}

.btn-close:hover {
  color: #212529;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.drawer-body::-webkit-scrollbar {
  width: 6px;
}

.drawer-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.drawer-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.drawer-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-group label .label-icon {
  width: 16px;
  height: 16px;
  stroke: #495057;
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
  position: sticky;
  bottom: 0;
  background: white;
  padding-bottom: 4px;
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

.btn .btn-icon.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

@media (max-width: 768px) {
  .drawer {
    width: 90%;
  }
  
  .drawer-header {
    padding: 16px 20px;
  }
  
  .drawer-body {
    padding: 16px 20px;
  }
}

@media (max-width: 480px) {
  .drawer {
    width: 100%;
  }
  
  .drawer-header h3 {
    font-size: 17px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>