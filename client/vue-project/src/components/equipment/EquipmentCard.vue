<script setup>
import { computed } from 'vue';
import { useStatusClasses } from '../../composables/useStatusClasses';

const props = defineProps({
  equipment: { type: Object, required: true }
});

const emit = defineEmits(['edit', 'delete', 'view', 'history']);

const { getEquipmentStatusClass, getWriteOffClass } = useStatusClasses();

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

const API_URL = 'http://localhost:3000/uploads/';

const photoUrl = computed(() => {
  if (!props.equipment.photo) return null;
  return `${API_URL}${props.equipment.photo}`;
});
</script>

<template>
  <div class="equipment-card">
    <div class="card-image">
      <img v-if="photo" :src="photoUrl" alt="Фото оборудования" />
      <div v-else class="image-placeholder">📷</div>
    </div>
    <div class="card-body">
      <div class="card-header">
        <span class="inventory-number">{{ inventoryNumber }}</span>
        <span class="badge" :class="statusClass">{{ workingStatus }}</span>
      </div>
      <h3 class="title">{{ equipmentName }}</h3>
      <p class="subtitle">{{ inventoryName }}</p>
      <div class="meta">
        <span>Год закупки: {{ yearOfRelease }}</span>
        <span class="badge" :class="writeOffClass">{{ writeOffStatus }}</span>
      </div>
      <p class="description" v-if="description">{{ description }}</p>
      <p class="purchase-basis" v-if="purchaseBasis">Основание закупки: {{ purchaseBasis }}</p>
      <div class="actions">
        <button class="btn btn-sm btn-outline-primary" @click="$emit('edit', equipment)">
           Редактировать
        </button>
        <button class="btn btn-sm btn-outline-danger" @click="$emit('delete', equipment.id)">
           Удалить
        </button>
        <button class="btn btn-sm btn-outline-secondary btn-history" @click="$emit('history', equipment)">
           История поломок
        </button>
      </div>
    </div>
  </div>
</template>

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
}

.equipment-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-image {
  height: 140px;
  background: #f4f7fc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-placeholder {
  font-size: 48px;
  opacity: 0.3;
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
}

.title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: #1a1a2e;
}

.subtitle {
  font-size: 13px;
  color: #888;
  margin: 0 0 8px 0;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #666;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  flex-grow: 1;
}

.description {
  font-size: 13px;
  color: #666;
  margin: 8px 0 4px 0;
  flex: 1;
}

.purchase-basis {
  font-size: 12px;
  color: #888;
  margin: 4px 0 8px 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.actions .btn {
  flex: 1;
  min-width: 60px;
}

.btn-history {
  flex: 1 1 100% !important;
  background: #6c757d !important;
  color: white !important;
  border: 1.5px solid #ced4da !important;
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
  font-weight: 500;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 4px;
}

.btn-outline-primary {
  background: transparent;
  color: #4361ee;
  border: 1.5px solid #4361ee;
}

.btn-outline-primary:hover {
  background: #4361ee;
  color: white;
}

.btn-outline-danger {
  background: transparent;
  color: #ef476f;
  border: 1.5px solid #ef476f;
}

.btn-outline-danger:hover {
  background: #ef476f;
  color: white;
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

.badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 500;
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
</style>