<template>
  <Teleport to="body">
    <!-- ОВЕРЛЕЙ -->
    <div 
      class="drawer-overlay" 
      :class="{ 'drawer-overlay-visible': open }"
      @click="close"
    ></div>

    <!-- ВЫДВИЖНАЯ ПАНЕЛЬ -->
    <div class="drawer" :class="{ 'drawer-open': open }">
      <div class="drawer-header">
        <h3>
          <IconEdit v-if="equipment" class="header-icon" />
          <IconPlus v-else class="header-icon" />
          {{ equipment ? 'Редактировать оборудование' : 'Добавить оборудование' }}
        </h3>
        <button class="btn-close" @click="close">×</button>
      </div>

      <div class="drawer-body">
        <form @submit.prevent="submit" ref="formRef">
          <!-- Инвентарные номера -->
          <div class="form-row">
            <div class="form-group">
              <label>Инвентарный номер *</label>
              <input v-model="form.inventory_number" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Инвентарное наименование *</label>
              <input v-model="form.inventory_name" class="form-control" required />
            </div>
          </div>

          <!-- Фото -->
          <div class="form-group">
            <label>Фото</label>
            <input type="file" accept="image/*" class="form-control" @change="handleFileUpload" />
            <div v-if="form.photo && !isFileUpload" class="current-photo">
              <span class="label">Текущее фото:</span>
              <button type="button" class="btn-delete-photo" @click="deletePhoto">×</button>
              <img :src="currentPhotoUrl" alt="Текущее фото" />
            </div>
            <div v-if="previewUrl" class="preview-photo">
              <span class="label">Новое фото:</span>
              <img :src="previewUrl" alt="Новое фото" />
            </div>
          </div>

          <div class="form-group">
            <label>Название *</label>
            <input v-model="form.name" class="form-control" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Год закупки</label>
              <input v-model="form.year_of_release" type="number" class="form-control" />
            </div>
            <div class="form-group">
              <label>Стоимость (₽)</label>
              <input v-model="form.price" type="number" class="form-control" step="0.01" />
            </div>
          </div>

          <div class="form-group">
            <label>Описание</label>
            <textarea v-model="form.description" class="form-control" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>Основание закупки</label>
            <input v-model="form.purchase_basis" class="form-control" placeholder="номер договора..." />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Состояние</label>
              <select v-model="form.working_status" class="form-control">
                <option value="Исправен">Исправен</option>
                <option value="Требует ремонта">Требует ремонта</option>
                <option value="В ремонте">В ремонте</option>
              </select>
            </div>
            <div class="form-group">
              <label>Статус списания</label>
              <select v-model="form.write_off_status" class="form-control">
                <option value="На балансе">На балансе</option>
                <option value="На списание">На списание</option>
                <option value="Списан">Списан</option>
              </select>
            </div>
          </div>

          <!-- Теги -->
          <div class="form-group">
            <label>Теги</label>
            <TagManager 
              v-model="form.tags" 
              :all-tags="allExistingTags"
              placeholder="Введите тег и нажмите Enter..."
            />
          </div>

          <!-- Аккордеон доп. полей -->
          <div class="form-group accordion">
            <button type="button" class="accordion-header" @click="isAccordionOpen = !isAccordionOpen">
              <span class="accordion-title">Дополнительные поля</span>
              <span class="accordion-icon">{{ isAccordionOpen ? '−' : '+' }}</span>
            </button>
            <div v-if="isAccordionOpen" class="accordion-content">
              <div class="form-group">
                <label>Оригинальное название</label>
                <input v-model="form.original_name" class="form-control" placeholder="Например: PAT BASIC" />
              </div>
              <div class="form-group">
                <label>Производитель</label>
                <input v-model="form.manufacturer" class="form-control" placeholder="Например: Siemens" />
              </div>
              <div class="form-group">
                <label>Страна</label>
                <input v-model="form.country" class="form-control" placeholder="Например: Япония" />
              </div>
              <div class="form-group">
                <label>Класс реалистичности</label>
                <input v-model="form.realism_class" class="form-control" placeholder="Например: I, II, III..." />
              </div>
            </div>
          </div>

          <!-- Файлы -->
          <div class="form-group">
            <label>Дополнительные файлы</label>
            <FilesManager
              v-if="equipmentId"
              :equipment-id="equipmentId"
              :files="form.additional_files || []"
              @update:files="updateFiles"
            />
            <div v-else class="alert-info">
              Сохраните оборудование, чтобы загружать файлы
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline-secondary" @click="close">Отмена</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <IconSave v-if="!submitting" class="btn-icon" />
              <IconLoading v-else class="btn-icon spin" />
              {{ submitting ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { useEquipmentStore } from '../../stores';
import { equipmentApi } from '../../api';
import { useToastStore } from '../../stores/toastStore';
import TagManager from './TagManager.vue';
import FilesManager from './FilesManager.vue';
import {
  IconEdit,
  IconPlus,
  IconSave,
  IconLoading
} from '../icons';

// ============================================
//  PROPS & EMITS
// ============================================
const props = defineProps({
  open: { type: Boolean, default: false },
  equipment: { type: Object, default: null }
});
const emit = defineEmits(['close', 'save']);

// ============================================
//  STORE
// ============================================
const store = useEquipmentStore();
const toast = useToastStore();
const { items } = storeToRefs(store);

// ============================================
//  CONSTANTS
// ============================================
const API_URL = 'http://localhost:3000/uploads/';

// ============================================
//  STATE
// ============================================
const formRef = ref(null);
const submitting = ref(false);
const form = ref({
  inventory_number: '',
  inventory_name: '',
  name: '',
  photo: '',
  year_of_release: '',
  description: '',
  purchase_basis: '',
  working_status: 'Исправен',
  write_off_status: 'На балансе',
  price: '',
  country: '',
  manufacturer: '',
  original_name: '',
  realism_class: '',
  tags: [],
  additional_files: []
});

const isAccordionOpen = ref(false);
const previewUrl = ref('');
const selectedFile = ref(null);
const isFileUpload = ref(false);

// ============================================
//  COMPUTED
// ============================================
const equipmentId = computed(() => props.equipment?.id || null);

const currentPhotoUrl = computed(() => 
  form.value.photo ? `${API_URL}${form.value.photo}` : null
);

// Все существующие теги из оборудования
const allExistingTags = computed(() => {
  const tags = new Set();
  items.value.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(tag => {
        if (tag && tag.trim()) {
          tags.add(tag.trim());
        }
      });
    }
  });
  return Array.from(tags).sort();
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
//  METHODS
// ============================================
const updateFiles = (files) => {
  form.value.additional_files = files;
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    toast.warning('Пожалуйста, выберите изображение');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error('Файл слишком большой (максимум 5MB)');
    return;
  }

  selectedFile.value = file;
  isFileUpload.value = true;

  const reader = new FileReader();
  reader.onload = (e) => {
    previewUrl.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const deletePhoto = async () => {
  if (!props.equipment?.id) return;
  if (!form.value.photo) return;

  try {
    await equipmentApi.deletePhoto(props.equipment.id);
    form.value.photo = null;
    await store.fetchAll();
    toast.success('Фото удалено');
    emit('save');
  } catch (error) {
    toast.error(error?.response?.data?.message || "Ошибка удаления фото");
  }
};

const close = () => {
  toggleBodyScroll(false);
  emit('close');
};

const submit = async () => {
  if (submitting.value) return;
  
  try {
    submitting.value = true;
    
    const data = { ...form.value };
    
    // Очищаем пустые значения
    const nullableFields = ['price', 'country', 'manufacturer', 'original_name', 'realism_class', 'year_of_release'];
    nullableFields.forEach(key => {
      if (!data[key] || data[key] === '') data[key] = null;
    });
    
    if (!data.tags || data.tags.length === 0) data.tags = [];
    if (!data.additional_files || data.additional_files.length === 0) data.additional_files = [];

    let equipmentId = props.equipment?.id;

    if (equipmentId) {
      await store.update(equipmentId, data);
      toast.success('Оборудование обновлено');
    } else {
      const newEquipment = await store.create(data);
      equipmentId = newEquipment.id;
      form.value.id = equipmentId;
      toast.success('Оборудование создано');
    }

    // Если есть новый файл фото — загружаем
    if (selectedFile.value && equipmentId) {
      const formData = new FormData();
      formData.append('photo', selectedFile.value);
      await equipmentApi.uploadPhoto(equipmentId, formData);
      toast.success('Фото загружено');
    }

    await store.fetchAll();
    emit('save');
    close();
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    toast.error(error?.response?.data?.message || "Ошибка сохранения");
  } finally {
    submitting.value = false;
  }
};

// ============================================
//  ОБРАБОТКА ENTER (добавление и закрытие)
// ============================================
let enterPressCount = 0;
let enterTimer = null;
let isClosing = false;

const handleKeydown = (e) => {
  // Обработка только Enter
  if (e.key !== 'Enter' || !props.open) return;
  
  // Игнорируем Enter в textarea
  if (e.target.tagName === 'TEXTAREA') return;
  
  // Если это кнопка - не мешаем стандартному поведению
  if (e.target.tagName === 'BUTTON') return;
  
  e.preventDefault();
  
  enterPressCount++;
  
  // Если нажали Enter второй раз в течение 300ms
  if (enterPressCount >= 2) {
    // Сбрасываем счетчик
    enterPressCount = 0;
    if (enterTimer) {
      clearTimeout(enterTimer);
      enterTimer = null;
    }
    
    // Закрываем панель
    if (!isClosing) {
      isClosing = true;
      close();
      setTimeout(() => {
        isClosing = false;
      }, 500);
    }
    return;
  }
  
  // Сбрасываем счетчик через 300ms, если не было второго нажатия
  if (enterTimer) {
    clearTimeout(enterTimer);
  }
  enterTimer = setTimeout(() => {
    // Если было только одно нажатие - отправляем форму
    if (enterPressCount === 1) {
      if (formRef.value) {
        formRef.value.dispatchEvent(new Event('submit'));
      }
    }
    enterPressCount = 0;
    enterTimer = null;
  }, 300);
};

// ============================================
//  WATCH
// ============================================
watch(() => props.equipment, (val) => {
  if (val) {
    form.value = {
      ...val,
      tags: val.tags || [],
      additional_files: val.additional_files || []
    };
    previewUrl.value = '';
    selectedFile.value = null;
    isFileUpload.value = false;
  }
}, { immediate: true });

// Блокировка скролла при открытии/закрытии
watch(() => props.open, (val) => {
  toggleBodyScroll(val);
  if (!val) {
    // Сбрасываем состояние при закрытии
    enterPressCount = 0;
    if (enterTimer) {
      clearTimeout(enterTimer);
      enterTimer = null;
    }
    isClosing = false;
  }
}, { immediate: true });

// ============================================
//  LIFECYCLE
// ============================================
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
  toggleBodyScroll(false);
  if (enterTimer) {
    clearTimeout(enterTimer);
    enterTimer = null;
  }
});

// Добавляем слушатель
document.addEventListener('keydown', handleKeydown);
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

/* ============================================
   ФОТО
   ============================================ */
.current-photo {
  position: relative;
  margin-top: 8px;
  display: inline-block;
}

.current-photo img,
.preview-photo img {
  max-width: 100%;
  max-height: 150px;
  border-radius: 8px;
  border: 1px solid #ddd;
  object-fit: contain;
}

.current-photo .label,
.preview-photo .label {
  font-size: 12px;
  color: #888;
  display: block;
  margin-bottom: 4px;
}

.preview-photo {
  margin-top: 8px;
}

.btn-delete-photo {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete-photo:hover {
  background: #c82333;
}

/* ============================================
   АККОРДЕОН
   ============================================ */
.accordion {
  margin-top: 20px;
}

.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px 16px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
  transition: all 0.2s;
}

.accordion-header:hover {
  background: #e9ecef;
}

.accordion-content {
  margin-top: 12px;
  padding: 16px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

/* ============================================
   ALERT
   ============================================ */
.alert-info {
  padding: 10px 14px;
  background: #cfe2ff;
  border-radius: 6px;
  color: #084298;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ============================================
   КНОПКИ
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