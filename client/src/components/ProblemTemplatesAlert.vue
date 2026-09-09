<template>
  <div v-if="problemTemplates.length > 0">
    <!-- БЛОК ПРОБЛЕМНЫХ ШАБЛОНОВ -->
    <div class="problem-alert">
      <div class="problem-alert-content">
        <div class="problem-alert-icon">
          <IconAlert class="alert-icon" />
        </div>
        <div class="problem-alert-info">
          <span class="problem-alert-title">Обнаружены проблемные шаблоны</span>
          <span class="problem-alert-count">{{ problemTemplates.length }}</span>
        </div>
        <button class="btn-toggle" @click="showProblemTemplates = !showProblemTemplates">
          <IconEye v-if="!showProblemTemplates" class="toggle-icon" />
          <IconEyeOff v-else class="toggle-icon" />
          {{ showProblemTemplates ? 'Скрыть' : 'Показать' }}
        </button>
      </div>
    </div>

    <!-- Список проблемных шаблонов -->
    <div v-if="showProblemTemplates && problemTemplates.length > 0" class="problem-list">
      <div 
        v-for="template in problemTemplates" 
        :key="template.id"
        class="problem-item"
      >
        <div class="problem-item-info">
          <span class="problem-item-title">{{ template.title }}</span>
          <div class="problem-item-meta">
            <IconBook class="meta-icon" />
            {{ template.discipline }}
            <IconFolder class="meta-icon" />
            {{ template.module || 'Без модуля' }}
          </div>
          <span class="status-badge" :class="template.is_active ? 'status-active' : 'status-inactive'">
            <IconCheck v-if="template.is_active" class="status-icon" />
            <IconClose v-else class="status-icon" />
            {{ template.is_active ? 'Активен' : 'Неактивен' }}
          </span>
        </div>
        <div class="problem-item-equipment">
          <span 
            v-for="item in template.equipment_list" 
            :key="item.equipment_id"
            class="equipment-tag"
            :class="getEquipmentStatusClass(item.equipment_id)"
          >
            <IconEquipment class="tag-icon" />
            {{ getEquipmentName(item.equipment_id) }}
            <span class="equipment-tag-status">
              {{ getEquipmentStatus(item.equipment_id) }}
            </span>
          </span>
        </div>
        <div class="problem-item-actions">
          <button class="btn-fix" @click="onEditClick?.(template)">
            <IconEdit class="btn-icon" />
            Редактировать
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  IconAlert,
  IconEye,
  IconEyeOff,
  IconBook,
  IconFolder,
  IconEquipment,
  IconCheck,
  IconClose,
  IconEdit
} from './icons';

const props = defineProps({
  templates: {
    type: Array,
    default: () => []
  },
  equipmentList: {
    type: Array,
    default: () => []
  },
  onEditClick: {
    type: Function,
    default: null
  }
});

const showProblemTemplates = ref(true);

const getEquipmentStatus = (id) => {
  const eq = props.equipmentList.find(e => e.id === id);
  if (!eq) return 'Неизвестно';
  if (eq.write_off_status === 'Списан') return 'Списан';
  return eq.working_status;
};

const getEquipmentName = (id) => {
  const eq = props.equipmentList.find(e => e.id === id);
  return eq ? eq.name : 'Неизвестно';
};

// ПОЛУЧАЕМ КЛАСС ДЛЯ СТАТУСА ОБОРУДОВАНИЯ
const getEquipmentStatusClass = (id) => {
  const status = getEquipmentStatus(id);
  const classes = {
    'Исправен': 'status-ok',
    'В ремонте': 'status-warning',
    'Требует ремонта': 'status-danger',
    'Списан': 'status-danger'
  };
  return classes[status] || '';
};

const isTemplateProblem = (template) => {
  if (!template.equipment_list || template.equipment_list.length === 0) return false;
  
  for (const item of template.equipment_list) {
    const status = getEquipmentStatus(item.equipment_id);
    if (status !== 'Исправен') return true;
  }
  return false;
};

const problemTemplates = computed(() => {
  return props.templates.filter(template => isTemplateProblem(template));
});
</script>

<style scoped>
/* ==========================================
   АЛАРТ
   ========================================== */
.problem-alert {
  background: #f8fafc;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.problem-alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.problem-alert-icon {
  flex-shrink: 0;
  color: #6c757d;
}

.problem-alert-icon .alert-icon {
  width: 22px;
  height: 22px;
  stroke: currentColor;
}

.problem-alert-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.problem-alert-title {
  font-size: 14px;
  font-weight: 500;
  color: #212529;
}

.problem-alert-count {
  font-size: 14px;
  font-weight: 600;
  color: #dc3545;
  background: #fce4ec;
  padding: 0 8px;
  border-radius: 12px;
}

.btn-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: transparent;
  color: #6c757d;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.btn-toggle:hover {
  background: #f8f9fa;
}

.btn-toggle .toggle-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}

/* ==========================================
   СПИСОК
   ========================================== */
.problem-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.problem-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.problem-item-info {
  flex: 1;
  min-width: 160px;
}

.problem-item-title {
  font-weight: 500;
  font-size: 14px;
  color: #212529;
  display: block;
  margin-bottom: 2px;
}

.problem-item-meta {
  font-size: 12px;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.problem-item-meta .meta-icon {
  width: 12px;
  height: 12px;
  stroke: #6c757d;
}

/* Статус шаблона */
.status-badge {
  font-size: 11px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 10px;
  border-radius: 12px;
  margin-top: 2px;
}

.status-badge .status-icon {
  width: 12px;
  height: 12px;
  stroke: currentColor;
}

.status-badge.status-active {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.status-inactive {
  background: #fce4ec;
  color: #c62828;
}

/* ==========================================
   ОБОРУДОВАНИЕ В ШАБЛОНЕ
   ========================================== */
.problem-item-equipment {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
  min-width: 120px;
}

.equipment-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-size: 12px;
  color: #212529;
  background: #f8f9fa;
}

.equipment-tag .tag-icon {
  width: 12px;
  height: 12px;
  stroke: #6c757d;
}

.equipment-tag .equipment-tag-status {
  font-weight: 500;
  margin-left: 2px;
}

/* СТАТУСЫ ОБОРУДОВАНИЯ С ЦВЕТАМИ */
.equipment-tag.status-ok {
  background: #e8f5e9;
  border-color: #a5d6a7;
}

.equipment-tag.status-ok .equipment-tag-status {
  color: #2e7d32;
}

.equipment-tag.status-warning {
  background: #fff3e0;
  border-color: #ffcc80;
}

.equipment-tag.status-warning .equipment-tag-status {
  color: #e65100;
}

.equipment-tag.status-danger {
  background: #fce4ec;
  border-color: #ef9a9a;
}

.equipment-tag.status-danger .equipment-tag-status {
  color: #c62828;
}

.problem-item-actions {
  flex-shrink: 0;
}

.btn-fix {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 14px;
  background: #0077c8;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-fix:hover {
  background: #00447c;
}

.btn-fix .btn-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
}

/* ==========================================
   АДАПТИВНОСТЬ
   ========================================== */
@media (max-width: 768px) {
  .problem-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .problem-item-actions {
    align-self: flex-end;
  }
}
</style>