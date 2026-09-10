<template>
  <Teleport to="body">
    <div 
      class="drawer-wrapper" 
      :class="{ 'drawer-open': visible }"
    >
      <div class="drawer-overlay" @click="close"></div>

      <div class="drawer">
        <div class="drawer-header">
          <h3>
            <IconEdit v-if="template" class="header-icon" />
            <IconPlus v-else class="header-icon" />
            {{ template ? 'Редактировать шаблон' : 'Создать шаблон' }}
          </h3>
          <button class="btn-close" @click="close">×</button>
        </div>

        <div class="drawer-body">
          <form @submit.prevent="submit">
            <!-- Название -->
            <div class="form-group">
              <label>
                <IconBook class="label-icon" />
                Название шаблона *
              </label>
              <input
                v-model="form.title"
                type="text"
                class="form-control"
                placeholder="Например: Акушерство"
                required
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>
                  <IconBook class="label-icon" />
                  Дисциплина *
                </label>
                <input
                  v-model="form.discipline"
                  type="text"
                  class="form-control"
                  placeholder="Например: Акушерство"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label>
                <IconList class="label-icon" />
                Описание
              </label>
              <textarea
                v-model="form.description"
                class="form-control"
                rows="2"
                placeholder="Дополнительная информация..."
              ></textarea>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="form.is_active" type="checkbox" />
                Активен
              </label>
              <small class="form-text text-muted">
                Неактивные шаблоны не отображаются при создании занятий
              </small>
            </div>

            <!-- Оборудование -->
            <div class="form-group">
              <label>
                <IconEquipment class="label-icon" />
                Оборудование
              </label>
              
              <EquipmentSelect
                v-model="equipmentIds"
                :equipment-options="allEquipment"
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
    </div>

    <!-- ✅ ВЫНЕСЕННАЯ МОДАЛКА -->
    <SyncLessonsModal
        v-if="showSyncModal"
        :lessons="linkedLessons"
        :syncing="syncing"
        @confirm="handleSyncConfirm"
        @cancel="handleSyncCancel"
    />
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, computed, onBeforeUnmount } from 'vue';
import { useEquipmentStore, useTemplatesStore } from '../../stores';
import { useToastStore } from '../../stores/toastStore';
import EquipmentSelect from '../../components/EquipmentSelect.vue';
import SyncLessonsModal from '../../components/templates/SyncLessonsModal.vue';
import {
  IconEdit,
  IconPlus,
  IconBook,
  IconList,
  IconEquipment,
  IconClose,
  IconSave,
  IconLoading
} from '../icons';

const props = defineProps({
  visible: { type: Boolean, default: false },
  template: { type: Object, default: null }
});

const emit = defineEmits(['close', 'save']);

const equipmentStore = useEquipmentStore();
const templatesStore = useTemplatesStore();
const toast = useToastStore();

const loading = ref(false);
const equipmentIds = ref([]);

const showSyncModal = ref(false);
const linkedLessons = ref([]);
const syncing = ref(false);
let pendingTemplateId = null;

const form = ref({
  title: '',
  discipline: '',
  description: '',
  is_active: true
});

const allEquipment = computed(() => {
  return equipmentStore.allEquipment || [];
});

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

const close = () => {
  toggleBodyScroll(false);
  emit('close');
};

const normalizeEquipmentList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.map(item => item.equipment_id).filter(id => id !== null);
  }
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map(item => item.equipment_id).filter(id => id !== null);
      }
    } catch {
      return [];
    }
  }
  return [];
};

// ============================================
//  СБРОС ФОРМЫ
// ============================================
const resetForm = () => {
  form.value = {
    title: '',
    discipline: '',
    description: '',
    is_active: true
  };
  equipmentIds.value = [];
};

// ============================================
//  ЗАПОЛНЕНИЕ ИЗ TEMPLATE
// ============================================
const fillForm = (val) => {
  form.value = {
    title: val.title || '',
    discipline: val.discipline || '',
    description: val.description || '',
    is_active: val.is_active !== undefined ? val.is_active : true
  };
  equipmentIds.value = normalizeEquipmentList(val.equipment_list);
};

