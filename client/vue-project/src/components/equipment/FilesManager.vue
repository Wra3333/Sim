<template>
  <div class="files-manager" @click.stop @keydown.stop>
    <div class="upload-area">
      <div class="upload-row">
        <input
          type="file"
          ref="fileInput"
          style="display: none"
          @change="handleFileSelect"
          @click.stop
          multiple
        />
        <button 
          type="button"
          class="btn btn-outline-primary btn-sm" 
          @click.stop="fileInput.click()"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Выбрать файлы
        </button>
        <input
          v-model="newFileDescription"
          type="text"
          class="form-control-sm"
          placeholder="Описание файла (необязательно)"
          @keydown.enter.prevent="uploadFiles"
          @click.stop
        />
        <button 
          type="button"
          class="btn btn-success btn-sm" 
          @click.stop="uploadFiles"
          :disabled="!selectedFiles.length || uploading"
        >
          <svg v-if="!uploading" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <svg v-else class="btn-icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          {{ uploading ? 'Загрузка...' : 'Загрузить' }}
        </button>
      </div>
      <div v-if="selectedFiles.length > 0" class="selected-files">
        <span class="selected-label">Выбрано файлов: {{ selectedFiles.length }}</span>
        <button 
          type="button"
          class="btn-clear-selected" 
          @click.stop="clearSelectedFiles"
        >
          <svg class="btn-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Очистить
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      Загрузка файлов...
    </div>

    <div v-else-if="fileList.length === 0" class="empty-files">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <span>Нет дополнительных файлов</span>
    </div>

    <div v-else class="files-list">
      <div
        v-for="file in fileList"
        :key="file.id"
        class="file-item"
      >
        <div class="file-info">
          <svg v-if="file.file_type === 'image'" class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <svg v-else-if="file.file_type === 'document'" class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <svg v-else-if="file.file_type === 'instruction'" class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z"/>
            <polyline points="14 2 14 8 20 8"/>
            <circle cx="12" cy="15" r="1.5"/>
            <line x1="12" y1="12" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12" y2="17"/>
          </svg>
          <svg v-else class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="12" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12" y2="16"/>
            <line x1="12" y1="8" x2="12" y2="8"/>
          </svg>
          <div class="file-details">
            <span class="file-name">{{ file.original_name }}</span>
            <span class="file-meta">
              <span class="file-type">{{ getFileTypeLabel(file.file_type) }}</span>
              <span v-if="file.description" class="file-description">{{ file.description }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
            </span>
          </div>
        </div>
        <div class="file-actions">
          <a
            :href="getFileUrl(file.filename)"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-sm btn-outline-info"
            title="Открыть файл"
            @click.stop
          >
            <svg class="btn-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Открыть
          </a>
          <a
            :href="getFileUrl(file.filename)"
            :download="file.original_name"
            class="btn btn-sm btn-outline-primary"
            title="Скачать файл"
            @click.stop
          >
            <svg class="btn-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Скачать
          </a>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            @click.stop="confirmDelete(file.id)"
          >
            <svg class="btn-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
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
import { ref, computed, watch } from 'vue';
import { equipmentApi } from '../../api';
import ConfirmModal from '../ConfirmModal.vue';
import { useToastStore } from '../../stores/toastStore';

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

const emit = defineEmits(['update:files', 'fileDeleted']);

const toast = useToastStore();

const fileInput = ref(null);
const selectedFiles = ref([]);
const newFileDescription = ref('');
const loading = ref(false);
const uploading = ref(false);
const showDeleteModal = ref(false);
const deleteFileId = ref(null);

const localFiles = ref([]);

const fileList = computed(() => {
  if (localFiles.value.length > 0) {
    return localFiles.value;
  }
  return props.files || [];
});

const API_URL = 'http://localhost:3000/uploads/';

const getFileTypeByExtension = (filename) => {
  if (!filename) return 'other';
  
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'];
  if (imageExtensions.includes(ext)) {
    return 'image';
  }
  
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
  if (documentExtensions.includes(ext)) {
    return 'document';
  }
  
  const instructionExtensions = ['pdf', 'doc', 'docx'];
  if (instructionExtensions.includes(ext)) {
    return 'instruction';
  }
  
  return 'other';
};

const getFileUrl = (filename) => {
  if (!filename) return '#';
  if (filename.startsWith('http')) return filename;
  return `${API_URL}${filename}`;
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

const handleFileSelect = (event) => {
  event.stopPropagation();
  const files = event.target.files;
  if (!files || files.length === 0) return;

  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`Файл "${file.name}" слишком большой (макс 10MB)`);
      return;
    }
  }

  selectedFiles.value = Array.from(files);
  console.log('✅ Выбрано файлов:', selectedFiles.value.length);
  
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const clearSelectedFiles = () => {
  selectedFiles.value = [];
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const uploadFiles = async () => {
  console.log('🚀 uploadFiles вызван');
  
  if (!selectedFiles.value.length) {
    toast.warning('Выберите файлы для загрузки');
    return;
  }
  
  if (!props.equipmentId) {
    toast.error('Сначала сохраните оборудование');
    return;
  }

  uploading.value = true;
  let successCount = 0;
  let errorCount = 0;
  const uploadedFiles = [];

  for (const file of selectedFiles.value) {
    const fileType = getFileTypeByExtension(file.name);
    const description = newFileDescription.value || '';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    formData.append('description', description);

    try {
      const response = await equipmentApi.uploadAdditionalFile(props.equipmentId, formData);
      console.log('✅ Ответ сервера:', response.data);
      
      let newFiles = [];
      
      if (response.data.files && Array.isArray(response.data.files)) {
        newFiles = response.data.files;
      } else if (response.data.file) {
        newFiles = [response.data.file];
      }
      
      if (newFiles.length > 0) {
        uploadedFiles.push(...newFiles);
        successCount += newFiles.length;
      } else {
        errorCount++;
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки:', error);
      errorCount++;
    }
  }

  if (uploadedFiles.length > 0) {
    const currentFiles = localFiles.value.length > 0 ? localFiles.value : props.files || [];
    const updatedFiles = [...currentFiles, ...uploadedFiles];
    localFiles.value = updatedFiles;
    emit('update:files', updatedFiles);
  }

  uploading.value = false;
  clearSelectedFiles();
  newFileDescription.value = '';

  if (successCount > 0) {
    toast.success(`Загружено ${successCount} файлов`);
  }
  if (errorCount > 0) {
    toast.error(`Не удалось загрузить ${errorCount} файлов`);
  }
};

const confirmDelete = (fileId) => {
  console.log('🗑️ [FilesManager] confirmDelete вызван, fileId:', fileId);
  deleteFileId.value = fileId;
  showDeleteModal.value = true;
};

// ✅ ИСПРАВЛЕННЫЙ МЕТОД УДАЛЕНИЯ
const handleDelete = async () => {
  console.log('🗑️ [FilesManager] handleDelete вызван');
  console.log('🗑️ deleteFileId:', deleteFileId.value);
  console.log('🗑️ equipmentId:', props.equipmentId);
  
  if (!deleteFileId.value) {
    console.error('❌ deleteFileId отсутствует');
    return;
  }

  if (!props.equipmentId) {
    console.error('❌ equipmentId отсутствует');
    toast.error('Оборудование не найдено');
    showDeleteModal.value = false;
    deleteFileId.value = null;
    return;
  }

  try {
    await equipmentApi.deleteAdditionalFile(props.equipmentId, deleteFileId.value);
    
    const currentFiles = localFiles.value.length > 0 ? localFiles.value : props.files || [];
    const updatedFiles = currentFiles.filter(f => f.id !== deleteFileId.value);
    
    localFiles.value = updatedFiles;
    emit('update:files', updatedFiles);
    
    // ✅ СООБЩАЕМ РОДИТЕЛЮ, ЧТО ФАЙЛ УДАЛЕН
    emit('fileDeleted', { 
      equipmentId: props.equipmentId, 
      fileId: deleteFileId.value 
    });
    
    toast.success('Файл удален');
  } catch (error) {
    console.error('❌ Ошибка удаления файла:', error);
    console.error('❌ Детали:', error.response?.data || error.message);
    toast.error(error?.response?.data?.message || "Ошибка удаления файла");
  } finally {
    showDeleteModal.value = false;
    deleteFileId.value = null;
  }
};

watch(() => props.files, (newFiles) => {
  if (newFiles && newFiles.length > 0) {
    const currentIds = localFiles.value.map(f => f.id).sort();
    const newIds = newFiles.map(f => f.id).sort();
    if (JSON.stringify(currentIds) !== JSON.stringify(newIds)) {
      localFiles.value = [...newFiles];
    }
  } else if (newFiles && newFiles.length === 0) {
    localFiles.value = [];
  }
}, { deep: true, immediate: true });

watch(() => props.equipmentId, () => {
  clearSelectedFiles();
});
</script>

<style scoped>
.files-manager {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.upload-row .btn {
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.upload-row .btn .btn-icon {
  width: 16px;
  height: 16px;
}

.upload-row .form-control-sm {
  padding: 4px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  min-width: 140px;
}

.upload-row .form-control-sm:focus {
  border-color: #80bdff;
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.15);
}

.btn-icon-small {
  width: 14px;
  height: 14px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-outline-primary {
  background: transparent;
  color: #0d6efd;
  border-color: #0d6efd;
}

.btn-outline-primary:hover {
  background: #0d6efd;
  color: white;
}

.btn-outline-info {
  background: transparent;
  color: #0dcaf0;
  border-color: #0dcaf0;
}

.btn-outline-info:hover {
  background: #0dcaf0;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.btn-success:hover {
  background: #218838;
}

.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 13px;
}

.selected-files {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 13px;
}

.selected-label {
  color: #495057;
}

.btn-clear-selected {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 13px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-clear-selected:hover {
  text-decoration: underline;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  color: #6c757d;
}

.spinner {
  width: 16px;
  height: 16px;
  animation: spin 0.8s linear infinite;
}

.empty-files {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dee2e6;
  color: #6c757d;
}

.empty-icon {
  width: 32px;
  height: 32px;
  color: #adb5bd;
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
  padding: 10px 14px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  flex-wrap: wrap;
  gap: 8px;
  transition: background 0.2s;
}

.file-item:hover {
  background: #f1f3f5;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 150px;
}

.file-icon {
  width: 20px;
  height: 20px;
  color: #6c757d;
  flex-shrink: 0;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  font-size: 14px;
  color: #212529;
  word-break: break-all;
}

.file-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.file-type {
  font-size: 11px;
  color: #6c757d;
  background: #e9ecef;
  padding: 0 8px;
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
  flex-shrink: 0;
}

.file-actions .btn {
  padding: 2px 10px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  text-decoration: none;
  transition: all 0.15s;
}

.file-actions .btn .btn-icon-small {
  width: 14px;
  height: 14px;
}

.file-actions .btn-outline-primary {
  background: transparent;
  color: #0d6efd;
  border-color: #0d6efd;
}

.file-actions .btn-outline-primary:hover {
  background: #0d6efd;
  color: white;
}

.file-actions .btn-outline-info {
  background: transparent;
  color: #0dcaf0;
  border-color: #0dcaf0;
}

.file-actions .btn-outline-info:hover {
  background: #0dcaf0;
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

@media (max-width: 768px) {
  .upload-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .upload-row .btn {
    justify-content: center;
  }
  
  .upload-row .form-control-sm {
    width: 100%;
  }
  
  .file-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .file-actions {
    justify-content: flex-end;
  }
}
</style>