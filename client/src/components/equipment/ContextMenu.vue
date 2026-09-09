<template>
  <div 
    v-if="visible" 
    class="context-menu"
    :style="{
      top: positionY + 'px',
      left: positionX + 'px'
    }"
    @click.stop
    @contextmenu.prevent="close"
  >
    <div class="context-menu-header">
      <svg class="context-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <span class="context-title">Документы</span>
      <span class="context-count">{{ files.length }}</span>
    </div>
    
    <div v-if="files.length === 0" class="context-empty">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <span>Нет прикрепленных документов</span>
    </div>
    
    <div v-else class="context-files">
      <!-- ИНСТРУКЦИИ -->
      <template v-if="groupedFiles.instruction.length > 0">
        <div class="context-group">
          <div class="context-group-header">
            <svg class="group-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="9.09" y1="9" x2="9.1" y2="9.01"/>
              <line x1="14.09" y1="9" x2="14.1" y2="9.01"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <span class="group-title">Инструкции</span>
            <span class="group-count">{{ groupedFiles.instruction.length }}</span>
          </div>
          <div
            v-for="file in groupedFiles.instruction"
            :key="file.id"
            class="context-file-item"
            @contextmenu.stop
          >
            <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z"/>
              <polyline points="14 2 14 8 20 8"/>
              <circle cx="12" cy="15" r="1.5"/>
              <line x1="12" y1="12" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12" y2="17"/>
            </svg>
            <div class="file-info">
              <span class="file-name">{{ file.original_name }}</span>
              <span v-if="file.description" class="file-desc">{{ file.description }}</span>
            </div>
            <div class="file-actions-context">
              <a
                :href="getFileUrl(file.filename)"
                target="_blank"
                rel="noopener noreferrer"
                class="file-link"
                title="Открыть"
                @click.stop
              >
                <svg class="file-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </a>
              <a
                :href="getFileUrl(file.filename)"
                :download="file.original_name"
                class="file-link"
                title="Скачать"
                @click.stop
              >
                <svg class="file-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </a>
              <button
                class="file-link file-link-delete"
                title="Удалить"
                @click.stop="openDeleteConfirm(file.id)"
              >
                <svg class="file-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- ДОКУМЕНТЫ -->
      <template v-if="groupedFiles.document.length > 0">
        <div class="context-group">
          <div class="context-group-header">
            <svg class="group-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span class="group-title">Документы</span>
            <span class="group-count">{{ groupedFiles.document.length }}</span>
          </div>
          <div
            v-for="file in groupedFiles.document"
            :key="file.id"
            class="context-file-item"
            @contextmenu.stop
          >
            <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <div class="file-info">
              <span class="file-name">{{ file.original_name }}</span>
              <span v-if="file.description" class="file-desc">{{ file.description }}</span>
            </div>
            <div class="file-actions-context">
              <a
                :href="getFileUrl(file.filename)"
                target="_blank"
                rel="noopener noreferrer"
                class="file-link"
                title="Открыть"
                @click.stop
              >
                <svg class="file-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </a>
              <a
                :href="getFileUrl(file.filename)"
                :download="file.original_name"
                class="file-link"
                title="Скачать"
                @click.stop
              >
                <svg class="file-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </a>
              <button
                class="file-link file-link-delete"
                title="Удалить"
                @click.stop="openDeleteConfirm(file.id)"
              >
                <svg class="file-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- ИЗОБРАЖЕНИЯ -->
      <template v-if="groupedFiles.image.length > 0">
        <div class="context-group">
          <div class="context-group-header">
            <svg class="group-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span class="group-title">Изображения</span>
            <span class="group-count">{{ groupedFiles.image.length }}</span>
          </div>
          <div
            v-for="file in groupedFiles.image"
            :key="file.id"
            class="context-file-item"
            @contextmenu.stop
          >
            <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <div class="file-info">
              <span class="file-name">{{ file.original_name }}</span>
              <span v-if="file.description" class="file-desc">{{ file.description }}</span>
            </div>
            <div class="file-actions-context">
              <a
                :href="getFileUrl(file.filename)"
                target="_blank"
                rel="noopener noreferrer"
                class="file-link"
                title="Открыть"
                @click.stop
              >
                <svg class="file-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </a>
              <a
                :href="getFileUrl(file.filename)"
                :download="file.original_name"
                class="file-link"
                title="Скачать"
                @click.stop
              >
                <svg class="file-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </a>
              <button
                class="file-link file-link-delete"
                title="Удалить"
                @click.stop="openDeleteConfirm(file.id)"
              >
                <svg class="file-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- ДРУГОЕ -->
      <template v-if="groupedFiles.other.length > 0">
        <div class="context-group">
          <div class="context-group-header">
            <svg class="group-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span class="group-title">Другое</span>
            <span class="group-count">{{ groupedFiles.other.length }}</span>
          </div>
          <div
            v-for="file in groupedFiles.other"
            :key="file.id"
            class="context-file-item"
            @contextmenu.stop
          >
            <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <div class="file-info">
              <span class="file-name">{{ file.original_name }}</span>
              <span v-if="file.description" class="file-desc">{{ file.description }}</span>
            </div>
            <div class="file-actions-context">
              <a
                :href="getFileUrl(file.filename)"
                target="_blank"
                rel="noopener noreferrer"
                class="file-link"
                title="Открыть"
                @click.stop
              >
                <svg class="file-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </a>
              <a
                :href="getFileUrl(file.filename)"
                :download="file.original_name"
                class="file-link"
                title="Скачать"
                @click.stop
              >
                <svg class="file-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </a>
              <button
                class="file-link file-link-delete"
                title="Удалить"
                @click.stop="openDeleteConfirm(file.id)"
              >
                <svg class="file-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
    
    <div class="context-menu-footer">
      <button class="btn-close-context" @click="close">Закрыть</button>
    </div>

    <!-- МОДАЛКА ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ -->
    <ConfirmModal
      v-model:visible="showDeleteModal"
      title="Удаление файла"
      :message="`Вы уверены, что хотите удалить этот файл?`"
      confirm-text="Удалить"
      confirm-variant="danger"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ConfirmModal from '../ConfirmModal.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  positionX: {
    type: Number,
    default: 0
  },
  positionY: {
    type: Number,
    default: 0
  },
  files: {
    type: Array,
    default: () => []
  },
  equipmentId: {
    type: [Number, String],
    default: null
  }
});

