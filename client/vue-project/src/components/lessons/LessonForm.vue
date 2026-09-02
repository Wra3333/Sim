<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useEquipmentStore, useTemplatesStore } from '../../stores';
import { useToastStore } from '../../stores/toastStore';
import { useFormatters } from '../../composables/useFormatters';
import { useStatusClasses } from '../../composables/useStatusClasses';
import EquipmentSelect from '../../components/EquipmentSelect.vue';

// ============================================
// ✅ PROPS & EMITS
// ============================================
const props = defineProps({
  visible: { type: Boolean, default: false },
  lesson: { type: Object, default: null }
});

const emit = defineEmits(['close', 'save']);

// ============================================
// ✅ STORE
// ============================================
const equipmentStore = useEquipmentStore();
const templatesStore = useTemplatesStore();
const toast = useToastStore();

// ============================================
// ✅ КОМПОЗАБЛЫ
// ============================================
const { formatDate } = useFormatters();
const { getEquipmentStatusClass } = useStatusClasses();

// ============================================
// ✅ СОСТОЯНИЕ
// ============================================
const loading = ref(false);
const equipmentList = ref([]);
const newEquipmentId = ref(null);
const newQuantity = ref(1);

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

// ============================================
// ✅ ВЫЧИСЛЯЕМЫЕ
// ============================================
const activeTemplates = computed(() => {
  return templatesStore.items.filter(t => t.is_active === true);
});

const availableEquipment = computed(() => {
  const usedIds = equipmentList.value.map(item => item.equipment_id);
  return equipmentStore.items.filter(eq => 
    eq.working_status === 'Исправен' && 
    !usedIds.includes(eq.id)
  );
});

const brokenCount = computed(() => {
  return equipmentStore.items.filter(eq => 
    eq.working_status !== 'Исправен' || 
    eq.write_off_status === 'На списание' || 
    eq.write_off_status === 'Списан'
  ).length;
});

// ============================================
// ✅ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
const getEquipmentName = (id) => {
  const eq = equipmentStore.getById(id);
  return eq?.name || `ID: ${id}`;
};

const getEquipmentStatus = (id) => {
  const eq = equipmentStore.getById(id);
  return eq?.working_status || null;
};

const normalizeEquipmentList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return []; }
  }
  return [];
};

// ============================================
// ✅ МЕТОДЫ
// ============================================
const loadTemplateEquipment = () => {
  if (form.value.template_id) {
    const template = templatesStore.getById(form.value.template_id);
    if (template?.equipment_list) {
      let equipList = template.equipment_list;
      if (typeof equipList === 'string') {
        try { equipList = JSON.parse(equipList); } catch { equipList = []; }
      }
      equipmentList.value = equipList;
      toast.info(`📋 Загружено ${equipList.length} единиц оборудования из шаблона`);
    }
  } else {
    equipmentList.value = [];
  }
};

const clearTemplate = () => {
  form.value.template_id = null;
  equipmentList.value = [];
  toast.info('Шаблон удален');
};

const addEquipment = (item) => {
  if (item) {
    equipmentList.value.push({
      equipment_id: item.id,
      quantity: newQuantity.value || 1
    });
    newEquipmentId.value = null;
    newQuantity.value = 1;
  }
};

const addEquipmentManually = () => {
  if (newEquipmentId.value) {
    const eq = equipmentStore.getById(newEquipmentId.value);
    if (eq) {
      equipmentList.value.push({
        equipment_id: eq.id,
        quantity: newQuantity.value || 1
      });
      newEquipmentId.value = null;
      newQuantity.value = 1;
    }
  }
};

const removeEquipment = (index) => {
  equipmentList.value.splice(index, 1);
};

const close = () => emit('close');

// ============================================
// ✅ SUBMIT
// ============================================
const submit = async () => {
  // Валидация
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

  // Проверка оборудования
  const invalidEquipment = [];
  for (const item of equipmentList.value) {
    const eq = equipmentStore.getById(item.equipment_id);
    if (eq && eq.working_status !== 'Исправен') {
      invalidEquipment.push(`${eq.name} (статус: ${eq.working_status})`);
    }
  }

  if (invalidEquipment.length > 0) {
    toast.error(`❌ Оборудование не может быть использовано: ${invalidEquipment.join(', ')}`);
    return;
  }

  try {
    loading.value = true;

    const data = {
      title: form.value.title,
      group: form.value.group,
      teacher: form.value.teacher,
      students_count: form.value.students_count || 0,
      date: form.value.date,
      start_time: form.value.start_time,
      end_time: form.value.end_time,
      status: form.value.status,
      notes: form.value.notes || '',
      equipment_list: equipmentList.value.filter(item => item.equipment_id),
      template_id: form.value.template_id
    };

    if (props.lesson) {
      await lessonsApi.update(props.lesson.id, data);
      toast.success('✅ Занятие обновлено');
    } else {
      await lessonsApi.create(data);
      if (data.status === 'Проведено' && data.equipment_list.length > 0) {
        toast.success('✅ Занятие создано! Записи в учете времени добавлены автоматически.');
      } else {
        toast.success('✅ Занятие создано');
      }
    }

    emit('save');
    close();
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    toast.error(error?.response?.data?.message || 'Ошибка сохранения');
  } finally {
    loading.value = false;
  }
};

