<script setup>
import { ref, watch, computed } from 'vue';
import { useEquipmentStore } from '../../stores';
import { equipmentApi } from '../../api';
import { useToastStore } from '../../stores/toastStore';

const props = defineProps({
  equipment: { type: Object, default: null }
});
const emit = defineEmits(['close', 'save']);

const store = useEquipmentStore();
const toast = useToastStore();

const API_URL = 'http://localhost:3000/uploads/';

const form = ref({
  inventory_number: '',
  inventory_name: '',
  name: '',
  photo: '',
  year_of_release: '',
  description: '',
  purchase_basis: '',
  working_status: 'Исправен',
  write_off_status: 'На балансе'
});

const previewUrl = ref('');
const selectedFile = ref(null);
const isFileUpload = ref(false);

const currentPhotoUrl = computed(() => {
  if (!form.value.photo) return null;
  return `${API_URL}${form.value.photo}`;
});

watch(() => props.equipment, (val) => {
  if (val) {
    form.value = { ...val };
    previewUrl.value = '';
    selectedFile.value = null;
    isFileUpload.value = false;
  }
}, { immediate: true });

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
    toast.success('✅ Фото удалено');
    emit('save');
  } catch (error) {
    toast.error(error?.response?.data?.message || "Ошибка удаления фото");
  }
};

const close = () => {
  emit('close');
};

const submit = async () => {
  try {
    if (selectedFile.value) {
      const formData = new FormData();
      formData.append('photo', selectedFile.value);

      let equipmentId = props.equipment?.id;

      if (!equipmentId) {
        const newEquipment = await store.create(form.value);
        equipmentId = newEquipment.id;
        toast.success('✅ Оборудование создано');
      } else {
        toast.success('✅ Оборудование обновлено');
      }

      await equipmentApi.uploadPhoto(equipmentId, formData);
      await store.fetchAll();
      emit('save');
      return;
    }

    const data = { ...form.value };
    if (props.equipment) {
      await store.update(props.equipment.id, data);
      toast.success('✅ Оборудование обновлено');
    } else {
      await store.create(data);
      toast.success('✅ Оборудование создано');
    }
    emit('save');
  } catch (error) {
    toast.error(error?.response?.data?.message || "Проверьте соеденение с интернетом");
  }
};
</script>

<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ equipment ? 'Редактировать оборудование' : 'Добавить оборудование' }}</h3>
        <button class="btn-close" @click="close">×</button>
      </div>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Инвентарный номер *</label>
          <input v-model="form.inventory_number" class="form-control" required />
        </div>
        <div class="form-group">
          <label>Инвентарное наименование *</label>
          <input v-model="form.inventory_name" class="form-control" required />
        </div>

        <!-- Блок загрузки фото -->
        <div class="form-group">
          <label>Фото</label>
          <input 
            type="file" 
            accept="image/*" 
            class="form-control" 
            @change="handleFileUpload" 
          />
          <!-- Текущее фото с кнопкой удаления -->
          <div v-if="form.photo && !isFileUpload" class="current-photo">
            <span class="label">Текущее фото:</span>
            <button type="button" class="btn-delete-photo" @click="deletePhoto" title="Удалить фото">✕</button>
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
        <div class="form-group">
          <label>Год закупки</label>
          <input v-model="form.year_of_release" type="number" class="form-control" />
        </div>
        <div class="form-group">
          <label>Краткое описание</label>
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
        <div class="form-actions">
          <button type="button" class="btn btn-outline-secondary" @click="close">Отмена</button>
          <button type="submit" class="btn btn-primary">Сохранить</button>
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
  width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  margin: auto;
  top: auto;
  left: auto;
  transform: none;
  display: block;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #1a1a2e;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #888;
}

.btn-close:hover {
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 4px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-control:focus {
  border-color: #4361ee;
  outline: none;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

textarea.form-control {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4361ee;
  color: white;
}

.btn-primary:hover {
  background: #3a56d4;
}

.btn-outline-secondary {
  background: transparent;
  color: #555;
  border: 1px solid #ddd;
}

.btn-outline-secondary:hover {
  background: #f0f0f0;
}

/* ===== БЛОК ФОТО ===== */
.current-photo {
  position: relative;
  margin-top: 8px;
  display: inline-block;
}

.btn-delete-photo {
  position: absolute;
  top: 12px;
  right: -10px;
  background: rgba(255, 0, 0, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 2;
}

.btn-delete-photo:hover {
  background: red;
}

.current-photo img {
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

.preview-photo img {
  max-width: 100%;
  max-height: 150px;
  border-radius: 8px;
  border: 1px solid #ddd;
  object-fit: contain;
}
</style>