const emit = defineEmits(['close', 'delete']);

const API_URL = 'http://localhost:3000/uploads/';

const showDeleteModal = ref(false);
const deleteFileId = ref(null);

const groupedFiles = computed(() => {
  const groups = {
    instruction: [],
    document: [],
    image: [],
    other: []
  };
  
  props.files.forEach(file => {
    const type = file.file_type || 'other';
    if (groups[type]) {
      groups[type].push(file);
    } else {
      groups.other.push(file);
    }
  });
  
  return groups;
});

const getFileUrl = (filename) => {
  if (!filename) return '#';
  if (filename.startsWith('http')) return filename;
  return `${API_URL}${filename}`;
};

const openDeleteConfirm = (fileId) => {
  deleteFileId.value = fileId;
  showDeleteModal.value = true;
};

const handleDelete = () => {
  if (deleteFileId.value && props.equipmentId) {
    emit('delete', { 
      equipmentId: props.equipmentId, 
      fileId: deleteFileId.value 
    });
    deleteFileId.value = null;
  }
  showDeleteModal.value = false;
};

const close = () => {
  emit('close');
};
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 999;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid #e9ecef;
  width: 380px;
  max-height: 420px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: contextMenuAppear 0.2s ease;
}

@keyframes contextMenuAppear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.context-menu-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.context-menu-header .context-icon {
  width: 18px;
  height: 18px;
  color: #4361ee;
  flex-shrink: 0;
}

.context-menu-header .context-title {
  font-weight: 600;
  font-size: 14px;
  color: #212529;
  flex: 1;
}

.context-menu-header .context-count {
  background: #4361ee;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.context-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  color: #adb5bd;
  gap: 8px;
}

.context-empty .empty-icon {
  width: 32px;
  height: 32px;
  color: #adb5bd;
}

.context-files {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
}

.context-files::-webkit-scrollbar {
  width: 4px;
}

.context-files::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.context-files::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.context-group {
  margin-bottom: 8px;
}

.context-group:last-child {
  margin-bottom: 0;
}

.context-group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 2px;
}

.context-group-header .group-icon {
  width: 14px;
  height: 14px;
  color: #6c757d;
}

.context-group-header .group-title {
  font-size: 11px;
  font-weight: 600;
  color: #495057;
  flex: 1;
}

.context-group-header .group-count {
  font-size: 10px;
  color: #6c757d;
  background: #e9ecef;
  padding: 0 6px;
  border-radius: 8px;
}

.context-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 16px;
  border-radius: 4px;
  transition: background 0.15s;
}

.context-file-item:hover {
  background: #f1f3f5;
}

.context-file-item .file-icon {
  width: 16px;
  height: 16px;
  color: #6c757d;
  flex-shrink: 0;
}

.context-file-item .file-info {
  flex: 1;
  min-width: 0;
}

.context-file-item .file-name {
  font-size: 12px;
  font-weight: 500;
  color: #212529;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.context-file-item .file-desc {
  font-size: 10px;
  color: #adb5bd;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.context-file-item .file-actions-context {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.context-file-item .file-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  text-decoration: none;
  transition: background 0.15s;
  color: #6c757d;
  background: transparent;
  border: none;
  cursor: pointer;
}

.context-file-item .file-link:hover {
  background: #e9ecef;
  color: #212529;
}

.context-file-item .file-link-delete:hover {
  background: #fce4ec;
  color: #dc3545;
}

.context-file-item .file-link-icon {
  width: 12px;
  height: 12px;
}

.context-menu-footer {
  padding: 8px 12px;
  border-top: 1px solid #e9ecef;
  flex-shrink: 0;
  background: #f8f9fa;
}

.btn-close-context {
  width: 100%;
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6c757d;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-close-context:hover {
  background: #e9ecef;
  color: #212529;
}

@media (max-width: 480px) {
  .context-menu {
    width: 90vw;
    max-height: 60vh;
    left: 5vw !important;
  }
  
  .context-file-item {
    flex-wrap: wrap;
  }
  
  .context-file-item .file-info {
    flex: 1 1 100%;
  }
  
  .context-file-item .file-actions-context {
    margin-left: auto;
  }
}
</style>