// ============================================
// ✅ WATCH
// ============================================
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

// ============================================
// ✅ LIFECYCLE
// ============================================
onMounted(async () => {
  await Promise.all([
    templatesStore.fetchAll(),
    equipmentStore.fetchAll()
  ]);
});
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ lesson ? '✏️ Редактировать занятие' : '📚 Создать занятие' }}</h3>
        <button class="btn-close" @click="close">×</button>
      </div>

      <form @submit.prevent="submit">
        <!-- Название -->
        <div class="form-group">
          <label>Название занятия *</label>
          <input v-model="form.title" type="text" class="form-control" placeholder="Например: Практическое занятие по СЛР" required />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Курс / Группа *</label>
            <input v-model="form.group" type="text" class="form-control" placeholder="Например: ФИ-21" required />
          </div>
          <div class="form-group">
            <label>Преподаватель *</label>
            <input v-model="form.teacher" type="text" class="form-control" placeholder="Иванов И.И." required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Кол-во студентов</label>
            <input v-model="form.students_count" type="number" class="form-control" min="0" />
          </div>
          <div class="form-group">
            <label>Дата *</label>
            <input v-model="form.date" type="date" class="form-control" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Время начала *</label>
            <input v-model="form.start_time" type="time" class="form-control" required />
          </div>
          <div class="form-group">
            <label>Время окончания *</label>
            <input v-model="form.end_time" type="time" class="form-control" required />
          </div>
        </div>

        <!-- Шаблон -->
        <div class="form-group">
          <label>Использовать шаблон</label>
          <div class="template-select-wrapper">
            <select v-model="form.template_id" class="form-control" @change="loadTemplateEquipment">
              <option :value="null">— Без шаблона —</option>
              <option v-for="template in activeTemplates" :key="template.id" :value="template.id">
                {{ template.title }}
              </option>
            </select>
            <button v-if="form.template_id" type="button" class="btn btn-sm btn-outline-danger" @click="clearTemplate">
              ✕ Убрать
            </button>
          </div>
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
          <small v-if="form.status === 'Проведено' && equipmentList.length > 0" style="color: #0d6efd; display: block; margin-top: 4px;">
            ✅ Будет создана запись в учете времени
          </small>
        </div>

        <!-- Примечания -->
        <div class="form-group">
          <label>Примечания</label>
          <textarea v-model="form.notes" class="form-control" rows="2" placeholder="Дополнительная информация..."></textarea>
        </div>

        <!-- Оборудование -->
        <div class="form-group">
          <label>Оборудование</label>
          
          <div v-if="equipmentList.length > 0" class="equipment-list">
            <div v-for="(item, index) in equipmentList" :key="index" class="equipment-item">
              <span class="eq-name">{{ getEquipmentName(item.equipment_id) }}</span>
              <span class="eq-quantity">× {{ item.quantity }}</span>
              <span v-if="getEquipmentStatus(item.equipment_id)" class="eq-status" :class="getEquipmentStatusClass(getEquipmentStatus(item.equipment_id))">
                {{ getEquipmentStatus(item.equipment_id) }}
              </span>
              <button v-if="!form.template_id" type="button" class="btn btn-sm btn-outline-danger" @click="removeEquipment(index)">
                ✕
              </button>
            </div>
          </div>
          
          <div v-if="!form.template_id" class="add-equipment-row">
            <EquipmentSelect
              v-model="newEquipmentId"
              :equipment-options="availableEquipment"
              placeholder="Выберите оборудование..."
              only-working
              @select="addEquipment"
            />
            <input v-model="newQuantity" type="number" class="form-control" placeholder="Кол-во" min="1" style="width: 80px;" />
            <button type="button" class="btn btn-sm btn-primary" @click="addEquipmentManually" :disabled="!newEquipmentId">
              Добавить
            </button>
          </div>
          
          <small v-if="!form.template_id && brokenCount > 0" style="color: #dc3545; display: block; margin-top: 6px;">
            ⚠️ {{ brokenCount }} единиц оборудования в ремонте, требует ремонта или на списании
          </small>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-outline-secondary" @click="close">Отмена</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </form>
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

.template-select-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.template-select-wrapper .form-control {
  flex: 1;
}

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
  padding: 4px 12px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.equipment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.equipment-item .eq-name {
  flex: 1;
  font-weight: 500;
}

.equipment-item .eq-quantity {
  color: #6c757d;
  font-size: 13px;
}

.equipment-item .eq-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.status-ok {
  background: #d4edda;
  color: #155724;
}

.status-warning {
  background: #fff3cd;
  color: #856404;
}

.status-danger {
  background: #f8d7da;
  color: #721c24;
}

.add-equipment-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.add-equipment-row .form-control:first-child {
  flex: 1;
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

.btn-sm {
  padding: 4px 10px;
  font-size: 13px;
}

@media (max-width: 768px) {
  .modal {
    width: 95%;
    padding: 16px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .template-select-wrapper {
    flex-direction: column;
  }
  
  .add-equipment-row {
    flex-wrap: wrap;
  }
  
  .add-equipment-row .form-control:first-child {
    flex: 1 1 100%;
  }
}
</style>