<template>
  <div 
    class="equipment-card" 
    :class="{ 'archived': equipment.is_archived }"
    @contextmenu.prevent="handleContextMenu"
  >
    <div class="card-image" @click="handlePhotoClick">
      <img v-if="photo" :src="photoUrl" alt="Фото оборудования" />
      <div v-else class="image-placeholder">
        <IconEquipment class="placeholder-icon" />
      </div>
      <div v-if="equipment.is_archived" class="archived-badge">
        <IconArchive class="archived-icon" />
        В архиве
      </div>
    </div>
    <div class="card-body">
      <div class="card-header">
        <span class="inventory-number">
          <IconTag class="inventory-icon" />
          {{ inventoryNumber }}
        </span>
        <span class="badge" :class="statusClass">
          <IconCheck v-if="workingStatus === 'Исправен'" class="badge-icon" />
          <IconAlert v-else class="badge-icon" />
          {{ workingStatus }}
        </span>
      </div>
      <h3 class="title">
        <IconEquipment class="title-icon" />
        {{ equipmentName }}
      </h3>
      <p class="subtitle">{{ inventoryName }}</p>
      
      <p class="description" v-if="description || hasExtraData">
        <IconList class="desc-icon" />
        <span class="description-text">
          <template v-if="description">{{ description }}</template>
          <template v-if="description && hasExtraData">. </template>
          <template v-if="hasExtraData">
            <template v-if="showCountry">Страна - {{ showCountry }}</template>
            <template v-if="showCountry && (showManufacturer || showPrice || showRealismClass || showOriginalName)">, </template>
            <template v-if="showManufacturer">Фирма - {{ showManufacturer }}</template>
            <template v-if="showManufacturer && (showPrice || showRealismClass || showOriginalName)">, </template>
            <template v-if="showPrice">Стоимость - {{ showPrice }} ₽</template>
            <template v-if="showPrice && (showRealismClass || showOriginalName)">, </template>
            <template v-if="showRealismClass">Класс реалистичности - {{ showRealismClass }}</template>
            <template v-if="showRealismClass && showOriginalName">, </template>
            <template v-if="showOriginalName">Оригинальное название - {{ showOriginalName }}</template>
          </template>
        </span>
      </p>
      
      <div class="meta">
        <span>
          <IconCalendar class="meta-icon" />
          Год закупки: {{ yearOfRelease }}
        </span>
        <span class="badge" :class="writeOffClass">
          <IconCheck v-if="writeOffStatus === 'На балансе'" class="badge-icon" />
          <IconAlert v-else class="badge-icon" />
          {{ writeOffStatus }}
        </span>
      </div>
      
      <p class="purchase-basis" v-if="purchaseBasis">
        <IconReceipt class="purchase-icon" />
        Основание закупки: {{ purchaseBasis }}
      </p>
      
      <div class="actions" @click.stop>
        <template v-if="equipment.is_archived">
          <button class="btn btn-sm btn-success" @click="$emit('restore', equipment.id)">
            <IconRestore class="btn-icon" />
            Восстановить
          </button>
          <button class="btn btn-sm btn-outline-secondary" @click="$emit('history', equipment)">
            <IconHistory class="btn-icon" />
            История
          </button>
          <button class="btn btn-sm btn-danger btn-full-width" @click="$emit('deletePermanent', equipment.id)">
            <IconTrash class="btn-icon" />
            Удалить навсегда
          </button>
        </template>
        
        <template v-else>
          <button class="btn btn-sm btn-outline-primary" @click="$emit('edit', equipment)">
            <IconEdit class="btn-icon" />
            Редактировать
          </button>
          <button class="btn btn-sm btn-outline-danger" @click="$emit('delete', equipment.id)">
            <IconArchive class="btn-icon" />
            В архив
          </button>
          <button class="btn btn-sm btn-outline-secondary btn-history" @click="$emit('history', equipment)">
            <IconHistory class="btn-icon" />
            История поломок
          </button>
        </template>
      </div>
    </div>

    <!-- КОНТЕКСТНОЕ МЕНЮ -->
    <ContextMenu
      :visible="contextMenuVisible"
      :position-x="contextMenuX"
      :position-y="contextMenuY"
      :files="additionalFiles"
      :equipment-id="equipment.id"
      @close="closeContextMenu"
      @delete="handleDeleteFromContext"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStatusClasses } from '../../composables/useStatusClasses';
