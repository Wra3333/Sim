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
            <span>{{ template.discipline }}</span>
            <IconFolder class="meta-icon" />
            <span>{{ template.module || 'Без модуля' }}</span>
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
            <span class="equipment-tag-name">{{ getEquipmentName(item.equipment_id) }}</span>
            <span class="equipment-tag-status">
              {{ getEquipmentStatus(item.equipment_id) }}
            </span>
          </span>
        </div>

        <div class="problem-item-actions">
          <button
            v-if="authStore.hasRole('admin', 'methodist', 'lab_assistant')"
            class="btn-fix"
            @click="onEditClick?.(template)"
          >
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
import { useAuthStore } from '../stores/auth.store';
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
  templates: { type: Array, default: () => [] },
  equipmentList: { type: Array, default: () => [] },
  onEditClick: { type: Function, default: null }
});

const authStore = useAuthStore();

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

const getEquipmentStatusClass = (id) => {
  const status = getEquipmentStatus(id);
  const classes = {
    'Исправен': 'status-ok',
    'Частично неисправен': 'status-ok',
    'В ремонте': 'status-warning',
    'Требует ремонта': 'status-danger',
    'Списан': 'status-danger'
  };
  return classes[status] || '';
};

const isEquipmentProblematic = (id) => {
  const eq = props.equipmentList.find(e => e.id === id);
  if (!eq) return false;
  return (
    eq.working_status === 'Требует ремонта' ||
    eq.working_status === 'В ремонте' ||
    eq.working_status === 'Списан' ||
    eq.write_off_status === 'На списание' ||
    eq.write_off_status === 'Списан'
  );
};

const isTemplateProblem = (template) => {
  if (!template.equipment_list || template.equipment_list.length === 0) return false;
  for (const item of template.equipment_list) {
    if (isEquipmentProblematic(item.equipment_id)) return true;
  }
  return false;
};

const problemTemplates = computed(() => {
  return props.templates.filter(template => isTemplateProblem(template));
});
</script>

<style scoped>
/* ==========================================
   АЛАРТ — улучшенная компоновка
   ========================================== */
.problem-alert {
  background: #f8fafc;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 16px;
}

.problem-alert-content {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

/* Иконка */
.problem-alert-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff3e0;
  color: #e65100;
  border-radius: 8px;
}

.problem-alert-icon .alert-icon {
  width: 20px;
  height: 20px;
  stroke: currentColor;
}

/* Текстовая группа: заголовок + счётчик */
.problem-alert-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.problem-alert-title {
  font-size: 14px;
  font-weight: 500;
  color: #212529;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.problem-alert-count {
  font-size: 12px;
  font-weight: 600;
  color: #c62828;
  background: #fce4ec;
  padding: 2px 10px;
  border-radius: 10px;
  flex-shrink: 0;
  line-height: 1.4;
}

/* Кнопка — прижата вправо */
.btn-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  color: #495057;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  white-space: nowrap;
  margin-left: auto;
}

.btn-toggle:hover {
  background: #f1f3f5;
  border-color: #adb5bd;
  color: #212529;
}

.btn-toggle:active {
  background: #e9ecef;
}

.btn-toggle .toggle-icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  flex-shrink: 0;
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
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
}

.problem-item-info {
  flex: 1 1 200px;
  min-width: 0;
}

.problem-item-title {
  font-weight: 500;
  font-size: 14px;
  color: #212529;
  display: block;
  margin-bottom: 4px;
  word-break: normal;
  overflow-wrap: anywhere;
}

.problem-item-meta {
  font-size: 12px;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 6px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.problem-item-meta .meta-icon {
  width: 12px;
  height: 12px;
  stroke: #6c757d;
  flex-shrink: 0;
}

.problem-item-meta span {
  min-width: 0;
  overflow-wrap: anywhere;
}

/* Статус шаблона */
.status-badge {
  font-size: 11px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 12px;
  white-space: nowrap;
}

.status-badge .status-icon {
  width: 12px;
  height: 12px;
  stroke: currentColor;
  flex-shrink: 0;
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
   ОБОРУДОВАНИЕ
   ========================================== */
.problem-item-equipment {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1 1 240px;
  min-width: 0;
  align-content: flex-start;
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
  max-width: 100%;
  min-width: 0;
}

.equipment-tag .tag-icon {
  width: 12px;
  height: 12px;
  stroke: #6c757d;
  flex-shrink: 0;
}

.equipment-tag-name {
  word-break: normal;
  overflow-wrap: anywhere;
  min-width: 0;
}

.equipment-tag .equipment-tag-status {
  font-weight: 500;
  margin-left: 2px;
  white-space: nowrap;
  flex-shrink: 0;
}

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

/* ==========================================
   ДЕЙСТВИЯ
   ========================================== */
.problem-item-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
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
  white-space: nowrap;
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

@media (max-width: 1100px) {
  .problem-alert {
    padding: 12px 14px;
  }

  .problem-item {
    padding: 10px 14px;
    gap: 10px;
  }

  .problem-item-title {
    font-size: 13.5px;
  }

  .equipment-tag {
    font-size: 11.5px;
    padding: 2px 8px;
  }

  .btn-fix {
    padding: 4px 12px;
    font-size: 12.5px;
  }
}

@media (max-width: 768px) {
  .problem-alert {
    padding: 12px;
  }

  .problem-alert-content {
    gap: 10px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .problem-alert-icon {
    width: 32px;
    height: 32px;
  }
  .problem-alert-icon .alert-icon {
    width: 18px;
    height: 18px;
  }

  /* Заголовок может переноситься */
  .problem-alert-info {
    flex: 1;
    min-width: 0;
    flex-wrap: wrap;
    row-gap: 4px;
  }

  .problem-alert-title {
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    font-size: 13.5px;
    overflow-wrap: anywhere;
  }

  .problem-alert-count {
    font-size: 11.5px;
    padding: 1px 8px;
  }

  /* Кнопка на всю ширину — на отдельной строке */
  .btn-toggle {
    flex: 1 1 100%;
    justify-content: center;
    margin-left: 0;
    order: 10;
    height: 40px;
    font-size: 13px;
  }

  .problem-item {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .problem-item-info {
    flex: 1 1 auto;
  }

  .problem-item-equipment {
    flex: 1 1 auto;
  }

  .problem-item-actions {
    align-self: stretch;
    justify-content: flex-end;
  }

  .btn-fix {
    width: 100%;
    justify-content: center;
    height: 40px;
  }

  .equipment-tag {
    font-size: 12px;
    padding: 4px 10px;
  }
}

@media (max-width: 480px) {
  .problem-alert {
    padding: 10px 12px;
  }

  .problem-alert-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
  }
  .problem-alert-icon .alert-icon {
    width: 16px;
    height: 16px;
  }

  .problem-alert-title {
    font-size: 13px;
  }

  .problem-item {
    padding: 10px 12px;
  }

  .problem-item-title {
    font-size: 13px;
  }

  .problem-item-meta {
    font-size: 11px;
    gap: 4px;
  }

  .equipment-tag {
    font-size: 11px;
    padding: 3px 8px;
  }

  .btn-toggle {
    font-size: 12px;
    height: 38px;
  }
}
</style>