<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ lesson ? '✏️ Редактировать занятие' : '📚 Создать занятие' }}</h3>
        <button class="btn-close" @click="close">×</button>
      </div>

      <form @submit.prevent="submit">
        <!-- Название занятия -->
        <div class="form-group">
          <label>Название занятия *</label>
          <input
            v-model="form.title"
            type="text"
            class="form-control"
            placeholder="Например: Практическое занятие по СЛР"
            required
          />
        </div>

        <div class="form-row">
          <!-- Группа -->
          <div class="form-group">
            <label>Курс / Группа *</label>
            <input
              v-model="form.group"
              type="text"
              class="form-control"
              placeholder="Например: ФИ-21"
              required
            />
          </div>

          <!-- Преподаватель -->
          <div class="form-group">
            <label>Преподаватель *</label>
            <input
              v-model="form.teacher"
              type="text"
              class="form-control"
              placeholder="Иванов И.И."
              required
            />
          </div>
        </div>

        <div class="form-row">
          <!-- Количество студентов -->
          <div class="form-group">
            <label>Кол-во студентов</label>
            <input
              v-model="form.students_count"
              type="number"
              class="form-control"
              min="0"
            />
          </div>

          <!-- Дата -->
          <div class="form-group">
            <label>Дата *</label>
            <input
              v-model="form.date"
              type="date"
              class="form-control"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <!-- Время начала -->
          <div class="form-group">
            <label>Время начала *</label>
            <input
              v-model="form.start_time"
              type="time"
              class="form-control"
              required
            />
          </div>

          <!-- Время окончания -->
          <div class="form-group">
            <label>Время окончания *</label>
            <input
              v-model="form.end_time"
              type="time"
              class="form-control"
              required
            />
          </div>
        </div>

        <!-- Шаблон -->
        <div class="form-group">
          <label>Использовать шаблон для занятия</label>
          <select v-model="form.template_id" class="form-control">
            <option :value="null">— Без шаблона —</option>
            <option
              v-for="template in templates"
              :key="template.id"
              :value="template.id"
            >
              {{ template.title }}
            </option>
          </select>
          <small class="form-text text-muted">
            {{ form.template_id ? 'Оборудование будет скопировано из шаблона' : 'Оборудование можно добавить вручную' }}
          </small>
        </div>

        <!-- Статус -->
        <div class="form-group">
          <label>Статус</label>
          <select v-model="form.status" class="form-control">
            <option value="Запланировано">Запланировано</option>
            <option value="Проведено">Проведено</option>
            <option value="Отменено">Отменено</option>
          </select>
        </div>

        <!-- Примечания -->
        <div class="form-group">
          <label>Примечания</label>
          <textarea
            v-model="form.notes"
            class="form-control"
            rows="2"
            placeholder="Дополнительная информация..."
          ></textarea>
        </div>

        <!-- Оборудование (ручное добавление, если нет шаблона) -->
        <div v-if="!form.template_id" class="form-group">
          <label>Оборудование (опционально)</label>
          <div class="equipment-list">
            <div
              v-for="(item, index) in equipmentList"
              :key="index"
              class="equipment-item"
            >
              <EquipmentSelect
                v-model="item.equipment_id"
                :equipment-options="equipmentOptions"
                placeholder="Введите название или инв. номер..."
                only-working
                @select="onEquipmentSelect"
              />
              <input
                v-model="item.quantity"
                type="number"
                class="form-control"
                placeholder="Кол-во"
                min="1"
                style="width: 80px;"
              />
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                @click="removeEquipment(index)"
              >
                ✕
              </button>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-outline-primary"
            @click="addEquipment"
          >
            ➕ Добавить оборудование
          </button>
          <small v-if="brokenCount > 0" style="color: #dc3545; display: block; margin-top: 6px;">
            ⚠️ {{ brokenCount }} единиц оборудования в ремонте, требует ремонта или на списании
          </small>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-outline-secondary" @click="close">
            Отмена
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { lessonsApi, templatesApi, equipmentApi } from '../../api';
import { useToastStore } from '../../stores/toastStore';
import EquipmentSelect from '../../components/EquipmentSelect.vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  lesson: { type: Object, default: null }
});

const emit = defineEmits(['close', 'save']);

const toast = useToastStore();
const loading = ref(false);
const templates = ref([]);
const equipmentOptions = ref([]);
const equipmentList = ref([]);

const form = ref({
  title: '',
  group: '',
  teacher: '',
  students_count: 0,
  date: '',
  start_time: '',
  end_time: '',
  template_id: null,
  status: 'Запланировано',
  notes: ''
});