import { useEquipmentStore } from '../../stores';
import { useToastStore } from '../../stores/toastStore';
import ContextMenu from './ContextMenu.vue';
import {
  IconEquipment,
  IconTag,
  IconCheck,
  IconAlert,
  IconCalendar,
  IconList,
  IconReceipt,
  IconEdit,
  IconTrash,
  IconHistory,
  IconArchive,
  IconRestore
} from '../icons';

const props = defineProps({
  equipment: { type: Object, required: true }
});

// ✅ ТОЛЬКО ЭТИ ЭМИТЫ (без deleteFile)
const emit = defineEmits([
  'edit', 'delete', 'deletePermanent', 
  'view', 'history', 'restore', 'photoClick'
]);

const equipmentStore = useEquipmentStore();
const toast = useToastStore();
const { getEquipmentStatusClass, getWriteOffClass } = useStatusClasses();

const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);

const additionalFiles = computed(() => {
  const files = props.equipment.additional_files || [];
  if (Array.isArray(files) && files.length > 0 && typeof files[0] === 'object') {
    return files;
  }
  return [];
});

const handleContextMenu = (event) => {
  event.preventDefault();
  
  if (contextMenuVisible.value) {
    closeContextMenu();
    return;
  }
  
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
};

// ✅ ОБРАБОТЧИК УДАЛЕНИЯ (ПРЯМО В СТОР)
const handleDeleteFromContext = async ({ equipmentId, fileId }) => {
  try {
    await equipmentStore.deleteFile(equipmentId, fileId);
    toast.success('Файл удален');
  } catch (error) {
    console.error('Ошибка удаления файла:', error);
    toast.error(error?.response?.data?.message || "Ошибка удаления файла");
  }
  closeContextMenu();
};

const statusClass = computed(() => getEquipmentStatusClass(props.equipment.working_status));
const writeOffClass = computed(() => getWriteOffClass(props.equipment.write_off_status));
const yearOfRelease = computed(() => props.equipment.year_of_release || '—');
const inventoryNumber = computed(() => props.equipment.inventory_number);
const equipmentName = computed(() => props.equipment.name);
const inventoryName = computed(() => props.equipment.inventory_name);
const workingStatus = computed(() => props.equipment.working_status);
const writeOffStatus = computed(() => props.equipment.write_off_status);
const description = computed(() => props.equipment.description);
const photo = computed(() => props.equipment.photo);
const purchaseBasis = computed(() => props.equipment.purchase_basis);

const showOriginalName = computed(() => props.equipment.original_name);
const showManufacturer = computed(() => props.equipment.manufacturer);
const showCountry = computed(() => props.equipment.country);
const showPrice = computed(() => props.equipment.price);
const showRealismClass = computed(() => props.equipment.realism_class);

const hasExtraData = computed(() => {
  return !!(showOriginalName.value || showManufacturer.value || 
            showCountry.value || showPrice.value || showRealismClass.value);
});

const photoUrl = computed(() => {
  if (!props.equipment.photo) return null;
  if (props.equipment.photo.startsWith('http')) return props.equipment.photo;
  return `http://localhost:3000/uploads/${props.equipment.photo}`;
});

const handlePhotoClick = (e) => {
  e.stopPropagation();
  emit('photoClick', props.equipment);
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
.equipment-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #eef0f4;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: default;
}

.equipment-card.archived {
  opacity: 0.75;
  border-color: #ffc107;
  background: #fffdf5;
}

.card-image {
  height: 140px;
  background: #f4f7fc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: opacity 0.2s;
}

.card-image:hover {
  opacity: 0.85;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.3;
}

.image-placeholder .placeholder-icon {
  width: 48px;
  height: 48px;
  stroke: #6c757d;
}

.archived-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ffc107;
  color: #212529;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
}

