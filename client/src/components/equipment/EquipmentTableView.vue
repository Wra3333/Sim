<template>
  <div class="equipment-table-wrapper">
    <table class="equipment-table">
      <thead>
        <tr>
          <th>Фото</th>
          <th>Инв. номер</th>
          <th>Наименование</th>
          <th>Название</th>
          <th>Теги</th>
          <th>Статус</th>
          <th>Списание</th>
          <th>Год</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          v-for="item in items" 
          :key="item.id"
          :class="{ 'archived-row': item.is_archived }"
          @click="handleRowClick(item)"
          @contextmenu.prevent="handleContextMenu($event, item)"
        >
          <td>
            <div class="photo-cell">
              <img 
                v-if="item.photo" 
                :src="getPhotoUrl(item.photo)" 
                :alt="item.name"
                class="equipment-thumbnail"
                @error="handleImageError"
              />
              <div v-else class="no-photo">
                <IconImage class="no-photo-icon" />
              </div>
            </div>
          </td>
          <td class="inventory-number">{{ item.inventory_number }}</td>
          <td class="inventory-name">{{ item.inventory_name }}</td>
          <td>
            {{ item.name }}
            <span v-if="item.is_archived" class="archived-badge-list">Архив</span>
          </td>
          <td>
            <div class="tags-cell">
              <span v-for="tag in (item.tags || [])" :key="tag" class="tag-badge">
                #{{ tag }}
              </span>
              <span v-if="!item.tags || item.tags.length === 0" class="no-tags">—</span>
            </div>
          </td>
          <td>
            <span class="badge" :class="getStatusClass(item.working_status)">
              {{ item.working_status }}
            </span>
          </td>
          <td>
            <span class="badge" :class="getWriteOffClass(item.write_off_status)">
              {{ item.write_off_status }}
            </span>
          </td>
          <td>{{ item.year_of_release || '—' }}</td>
          <td @click.stop>
            <div class="table-actions">
              <template v-if="item.is_archived">
                <button class="btn btn-sm btn-success" @click="$emit('restore', item.id)" title="Восстановить">
                  <IconRestore class="btn-icon" />
                </button>
                <button class="btn btn-sm btn-danger" @click="$emit('deletePermanent', item.id)" title="Удалить навсегда">
                  <IconTrash class="btn-icon" />
                </button>
                <button class="btn btn-sm btn-outline-secondary" @click="$emit('history', item)" title="История">
                  <IconHistory class="btn-icon" />
                </button>
              </template>
              <template v-else>
                <button class="btn btn-sm btn-outline-primary" @click="$emit('edit', item)" title="Редактировать">
                  <IconEdit class="btn-icon" />
                </button>
                <button class="btn btn-sm btn-outline-danger" @click="$emit('delete', item.id)" title="В архив">
                  <IconArchive class="btn-icon" />
                </button>
                <button class="btn btn-sm btn-outline-secondary" @click="$emit('history', item)" title="История">
                  <IconHistory class="btn-icon" />
                </button>
              </template>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- КОНТЕКСТНОЕ МЕНЮ -->
    <ContextMenu
      :visible="contextMenuVisible"
      :position-x="contextMenuX"
      :position-y="contextMenuY"
      :files="selectedItemFiles"
      :equipment-id="selectedItem?.id"
      @close="closeContextMenu"
      @delete="handleDeleteFile"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useEquipmentStore } from '../../stores';
import { useToastStore } from '../../stores/toastStore';
import IconImage from '../icons/IconImage.vue';
import IconRestore from '../icons/IconRestore.vue';
import IconTrash from '../icons/IconTrash.vue';
import IconHistory from '../icons/IconHistory.vue';
import IconEdit from '../icons/IconEdit.vue';
import IconArchive from '../icons/IconArchive.vue';
import ContextMenu from './ContextMenu.vue';

const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  }
});

// ✅ ТОЛЬКО ЭТИ ЭМИТЫ (без deleteFile)
const emit = defineEmits([
  'edit', 'delete', 'deletePermanent', 
  'history', 'restore', 'rowClick'
]);

const equipmentStore = useEquipmentStore();
const toast = useToastStore();

const API_URL = 'http://localhost:3000/uploads/';

const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const selectedItem = ref(null);

const selectedItemFiles = computed(() => {
  if (!selectedItem.value) return [];
  const files = selectedItem.value.additional_files || [];
  if (Array.isArray(files) && files.length > 0 && typeof files[0] === 'object') {
    return files;
  }
  return [];
});