const brokenCount = computed(() => {
  return equipmentOptions.value.filter(eq => 
    eq.working_status !== 'Исправен' || 
    eq.write_off_status === 'На списание' || 
    eq.write_off_status === 'Списан'
  ).length;
});

const onEquipmentSelect = (item) => {
  // Дополнительная логика при выборе
};

const loadData = async () => {
  try {
    const [templatesRes, equipmentRes] = await Promise.all([
      templatesApi.getAll(),
      equipmentApi.getAll()
    ]);
    templates.value = templatesRes.data || [];
    equipmentOptions.value = equipmentRes.data || [];
  } catch (error) {
    toast.error(error?.response?.data?.message || 'Ошибка загрузки данных');
  }
};

const addEquipment = () => {
  equipmentList.value.push({
    equipment_id: null,
    quantity: 1
  });
};

const removeEquipment = (index) => {
  equipmentList.value.splice(index, 1);
};

const normalizeEquipmentList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
};

watch(() => props.lesson, (val) => {
  if (val) {
    form.value = {
      title: val.title || '',
      group: val.group || '',
      teacher: val.teacher || '',
      students_count: val.students_count || 0,
      date: val.date || '',
      start_time: val.start_time || '',
      end_time: val.end_time || '',
      template_id: val.template_id || null,
      status: val.status || 'Запланировано',
      notes: val.notes || ''
    };
    equipmentList.value = normalizeEquipmentList(val.equipment_list);
  } else {
    const today = new Date().toISOString().split('T')[0];
    form.value = {
      title: '',
      group: '',
      teacher: '',
      students_count: 0,
      date: today,
      start_time: '09:00',
      end_time: '11:00',
      template_id: null,
      status: 'Запланировано',
      notes: ''
    };
    equipmentList.value = [];
  }
}, { immediate: true });

const close = () => emit('close');

const submit = async () => {
  if (!form.value.title.trim()) {
    toast.warning('Введите название занятия');
    return;
  }
  if (!form.value.group.trim()) {
    toast.warning('Введите группу');
    return;
  }
  if (!form.value.teacher.trim()) {
    toast.warning('Введите преподавателя');
    return;
  }
  if (!form.value.date) {
    toast.warning('Выберите дату');
    return;
  }
  if (!form.value.start_time) {
    toast.warning('Выберите время начала');
    return;
  }
  if (!form.value.end_time) {
    toast.warning('Выберите время окончания');
    return;
  }

  try {
    loading.value = true;

    const invalidEquipment = [];
    
    if (form.value.template_id) {
      const template = templates.value.find(t => t.id === form.value.template_id);
      if (template && template.equipment_list) {
        const templateEquip = typeof template.equipment_list === 'string' 
          ? JSON.parse(template.equipment_list) 
          : template.equipment_list;
        
        for (const item of templateEquip) {
          const eq = equipmentOptions.value.find(e => e.id === item.equipment_id);
          if (eq && eq.working_status !== 'Исправен') {
            invalidEquipment.push(`${eq.name} (статус: ${eq.working_status})`);
          }
        }
      }
    }
    
    for (const item of equipmentList.value) {
      if (item.equipment_id) {
        const eq = equipmentOptions.value.find(e => e.id === item.equipment_id);
        if (eq && eq.working_status !== 'Исправен') {
          invalidEquipment.push(`${eq.name} (статус: ${eq.working_status})`);
        }
      }
    }

    if (invalidEquipment.length > 0) {
      toast.error(`❌ Оборудование не может быть использовано: ${invalidEquipment.join(', ')}`);
      loading.value = false;
      return;
    }

    const filteredEquipment = equipmentList.value.filter(item => item.equipment_id);

    const data = {
      ...form.value,
      equipment_list: filteredEquipment
    };

    if (props.lesson) {
      await lessonsApi.update(props.lesson.id, data);
      toast.success('✅ Занятие обновлено');
    } else {
      await lessonsApi.create(data);
      toast.success('✅ Занятие создано');
    }

    emit('save');
    close();
  } catch (error) {
    toast.error(error?.response?.data?.message || error?.message || 'Ошибка сохранения');
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);
</script>

<style scoped>
/* Все стили остаются без изменений */
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
  width: 620px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

.form-text {
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
}

.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.equipment-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.equipment-item .form-control:last-child {
  flex: none;
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

.btn-outline-primary {
  background: transparent;
  color: #0d6efd;
  border: 1px solid #0d6efd;
}

.btn-outline-primary:hover {
  background: #0d6efd;
  color: white;
}

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
  padding: 4px 10px;
  font-size: 14px;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 13px;
}
</style>