// ============================================
//  SUBMIT
// ============================================
const submit = async () => {
  if (!form.value.title.trim()) {
    toast.warning('Введите название шаблона');
    return;
  }
  if (!form.value.discipline.trim()) {
    toast.warning('Введите дисциплину');
    return;
  }
  if (equipmentIds.value.length === 0) {
    toast.warning('Выберите оборудование для шаблона');
    return;
  }

  try {
    loading.value = true;

    const equipmentWithQuantity = equipmentIds.value.map(id => ({
      equipment_id: id,
      quantity: 1
    }));

    const data = {
      title: form.value.title,
      discipline: form.value.discipline,
      description: form.value.description || '',
      is_active: form.value.is_active,
      equipment_list: equipmentWithQuantity
    };

    let response;

    if (props.template) {
      response = await templatesStore.update(props.template.id, data);

      if (response?.hasLinkedLessons) {
        pendingTemplateId = props.template.id;

        const notCompleted = (response.linkedLessons || []).filter(
          l => l.status !== 'Проведено'
        );

        if (notCompleted.length === 0) {
          toast.info('Шаблон обновлён. Все связанные занятия уже проведены');
          emit('save');
          close();
          loading.value = false;
          return;
        }

        linkedLessons.value = notCompleted;
        showSyncModal.value = true;
        loading.value = false;
        return;
      }

      toast.success('Шаблон обновлён');
    } else {
      await templatesStore.create(data);
      toast.success('Шаблон создан');
    }

    emit('save');
    close();
  } catch (error) {
    console.error('Ошибка:', error);
    toast.error(error?.response?.data?.message || 'Ошибка сохранения');
  } finally {
    loading.value = false;
  }
};

// ============================================
//  ДЕЙСТВИЯ В МОДАЛКЕ
// ============================================
const handleSyncConfirm = async (selectedIds) => {
  try {
    syncing.value = true;

    const result = await templatesStore.syncLessons(
      pendingTemplateId,
      selectedIds
    );

    if (result?.errors?.length) {
      toast.error(
        `Обновлено ${result.updated} из ${result.total}. Ошибок: ${result.errors.length}`
      );
    } else {
      toast.success(`Обновлено ${result?.updated ?? selectedIds.length} занятий`);
    }

    resetSyncState();
    emit('save');
    close();
  } catch (error) {
    console.error('Ошибка синхронизации:', error);
    toast.error(error?.response?.data?.message || 'Ошибка синхронизации занятий');
  } finally {
    syncing.value = false;
  }
};

const handleSyncCancel = () => {
  resetSyncState();
  emit('save');
  close();
};

const resetSyncState = () => {
  showSyncModal.value = false;
  linkedLessons.value = [];
  pendingTemplateId = null;
};

// ============================================
//  WATCH: visible
// ============================================
watch(() => props.visible, (val) => {
  toggleBodyScroll(val);

  if (!val) {
    resetSyncState();
    return;
  }

  if (props.template) {
    fillForm(props.template);
  } else {
    resetForm();
  }
}, { immediate: false });

// ============================================
//  WATCH: template (когда drawer уже открыт)
// ============================================
watch(() => props.template, (val) => {
  if (!props.visible) return;

  if (val) {
    fillForm(val);
  } else {
    resetForm();
  }
});

// ============================================
//  LIFECYCLE
// ============================================
onMounted(async () => {
  if (equipmentStore.allEquipment.length === 0) {
    await equipmentStore.fetchAll();
  }
});

onBeforeUnmount(() => {
  toggleBodyScroll(false);
});
</script>

<style scoped>
/* ============================================
   DRAWER
   ============================================ */
.drawer-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9998;
  pointer-events: none;
}

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
  display: flex;
  flex-direction: column;
  will-change: transform;
  pointer-events: none;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-wrapper.drawer-open {
  pointer-events: auto;
}

.drawer-wrapper.drawer-open .drawer-overlay {
  opacity: 1;
  pointer-events: auto;
}

.drawer-wrapper.drawer-open .drawer {
  transform: translateX(0);
  pointer-events: auto;
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 400;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
  cursor: pointer;
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

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 768px) {
  .drawer {
    width: 90%;
  }

  .drawer-body {
    padding: 16px 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
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