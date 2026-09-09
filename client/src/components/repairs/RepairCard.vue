<template>
  <div class="repair-item" :class="{ 'repair-resolved': isResolved, 'repair-impossible': isImpossible }">
    <div class="repair-header">
      <div class="repair-id">
        <IconTag class="id-icon" />
        Заявка #{{ repairId }}
      </div>
      <div class="repair-status">
        <span class="badge" :class="statusClass">
          <IconCheck v-if="isResolved" class="badge-icon" />
          <IconAlert v-else class="badge-icon" />
          {{ statusText }}
        </span>
        <span v-if="isResolved && hasResolution" class="repair-date">
          <IconCalendar class="date-icon" />
          {{ resolutionDate }}
        </span>
      </div>
    </div>

    <div class="repair-body">
      <div class="repair-equipment">
        <IconEquipment class="eq-icon" />
        <strong>{{ equipmentName }}</strong>
        <span class="inv-number">
          <IconTag class="inv-icon" />
          Инв. № {{ inventoryNumber }}
        </span>
        <span v-if="isImpossible" class="badge badge-danger">
          <IconTrash class="badge-icon" />
          Списан
        </span>
      </div>
      <div class="repair-description">
        <IconFileText class="desc-icon" />
        {{ malfunction }}
      </div>
      <div class="repair-meta">
        <span>
          <IconCalendar class="meta-icon" />
          {{ detectionDate }}
        </span>
        <span>
          <IconUser class="meta-icon" />
          {{ detectedBy }}
        </span>
        <span v-if="hasResolver">
          <IconCheck class="meta-icon" />
          {{ resolvedBy }}
        </span>
        <span v-else-if="isResolved" class="text-muted">
          <IconUser class="meta-icon" />
        </span>
      </div>
      <div v-if="isImpossible && writeOffReason" class="write-off-reason">
        <IconAlert class="wo-icon" />
        <strong>Причина списания:</strong> {{ writeOffReason }}
      </div>
    </div>

    <div class="repair-actions">
      <button 
        v-if="!isResolved" 
        class="btn btn-sm btn-success" 
        @click="$emit('resolve', repair)"
      >
        <IconCheck class="btn-icon" />
        Устранить
      </button>
      
      <button 
        v-if="isResolved" 
        class="btn btn-sm btn-outline-secondary" 
        @click="$emit('editResolvedBy', repair)"
      >
        <IconUser class="btn-icon" />
        Кто устранил
      </button>

      <button 
        class="btn btn-sm btn-outline-primary" 
        @click="$emit('edit', repair)"
        v-if="!isResolved" 
      >
        <IconEdit class="btn-icon" />
        Редактировать
      </button>
      
      <button 
        class="btn btn-sm btn-outline-danger" 
        @click="$emit('delete', repair.id)"
      >
        <IconTrash class="btn-icon" />
        Удалить
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useFormatters } from '../../composables/useFormatters';
import { useStatusClasses } from '../../composables/useStatusClasses';
import {
  IconTag,
  IconCheck,
  IconAlert,
  IconCalendar,
  IconEquipment,
  IconTrash,
  IconFileText,
  IconUser,
  IconEdit
} from '../icons';

const props = defineProps({
  repair: { type: Object, required: true }
});

const emit = defineEmits(['resolve', 'edit', 'delete', 'editResolvedBy']);

const { formatDate } = useFormatters();
const { getRepairStatusClass, getRepairStatusText } = useStatusClasses();

const isResolved = computed(() => props.repair.is_resolved);
const repairId = computed(() => props.repair.id);
const equipmentName = computed(() => props.repair.equipment?.name || 'Оборудование');
const inventoryNumber = computed(() => props.repair.equipment?.inventory_number || '—');
const malfunction = computed(() => props.repair.nature_of_malfunction);
const detectedBy = computed(() => props.repair.detected_by);
const resolvedBy = computed(() => props.repair.resolved_by);
const detectionDate = computed(() => formatDate(props.repair.detection_date));
const resolutionDate = computed(() => formatDate(props.repair.resolution_date));
const statusClass = computed(() => getRepairStatusClass(props.repair.is_resolved));
const statusText = computed(() => getRepairStatusText(props.repair.is_resolved));
const hasResolution = computed(() => !!props.repair.resolution_date);
const hasResolver = computed(() => !!props.repair.resolved_by);

const isImpossible = computed(() => props.repair.resolution_status === 'impossible');
const writeOffReason = computed(() => props.repair.write_off_reason);
</script>

<style scoped>
.repair-item {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  border-left: 4px solid #0d6efd;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
}

.repair-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.repair-item.repair-resolved {
  border-left-color: #28a745;
  opacity: 0.85;
}

.repair-item.repair-impossible {
  border-left-color: #dc3545;
  background: #fdf2f2;
}

.repair-item.repair-impossible:hover {
  background: #fce8e8;
}

.repair-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.repair-id {
  font-weight: 600;
  color: #0d6efd;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.repair-id .id-icon {
  width: 14px;
  height: 14px;
  stroke: #0d6efd;
}

.repair-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.repair-date {
  font-size: 12px;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 2px;
}

.repair-date .date-icon {
  width: 14px;
  height: 14px;
  stroke: #6c757d;
}

.repair-body {
  margin-bottom: 8px;
}

.repair-equipment {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 14px;
  flex-wrap: wrap;
}

.repair-equipment .eq-icon {
  width: 16px;
  height: 16px;
  stroke: #444;
}

.repair-equipment .inv-number {
  font-size: 12px;
  color: #6c757d;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.repair-equipment .inv-number .inv-icon {
  width: 12px;
  height: 12px;
  stroke: #6c757d;
}

.repair-description {
  font-size: 14px;
  color: #444;
  margin: 6px 0 10px 0;
  padding: 10px 14px;
  background: #f8f9fa;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.repair-description .desc-icon {
  width: 16px;
  height: 16px;
  stroke: #444;
  flex-shrink: 0;
  margin-top: 2px;
}

.repair-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #6c757d;
  flex-wrap: wrap;
}

.repair-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.repair-meta .meta-icon {
  width: 14px;
  height: 14px;
  stroke: #6c757d;
}

.write-off-reason {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f8d7da;
  border-radius: 6px;
  font-size: 13px;
  color: #721c24;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.write-off-reason .wo-icon {
  width: 16px;
  height: 16px;
  stroke: #721c24;
  flex-shrink: 0;
  margin-top: 1px;
}

.write-off-reason strong {
  color: #721c24;
}

.repair-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.text-muted {
  color: #adb5bd;
  font-style: italic;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge {
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge .badge-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}

.badge-success {
  background: #d1e7dd;
  color: #0f5132;
}

.badge-warning {
  background: #fff3cd;
  color: #664d03;
}

.badge-danger {
  background: #f8d7da;
  color: #842029;
}

.btn {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn .btn-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}

.btn-success {
  background: #198754;
  color: white;
  border-color: #198754;
}

.btn-success:hover {
  background: #157347;
  border-color: #146c43;
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
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline-secondary:hover {
  background: #6c757d;
  color: white;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 13px;
}
</style>