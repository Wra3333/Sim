<template>
  <div class="additional-files-manager">
    <div class="upload-area">
      <input
        type="file"
        ref="fileInput"
        style="display: none"
        @change="handleFileUpload"
      />
      <button class="btn btn-outline-primary btn-sm" @click="fileInput.click()">
        Загрузить файл
      </button>
      <select v-model="newFileType" class="form-control-sm">
        <option value="instruction">Инструкция</option>
        <option value="document">Документ</option>
        <option value="image">Изображение</option>
        <option value="other">Другое</option>
      </select>
      <input
        v-model="newFileDescription"
        type="text"
        class="form-control-sm"
        placeholder="Описание файла"
      />
    </div>

    <div v-if="loading" class="text-muted">Загрузка...</div>
    
    <div v-else-if="files.length === 0" class="empty-files">
      Нет дополнительных файлов
    </div>
    
    <div v-else class="files-list">
      <div
        v-for="file in files"
        :key="file.id"
        class="file-item"
      >
        <div class="file-info">
          <span class="file-icon">{{ getFileIcon(file.file_type) }}</span>
          <span class="file-name">{{ file.original_name }}</span>
          <span class="file-type">{{ getFileTypeLabel(file.file_type) }}</span>
          <span v-if="file.description" class="file-description">{{ file.description }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
        </div>
        <div class="file-actions">
          <a
            :href="getFileUrl(file.filename)"
            target="_blank"
            class="btn btn-sm btn-outline-primary"
            download
          >
            Скачать
          </a>
          <button
            class="btn btn-sm btn-outline-danger"
            @click="confirmDelete(file.id)"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>

    <ConfirmModal
      v-model:visible="showDeleteModal"
      title="Удаление файла"
      message="Вы уверены, что хотите удалить этот файл?"
      confirm-text="Удалить"
      confirm-variant="danger"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { equipmentApi } from '../../api';
import ConfirmModal from '../ConfirmModal.vue';

const props = defineProps({
  equipmentId: {
    type: Number,
    required: true
  },
  files: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:files']);

const fileInput = ref(null);
const newFileType = ref('other');
const newFileDescription = ref('');
const loading = ref(false);
const showDeleteModal = ref(false);
const deleteFileId = ref(null);

const getFileUrl = (filename) => {
  return `http://localhost:3000/uploads/additional/${filename}`;
};

const getFileIcon = (type) => {
  const icons = {
    'instruction': '📄',
    'document': '📑',
    'image': '🖼️',
    'other': '📎'
  };
  return icons[type] || '📎';
};

const getFileTypeLabel = (type) => {
  const labels = {
    'instruction': 'Инструкция',
    'document': 'Документ',
    'image': 'Изображение',
    'other': 'Другое'
  };
  return labels[type] || 'Другое';
};

const formatFileSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', newFileType.value);
  formData.append('description', newFileDescription.value);

  loading.value = true;
  try {
    const response = await equipmentApi.uploadAdditionalFile(props.equipmentId, formData);
    emit('update:files', [...props.files, response.data.file]);
    newFileDescription.value = '';
    newFileType.value = 'other';
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    alert('Ошибка загрузки файла');
  } finally {
    loading.value = false;
    fileInput.value.value = '';
  }
};

const confirmDelete = (fileId) => {
  deleteFileId.value = fileId;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!deleteFileId.value) return;

  try {
    await equipmentApi.deleteAdditionalFile(props.equipmentId, deleteFileId.value);
    const updatedFiles = props.files.filter(f => f.id !== deleteFileId.value);
    emit('update:files', updatedFiles);
  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    alert('Ошибка удаления файла');
  } finally {
    showDeleteModal.value = false;
    deleteFileId.value = null;
  }
};
</script>

<style scoped>
.additional-files-manager {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-area {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.upload-area .btn {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid #0d6efd;
  background: transparent;
  color: #0d6efd;
}

.upload-area .btn:hover {
  background: #0d6efd;
  color: white;
}

.upload-area .form-control-sm {
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 13px;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  flex-wrap: wrap;
  gap: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.file-icon {
  font-size: 18px;
}

.file-name {
  font-weight: 500;
  font-size: 14px;
}

.file-type {
  font-size: 11px;
  color: #6c757d;
  background: #e9ecef;
  padding: 1px 8px;
  border-radius: 10px;
}

.file-description {
  font-size: 12px;
  color: #6c757d;
}

.file-size {
  font-size: 12px;
  color: #adb5bd;
}

.file-actions {
  display: flex;
  gap: 4px;
}

.file-actions .btn {
  padding: 2px 10px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
}

.file-actions .btn-outline-primary {
  background: transparent;
  color: #0d6efd;
  border-color: #0d6efd;
  text-decoration: none;
}

.file-actions .btn-outline-primary:hover {
  background: #0d6efd;
  color: white;
}

.file-actions .btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border-color: #dc3545;
}

.file-actions .btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

.empty-files {
  color: #999;
  font-size: 13px;
  text-align: center;
  padding: 12px;
}

.text-muted {
  color: #6c757d;
  text-align: center;
  padding: 8px;
}
</style>