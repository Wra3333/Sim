<template>
  <Teleport to="body">
    <!-- ОВЕРЛЕЙ ДЛЯ ЗАТЕМНЕНИЯ -->
    <div 
      class="drawer-overlay" 
      :class="{ 'drawer-overlay-visible': visible }"
      @click="close"
    ></div>

    <!-- ВЫДВИЖНАЯ ПАНЕЛЬ СПРАВА -->
    <div 
      class="drawer" 
      :class="{ 'drawer-open': visible }"
    >
      <div class="drawer-header">
        <h3>
          <IconEdit v-if="lesson" class="header-icon" />
          <IconPlus v-else class="header-icon" />
          {{ lesson ? 'Редактировать занятие' : 'Создать занятие' }}
        </h3>
        <button class="btn-close" @click="close">×</button>
      </div>

      <div class="drawer-body">
        <form @submit.prevent="submit">
          <!-- Название -->
          <div class="form-group">
            <label>
              <IconFileText class="label-icon" />
              Название занятия *
            </label>
            <input v-model="form.title" type="text" class="form-control" placeholder="Например: Практическое занятие по СЛР" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>
                <IconUser class="label-icon" />
                Преподаватель *
              </label>
              <input v-model="form.teacher" type="text" class="form-control" placeholder="Иванов И.И." required />
            </div>
            <div class="form-group">
              <label>
                <IconCalendar class="label-icon" />
                Дата *
              </label>
              <input v-model="form.date" type="date" class="form-control" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>
                <IconClock class="label-icon" />
                Время начала *
              </label>
              <input v-model="form.start_time" type="time" class="form-control" required />
            </div>
            <div class="form-group">
              <label>
                <IconClock class="label-icon" />
                Время окончания *
              </label>
              <input v-model="form.end_time" type="time" class="form-control" required />
            </div>
          </div>

          <!-- ГРУППА И КОЛИЧЕСТВО СТУДЕНТОВ -->
          <div class="form-row">
            <div class="form-group">
              <label>
                <IconUsers class="label-icon" />
                Группа
              </label>
              <input 
                v-model="form.group" 
                type="text" 
                class="form-control" 
                placeholder="Например: ФИ-21" 
                list="groupsList"
              />
              <datalist id="groupsList">
                <option v-for="group in availableGroups" :key="group" :value="group" />
              </datalist>
            </div>
            <div class="form-group">
              <label>
                <IconUsers class="label-icon" />
                Кол-во студентов
              </label>
              <input 
                v-model.number="form.students_count" 
                type="number" 
                class="form-control" 
                min="0"
              />
            </div>
          </div>

          <!-- КАТЕГОРИЯ УЧАСТНИКОВ -->
          <div class="form-group">
            <label>
              <IconUser class="label-icon" />
              Категория участников
            </label>
            <select v-model="form.participant_type" class="form-control">
              <option value="">Не указана</option>
              <option value="student">Студенты</option>
              <option value="intern">Интерны</option>
              <option value="resident">Ординаторы</option>
              <option value="doctor">Врачи</option>
              <option value="nurse">Медсестры</option>
            </select>
          </div>

          <!-- Шаблон -->
          <div class="form-group">
            <label>
              <IconTemplates class="label-icon" />
              Использовать шаблон
            </label>
            <div class="template-select-wrapper">
              <select v-model="form.template_id" class="form-control" @change="loadTemplateEquipment">
                <option :value="null">— Без шаблона —</option>
                <option v-for="template in activeTemplates" :key="template.id" :value="template.id">
                  {{ template.title }}
                </option>
              </select>
              <button v-if="form.template_id" type="button" class="btn btn-sm btn-outline-danger" @click="clearTemplate">
                <IconTrash class="btn-icon" />
                Убрать
              </button>
            </div>
            <small class="form-text text-muted">
              {{ form.template_id ? 'Название и оборудование будет скопировано из шаблона' : 'Оборудование можно добавить вручную' }}
            </small>
          </div>

          <!-- Статус -->
          <div class="form-group">
            <label>
              <IconAlert class="label-icon" />
              Статус
            </label>
            <select v-model="form.status" class="form-control">
              <option value="Запланировано">Запланировано</option>
              <option value="Проведено">Проведено</option>
              <option value="Отменено">Отменено</option>
            </select>
            <small v-if="form.status === 'Проведено' && equipmentList.length > 0" style="color: #0d6efd; display: block; margin-top: 4px;">
              <IconCheck class="info-icon" />
              Будет создана запись в учете времени
            </small>
          </div>

          <!-- Примечания -->
          <div class="form-group">
            <label>
              <IconFileText class="label-icon" />
              Примечания
            </label>
            <textarea v-model="form.notes" class="form-control" rows="2" placeholder="Дополнительная информация..."></textarea>
          </div>

          <!-- Оборудование -->
          <div class="form-group">
            <label>
              <IconEquipment class="label-icon" />
              Оборудование
            </label>
            
            <EquipmentSelect
              v-model="equipmentList"
              :equipment-options="allEquipment"
              :only-working="true"
              placeholder="Выберите оборудование..."
            />
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline-secondary" @click="close">
              <IconClose class="btn-icon" />
              Отмена
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <IconSave v-if="!loading" class="btn-icon" />
              <IconLoading v-else class="btn-icon spin" />
              {{ loading ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, computed, onBeforeUnmount } from 'vue';
import { useEquipmentStore, useTemplatesStore } from '../../stores';
import { useToastStore } from '../../stores/toastStore';
import { useFormatters } from '../../composables/useFormatters';
import { useStatusClasses } from '../../composables/useStatusClasses';
import EquipmentSelect from '../../components/EquipmentSelect.vue';
import { lessonsApi } from '../../api';
import {
  IconEdit,
  IconPlus,
  IconFileText,
  IconUsers,
  IconUser,
  IconCalendar,
  IconClock,
  IconTemplates,
  IconTrash,
  IconAlert,
  IconCheck,
  IconEquipment,
  IconClose,
  IconSave,
  IconLoading
} from '../icons';

// ============================================
//  PROPS & EMITS
// ============================================
const props = defineProps({
  visible: { type: Boolean, default: false },
  lesson: { type: Object, default: null }
});

const emit = defineEmits(['close', 'save']);

// ============================================
//  STORE
// ============================================
const equipmentStore = useEquipmentStore();
const templatesStore = useTemplatesStore();
const toast = useToastStore();

// ============================================
//  КОМПОЗАБЛЫ
// ============================================
const { formatDate } = useFormatters();
const { getEquipmentStatusClass } = useStatusClasses();

// ============================================
//  СОСТОЯНИЕ
// ============================================
const loading = ref(false);
const equipmentList = ref([]);

// ✅ ДОСТУПНЫЕ ГРУППЫ
const availableGroups = ref([
  'ФИ-21', 'ФИ-22', 'ФИ-23',
  'ЛД-31', 'ЛД-32',
  'ПЕД-41', 'ПЕД-42',
  'СТОМ-51'
]);

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
  notes: '',
  participant_type: '' // ✅ ТОЛЬКО КАТЕГОРИЯ
});

