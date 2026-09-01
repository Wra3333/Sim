<!-- components/ProblemTemplatesAlert.vue -->
<template>
  <div v-if="problemTemplates.length > 0">
    <div class="alert alert-warning">
      <div class="alert-content">
        <span class="alert-icon">📋</span>
        <div>
          <strong>Внимание!</strong> 
          {{ problemTemplates.length }} шаблонов содержат неисправное оборудование.
          <button class="btn btn-sm btn-outline-warning" @click="showProblemTemplates = !showProblemTemplates">
            {{ showProblemTemplates ? 'Скрыть' : 'Показать' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showProblemTemplates && problemTemplates.length > 0" class="problem-templates-list">
      <div 
        v-for="template in problemTemplates" 
        :key="template.id"
        class="problem-template-item"
      >
        <div class="problem-template-info">
          <span class="problem-template-title">{{ template.title }}</span>
          <span class="problem-template-meta">
            {{ template.discipline }} · {{ template.module || 'Без модуля' }}
          </span>
          <span class="problem-template-status">
            {{ template.is_active ? '✅ Активен' : '❌ Неактивен' }}
          </span>
        </div>
        <div class="problem-template-equipment">
          <span 
            v-for="item in template.equipment_list" 
            :key="item.equipment_id"
            class="eq-problem-tag"
          >
            {{ getEquipmentName(item.equipment_id) }}
            <span class="eq-problem-status">❌ {{ getEquipmentStatus(item.equipment_id) }}</span>
          </span>
        </div>
        <div class="problem-template-actions">
          <slot name="actions" :template="template">
            <button class="btn btn-sm btn-warning" @click="onEditClick?.(template)">
              ✏️ Редактировать
            </button>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

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
.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.alert-warning {
  background: #fff3cd;
  border: 1px solid #ffe69b;
  color: #856404;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-icon {
  font-size: 24px;
}

.btn {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 13px;
}

.btn-outline-warning {
  background: transparent;
  color: #ffc107;
  border: 1px solid #ffc107;
}

.btn-outline-warning:hover {
  background: #ffc107;
  color: #212529;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
  border-color: #ffc107;
}

.btn-warning:hover {
  background: #e0a800;
}

.problem-templates-list {
  background: #fff3cd;
  border: 1px solid #ffe69b;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.problem-template-item {
  background: white;
  border-radius: 6px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.problem-template-info {
  flex: 1;
  min-width: 200px;
}

.problem-template-title {
  font-weight: 600;
  font-size: 14px;
  display: block;
}

.problem-template-meta {
  font-size: 12px;
  color: #6c757d;
  margin-right: 8px;
}

.problem-template-status {
  font-size: 12px;
  font-weight: 500;
}

.problem-template-equipment {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.eq-problem-tag {
  background: #f8d7da;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.eq-problem-status {
  color: #dc3545;
  font-weight: 500;
}

.problem-template-actions {
  flex-shrink: 0;
}
</style>