.archived-badge .archived-icon {
  width: 14px;
  height: 14px;
  stroke: #212529;
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.inventory-number {
  font-size: 12px;
  font-weight: 600;
  color: #4361ee;
  background: #eef2ff;
  padding: 2px 10px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.inventory-number .inventory-icon {
  width: 12px;
  height: 12px;
  stroke: #4361ee;
}

.title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: #1a1a2e;
  display: flex;
  align-items: center;
  gap: 6px;
}

.title .title-icon {
  width: 16px;
  height: 16px;
  stroke: #1a1a2e;
}

.subtitle {
  font-size: 13px;
  color: #888;
  margin: 0 0 6px 0;
}

.description {
  font-size: 13px;
  color: #444;
  margin: 0 0 8px 0;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  line-height: 1.5;
  flex: 1;
}

.description .desc-icon {
  width: 14px;
  height: 14px;
  stroke: #666;
  flex-shrink: 0;
  margin-top: 2px;
}

.description .description-text {
  word-break: break-word;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #666;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta .meta-icon {
  width: 14px;
  height: 14px;
  stroke: #666;
}

.purchase-basis {
  font-size: 12px;
  color: #888;
  margin: 4px 0 6px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.purchase-basis .purchase-icon {
  width: 14px;
  height: 14px;
  stroke: #888;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.actions .btn {
  flex: 1;
  min-width: 60px;
  justify-content: center;
}

.btn-full-width {
  flex: 1 1 100% !important;
  background: #dc3545 !important;
  color: white !important;
  border: 1.5px solid #dc3545 !important;
  justify-content: center;
}

.btn-full-width:hover {
  background: #c82333 !important;
  border-color: #bd2130 !important;
}

.btn-full-width .btn-icon {
  stroke: white;
}

.btn-history {
  flex: 1 1 100% !important;
  background: #6c757d !important;
  color: white !important;
  border: 1.5px solid #ced4da !important;
  justify-content: center;
}

.btn-history:hover {
  background: #5c636a !important;
}

.btn {
  padding: 4px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
}

.btn .btn-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 4px;
}

.btn-outline-primary {
  background: transparent;
  color: #0077c8;
  border: 1.5px solid #0077c8;
}

.btn-outline-primary:hover {
  background: #0077c8;
  color: white;
}

.btn-outline-primary:hover .btn-icon {
  stroke: white;
}

.btn-outline-danger {
  background: transparent;
  color: #dc3545;
  border: 1.5px solid #dc3545;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

.btn-outline-danger:hover .btn-icon {
  stroke: white;
}

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border: 1.5px solid #6c757d;
}

.btn-outline-secondary:hover {
  background: #6c757d;
  color: white;
}

.btn-outline-secondary:hover .btn-icon {
  stroke: white;
}

.btn-success {
  background: #28a745;
  color: white;
  border: 1.5px solid #28a745;
}

.btn-success:hover {
  background: #218838;
  border-color: #1e7e34;
}

.btn-success .btn-icon {
  stroke: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: 1.5px solid #dc3545;
}

.btn-danger:hover {
  background: #c82333;
  border-color: #bd2130;
}

.btn-danger .btn-icon {
  stroke: white;
}

.badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge .badge-icon {
  width: 12px;
  height: 12px;
  stroke: currentColor;
}

.badge-success {
  background: #e6f9f2;
  color: #06d6a0;
}

.badge-warning {
  background: #fff6e0;
  color: #ff9f1c;
}

.badge-danger {
  background: #fce4ec;
  color: #ef476f;
}

/* Адаптивность */
@media (max-width: 768px) {
  .card-image {
    height: 120px;
  }
  
  .card-body {
    padding: 12px;
  }
  
  .title {
    font-size: 14px;
  }
  
  .actions .btn {
    font-size: 11px;
    padding: 3px 8px;
  }
  
  .btn .btn-icon {
    width: 12px;
    height: 12px;
  }
}

@media (max-width: 480px) {
  .card-image {
    height: 100px;
  }
  
  .card-header {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .inventory-number {
    font-size: 10px;
  }
  
  .badge {
    font-size: 10px;
    padding: 2px 8px;
  }
  
  .description {
    font-size: 12px;
  }
  
  .meta {
    font-size: 12px;
    flex-wrap: wrap;
    gap: 4px;
  }
}
</style>