// ============================================
//  ВЫЧИСЛЯЕМЫЕ
// ============================================
const activeTemplates = computed(() => {
  return templatesStore.items.filter(t => t.is_active === true);
});

const allEquipment = computed(() => {
  return equipmentStore.items || [];
});

// ============================================
//  БЛОКИРОВКА СКРОЛЛА
// ============================================
const toggleBodyScroll = (disable) => {
  if (disable) {
    document.documentElement.style.overflow = 'hidden';
  } else {
    document.documentElement.style.overflow = '';
  }
};

// ============================================
//  МЕТОДЫ
// ============================================
const loadTemplateEquipment = () => {
  if (form.value.template_id) {
    const template = templatesStore.getById(form.value.template_id);
    if (template) {
      if (!props.lesson) {
        form.value.title = template.title || '';
      }
      
      if (template?.equipment_list) {
        let equipList = template.equipment_list;
        if (typeof equipList === 'string') {
          try { equipList = JSON.parse(equipList); } catch { equipList = []; }
        }
        equipmentList.value = equipList.map(item => item.equipment_id);
        toast.info(`Загружено ${equipList.length} единиц оборудования из шаблона "${template.title}"`);
      }
    }
  } else {
    equipmentList.value = [];
  }
};

const clearTemplate = () => {
  form.value.template_id = null;
  equipmentList.value = [];
  if (!props.lesson) {
    form.value.title = '';
  }
  toast.info('Шаблон удален');
};

