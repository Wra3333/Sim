<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { useEquipmentStore, useTemplatesStore } from '../../stores';
import { useToastStore } from '../../stores/toastStore';
import { useConfirm } from '../../composables/useConfirm';
import EquipmentSelect from '../../components/EquipmentSelect.vue';
import ConfirmModal from '../../components/ConfirmModal.vue';

// ============================================
// ✅ PROPS & EMITS
// ============================================
const props = defineProps({
  visible: { type: Boolean, default: false },
  template: { type: Object, default: null }
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
const { show, config, confirm, onConfirm, onCancel } = useConfirm();

// ============================================
// ✅ СОСТОЯНИЕ
// ============================================
const loading = ref(false);
const equipmentList = ref([]);

const form = ref({
  title: '',
  discipline: '',
  module: '',
  description: '',
  is_active: true
});

// ============================================
// ✅ ВЫЧИСЛЯЕМЫЕ
// ============================================
const getExcludeIds = (currentIndex) => {
  return equipmentList.value
    .map((item, index) => index !== currentIndex ? item.equipment_id : null)
    .filter(id => id !== null);
};

const brokenCount = computed(() => {
  return equipmentStore.items.filter(eq => 
    eq.working_status !== 'Исправен' || 
    eq.write_off_status === 'На списание' || 
    eq.write_off_status === 'Списан'
  ).length;
});

// ============================================
// ✅ МЕТОДЫ
// ============================================
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

const close = () => emit('close');

// ✅ ОСНОВНОЙ МЕТОД SUBMIT
const submit = async () => {
  if (!form.value.title.trim()) {
    toast.warning('Введите название шаблона');
    return;
  }
  if (!form.value.discipline.trim()) {
    toast.warning('Введите дисциплину');
    return;
  }
  if (!form.value.module.trim()) {
    toast.warning('Введите модуль');
    return;
  }

  try {
    loading.value = true;

    const data = {
      title: form.value.title,
      discipline: form.value.discipline,
      module: form.value.module,
      description: form.value.description || '',
      is_active: form.value.is_active,
      equipment_list: equipmentList.value.filter(item => item.equipment_id !== null)
    };

    let response;

    if (props.template) {
      response = await templatesStore.update(props.template.id, data);
      
      if (response?.hasLinkedLessons) {
        // ✅ Используем useConfirm вместо ручной модалки
        const confirmed = await confirm({
          title: '🔄 Обновить занятия?',
          message: `
            Шаблон был изменен. 
            ${response.linkedLessonsCount} занятий используют этот шаблон.
            
            Хотите обновить существующие занятия?
            
            ⚠️ Проведенные занятия не будут обновлены.
          `,
          confirmText: 'Да, обновить все',
          cancelText: 'Нет, оставить как есть',
          confirmVariant: 'warning'
        });
        
        if (confirmed) {
          await templatesStore.syncLessons(props.template.id);
          toast.success('✅ Занятия обновлены');
        }
        
        emit('save');
        close();
        loading.value = false;
        return;
      }
      
      toast.success('✅ Шаблон обновлен');
    } else {
      await templatesStore.create(data);
      toast.success('✅ Шаблон создан');
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
// ✅ WATCH
// ============================================
watch(() => props.template, (val) => {
  if (val) {
    form.value = {
      title: val.title || '',
      discipline: val.discipline || '',
      module: val.module || '',
      description: val.description || '',
      is_active: val.is_active !== undefined ? val.is_active : true
    };
    equipmentList.value = normalizeEquipmentList(val.equipment_list);
  } else {
    form.value = {
      title: '',
      discipline: '',
      module: '',
      description: '',
      is_active: true
    };
    equipmentList.value = [];
  }
}, { immediate: true });

// ============================================
// ✅ LIFECYCLE
// ============================================
onMounted(async () => {
  if (equipmentStore.items.length === 0) {
    await equipmentStore.fetchAll();
  }
});
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ template ? '✏️ Редактировать шаблон' : '📝 Создать шаблон' }}</h3>
        <button class="btn-close" @click="close">×</button>
      </div>

      <form @submit.prevent="submit">
        <!-- Название -->
        <div class="form-group">
          <label>Название шаблона *</label>
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
            <label>Дисциплина *</label>
            <input
              v-model="form.discipline"
              type="text"
              class="form-control"
              placeholder="Например: Акушерство"
              required
            />
          </div>
          <div class="form-group">
            <label>Модуль *</label>
            <input
              v-model="form.module"
              type="text"
              class="form-control"
              placeholder="Например: Модуль 1"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label>Описание</label>
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
          <label>Оборудование</label>
          <div class="equipment-list">
            <div
              v-for="(item, index) in equipmentList"
              :key="index"
              class="equipment-item"
            >
              <EquipmentSelect
                v-model="item.equipment_id"
                :equipment-options="equipmentStore.items"
                :exclude-ids="getExcludeIds(index)"
                placeholder="Выберите оборудование..."
                only-working
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

      <!-- ✅ МОДАЛЬНОЕ ОКНО ДЛЯ ПОДТВЕРЖДЕНИЯ (useConfirm) -->
      <ConfirmModal
        v-model:visible="show"
        :title="config.title"
        :message="config.message"
        :confirm-text="config.confirmText"
        :cancel-text="config.cancelText"
        :confirm-variant="config.confirmVariant"
        @confirm="onConfirm"
        @cancel="onCancel"
      />
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
  border-radius: 4px;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
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
}
</style>