const handleContextMenu = (event, item) => {
  event.preventDefault();
  
  if (contextMenuVisible.value) {
    closeContextMenu();
    return;
  }
  
  selectedItem.value = item;
  
  let x = event.clientX;
  let y = event.clientY;
  
  const menuWidth = 380;
  const menuHeight = 420;
  
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 10;
  }
  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight - 10;
  }
  if (x < 10) x = 10;
  if (y < 10) y = 10;
  
  contextMenuX.value = x;
  contextMenuY.value = y;
  contextMenuVisible.value = true;
};

const closeContextMenu = () => {
  contextMenuVisible.value = false;
  selectedItem.value = null;
};

// ✅ ОБРАБОТЧИК УДАЛЕНИЯ ФАЙЛА (ПРЯМО В СТОР)
const handleDeleteFile = async ({ equipmentId, fileId }) => {
  try {
    await equipmentStore.deleteFile(equipmentId, fileId);
    toast.success('Файл удален');
  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    toast.error(error?.response?.data?.message || "Ошибка удаления файла");
  }
  closeContextMenu();
};

const getPhotoUrl = (photo) => {
  if (!photo) return null;
  return `${API_URL}${photo}`;
};

const handleImageError = (e) => {
  e.target.style.display = 'none';
};

const getStatusClass = (status) => {
  const classes = {
    'Исправен': 'badge-success',
    'В ремонте': 'badge-warning',
    'Требует ремонта': 'badge-danger'
  };
  return classes[status] || 'badge-secondary';
};

const getWriteOffClass = (status) => {
  const classes = {
    'На балансе': 'badge-success',
    'На списание': 'badge-warning',
    'Списан': 'badge-danger'
  };
  return classes[status] || 'badge-secondary';
};

const handleRowClick = (item) => {
  emit('rowClick', item);
};

const handleKeydown = (event) => {
  if (event.key === 'Escape' && contextMenuVisible.value) {
    closeContextMenu();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.equipment-table-wrapper {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
  overflow-x: auto;
}

.equipment-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.equipment-table thead {
  background: #f8f9fa;
}

.equipment-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.equipment-table td {
  padding: 10px 16px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

.equipment-table tbody tr {
  cursor: pointer;
  transition: background 0.15s;
}

.equipment-table tbody tr:hover {
  background: #f0f7ff;
}

.equipment-table tbody tr.archived-row {
  background: #fffdf5;
  opacity: 0.85;
}

.equipment-table tbody tr.archived-row:hover {
  background: #fff8e7;
}

.equipment-table td:last-child {
  cursor: default;
}

.photo-cell {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  overflow: hidden;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.equipment-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
}

.no-photo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.no-photo-icon {
  width: 24px;
  height: 24px;
  color: #adb5bd;
}

.inventory-number {
  font-weight: 600;
  color: #4361ee;
  font-size: 13px;
}

.inventory-name {
  color: #6c757d;
  font-size: 13px;
}

.archived-badge-list {
  display: inline-block;
  background: #fff3cd;
  color: #856404;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  margin-left: 6px;
}

.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-badge {
  display: inline-block;
  background: #e8f0fe;
  color: #1a73e8;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 11px;
}

.no-tags {
  color: #adb5bd;
  font-size: 13px;
}

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.badge-success {
  background: #d4edda;
  color: #155724;
}

.badge-warning {
  background: #fff3cd;
  color: #856404;
}

.badge-danger {
  background: #f8d7da;
  color: #721c24;
}

.badge-secondary {
  background: #e9ecef;
  color: #495057;
}

.table-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.btn-sm.btn-outline-primary {
  background: transparent;
  color: #0d6efd;
  border: 1px solid #0d6efd;
}

.btn-sm.btn-outline-primary:hover {
  background: #0d6efd;
  color: white;
}

.btn-sm.btn-outline-primary:hover .btn-icon {
  stroke: white;
}

.btn-sm.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.btn-sm.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

.btn-sm.btn-outline-danger:hover .btn-icon {
  stroke: white;
}

.btn-sm.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-sm.btn-outline-secondary:hover {
  background: #6c757d;
  color: white;
}

.btn-sm.btn-outline-secondary:hover .btn-icon {
  stroke: white;
}

.btn-sm.btn-success {
  background: #28a745;
  color: white;
  border: 1px solid #28a745;
}

.btn-sm.btn-success:hover {
  background: #218838;
  border-color: #1e7e34;
}

.btn-sm.btn-success .btn-icon {
  stroke: white;
}

.btn-sm.btn-danger {
  background: #dc3545;
  color: white;
  border: 1px solid #dc3545;
}

.btn-sm.btn-danger:hover {
  background: #c82333;
  border-color: #bd2130;
}

.btn-sm.btn-danger .btn-icon {
  stroke: white;
}
</style>