const close = () => {
  toggleBodyScroll(false);
  emit('close');
};

// ============================================
//  SUBMIT
// ============================================
const submit = async () => {
  if (!form.value.title.trim()) {
    toast.warning('Введите название занятия');
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

  if (equipmentList.value.length === 0) {
    toast.warning('Выберите оборудование для занятия');
    return;
  }

  const invalidEquipment = [];
  for (const id of equipmentList.value) {
    const eq = equipmentStore.getById(id);
    if (eq && eq.working_status !== 'Исправен') {
      invalidEquipment.push(`${eq.name} (статус: ${eq.working_status})`);
    }
  }

  if (invalidEquipment.length > 0) {
    toast.error(`Оборудование не может быть использовано: ${invalidEquipment.join(', ')}`);
    return;
  }

  try {
    loading.value = true;

    const equipmentWithQuantity = equipmentList.value.map(id => ({
      equipment_id: id,
      quantity: 1
    }));

    const data = {
      title: form.value.title,
      group: form.value.group || '',
      teacher: form.value.teacher,
      students_count: Number(form.value.students_count) || 0,
      date: form.value.date,
      start_time: form.value.start_time,
      end_time: form.value.end_time,
      status: form.value.status,
      notes: form.value.notes || '',
      equipment_list: equipmentWithQuantity,
      template_id: form.value.template_id,
      participant_type: form.value.participant_type || '' // ✅ ТОЛЬКО КАТЕГОРИЯ
    };

    if (props.lesson) {
      await lessonsApi.update(props.lesson.id, data);
      toast.success('Занятие обновлено');
    } else {
      await lessonsApi.create(data);
      if (data.status === 'Проведено' && data.equipment_list.length > 0) {
        toast.success('Занятие создано! Записи в учете времени добавлены автоматически.');
      } else {
        toast.success('Занятие создано');
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
//  WATCH
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
      notes: val.notes || '',
      participant_type: val.participant_type || '' // ✅ ТОЛЬКО КАТЕГОРИЯ
    };
    
    if (val.equipment_list && Array.isArray(val.equipment_list)) {
      equipmentList.value = val.equipment_list.map(item => item.equipment_id);
    } else {
      equipmentList.value = [];
    }
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
      notes: '',
      participant_type: '' // ✅ ТОЛЬКО КАТЕГОРИЯ
    };
    equipmentList.value = [];
  }
}, { immediate: true });

// ============================================
//  БЛОКИРОВКА СКРОЛЛА ПРИ ОТКРЫТИИ/ЗАКРЫТИИ
// ============================================
watch(() => props.visible, (val) => {
  toggleBodyScroll(val);
}, { immediate: true });

// ============================================
//  ОБРАБОТЧИКИ
// ============================================
const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.visible) {
    close();
  }
  if (e.key === 'Enter' && props.visible && e.target.tagName !== 'TEXTAREA') {
    const formEl = e.target.closest('form');
    if (formEl) {
      e.preventDefault();
      formEl.dispatchEvent(new Event('submit'));
    }
  }
};

// ============================================
//  LIFECYCLE
// ============================================
onMounted(async () => {
  await Promise.all([
    templatesStore.fetchAll(),
    equipmentStore.fetchAll()
  ]);
  
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
  toggleBodyScroll(false);
});
</script>

<style scoped>
/* ============================================
   ОВЕРЛЕЙ (ЗАТЕМНЕНИЕ)
   ============================================ */
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

/* ============================================
   ВЫДВИЖНАЯ ПАНЕЛЬ
   ============================================ */
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

/* ============================================
   ШАПКА
   ============================================ */
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
  background: white;
  border-radius: 0;
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

/* ============================================
   ТЕЛО (СКРОЛЛ)
   ============================================ */
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

/* ============================================
   ФОРМА
   ============================================ */
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

.info-icon {
  width: 14px;
  height: 14px;
  stroke: #0d6efd;
  display: inline-block;
  vertical-align: middle;
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

/* ============================================
   КНОПКИ ВНИЗУ
   ============================================ */
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

.btn-sm {
  padding: 4px 10px;
  font-size: 13px;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
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
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .template-select-wrapper {
    flex-direction: column;
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