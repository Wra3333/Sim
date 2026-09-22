<template>
  <tr 
    class="template-card-row"
    @click="handleRowClick"
  >
    <td class="template-date">{{ formatDate(template.created_at) }}</td>

    <td class="template-title-cell">
      <strong class="template-title">{{ template.title }}</strong>
      <span v-if="template.description" class="template-desc">
        {{ template.description }}
      </span>
    </td>

    <td class="discipline-cell">{{ template.discipline || '—' }}</td>

    <td class="equipment-cell">
      <div class="equipment-preview">
        <span 
          v-for="(item, index) in equipmentPreview" 
          :key="index"
          class="equipment-tag"
          :class="{ 'equipment-tag-broken': isPreviewBroken(index) }"
        >
          {{ item }}
        </span>
        <span v-if="equipmentCount > 3" class="equipment-tag more">
          +{{ equipmentCount - 3 }}
        </span>
        <span v-if="equipmentCount === 0" class="no-equipment">—</span>
      </div>
    </td>

    <td class="status-cell">
      <span class="badge" :class="template.is_active ? 'badge-success' : 'badge-secondary'">
        <IconCheck v-if="template.is_active" class="badge-icon" />
        <IconAlert v-else class="badge-icon" />
        {{ template.is_active ? 'Активен' : 'Неактивен' }}
      </span>
    </td>

    <td class="actions-cell" @click.stop>
      <div class="table-actions">
        <button
          v-if="authStore.hasRole('admin', 'methodist', 'lab_assistant')"
          class="btn btn-sm btn-outline-primary"
          @click="$emit('edit', template)"
          title="Редактировать"
        >
          <IconEdit class="btn-icon" />
        </button>

        <button
          v-if="authStore.hasRole('admin', 'methodist', 'lab_assistant')"
          class="btn btn-sm btn-outline-danger"
          @click="$emit('delete', template.id)"
          title="Удалить"
        >
          <IconTrash class="btn-icon" />
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue';
import { useFormatters } from '../../composables/useFormatters';
import { useAuthStore } from '../../stores/auth.store';
import {
  IconCheck,
  IconAlert,
  IconEdit,
  IconTrash
} from '../icons';

const { formatDate } = useFormatters();
const authStore = useAuthStore();

// ============================================
//  PROPS
// ============================================
const props = defineProps({
  template: {
    type: Object,
    required: true
  },
  allEquipment: {
    type: Array,
    default: () => []
  }
});

// ============================================
//  EMITS
// ============================================
const emit = defineEmits(['row-click', 'edit', 'delete']);

// ============================================
//  КЛИК ПО СТРОКЕ
// ============================================
const handleRowClick = () => {
  emit('row-click', props.template);
};

// ============================================
//  ОБОРУДОВАНИЕ
// ============================================
const equipmentList = computed(() => {
  if (!props.template.equipment_list) return [];
  try {
    return typeof props.template.equipment_list === 'string'
      ? JSON.parse(props.template.equipment_list)
      : props.template.equipment_list;
  } catch {
    return [];
  }
});

const equipmentCount = computed(() => equipmentList.value.length);

const isEquipmentProblematic = (eq) => {
  if (!eq) return false;
  return (
    eq.working_status === 'Требует ремонта' ||
    eq.working_status === 'В ремонте' ||
    eq.working_status === 'Списан' ||
    eq.write_off_status === 'На списание' ||
    eq.write_off_status === 'Списан'
  );
};

const equipmentPreview = computed(() => {
  return equipmentList.value.slice(0, 3).map(item => {
    const eq = props.allEquipment.find(e => e.id === item.equipment_id);
    if (!eq) return 'Оборудование #' + item.equipment_id;

    const isBroken = isEquipmentProblematic(eq);

    return isBroken ? `${eq.name} (${eq.working_status})` : eq.name;
  });
});

const isPreviewBroken = (index) => {
  const item = equipmentList.value[index];
  if (!item) return false;
  const eq = props.allEquipment.find(e => e.id === item.equipment_id);
  if (!eq) return false;
  return isEquipmentProblematic(eq);
};
</script>

<style scoped>
/* ============================================
   СТРОКА
   ============================================ */
.template-card-row {
  cursor: pointer;
  transition: background 0.15s;
}

.template-card-row:hover {
  background: #f0f7ff;
}

/* ============================================
   ЯЧЕЙКИ — базовые
   ============================================ */
.template-card-row td {
  padding: 10px 12px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: top;
  line-height: 1.35;
  word-break: normal;              /* ← НЕ ломаем слова по буквам */
  overflow-wrap: break-word;       /* ← ломаем только длинные слова */
  min-width: 0;
}

/* Дата — не переносится */
.template-date {
  font-size: 13px;
  color: #495057;
  white-space: nowrap;             /* ← дата в одну строку */
}

/* Название — может переноситься по словам */
.template-title-cell {
  word-break: normal;
}

.template-title {
  font-size: 14px;
  font-weight: 600;
  color: #212529;
  display: block;
  word-break: normal;
  overflow-wrap: break-word;
}

.template-desc {
  display: block;
  font-size: 12px;
  color: #6c757d;
  margin-top: 2px;
  word-break: normal;
  overflow-wrap: break-word;
}

/* Дисциплина — не переносится, если влезает */
.discipline-cell {
  color: #495057;
  white-space: nowrap;             /* ← дисциплина в одну строку */
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ============================================
   ОБОРУДОВАНИЕ
   ============================================ */
.equipment-cell {
  word-break: normal;
}

.equipment-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}

.equipment-tag {
  display: inline-block;
  background: #e8f0fe;
  color: #1a73e8;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  white-space: normal;
  word-break: normal;
  overflow-wrap: break-word;
  max-width: 100%;
  line-height: 1.3;
}

.equipment-tag.more {
  background: #e9ecef;
  color: #495057;
  white-space: nowrap;
}

.equipment-tag.equipment-tag-broken {
  background: #fce4ec;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.no-equipment {
  color: #adb5bd;
  font-size: 13px;
}

/* ============================================
   СТАТУС
   ============================================ */
.status-cell {
  white-space: nowrap;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.badge .badge-icon {
  width: 12px;
  height: 12px;
  stroke: currentColor;
  flex-shrink: 0;
}

.badge-success {
  background: #d4edda;
  color: #155724;
}

.badge-secondary {
  background: #e9ecef;
  color: #495057;
}

/* ============================================
   ДЕЙСТВИЯ
   ============================================ */
.actions-cell {
  padding-left: 8px;
  white-space: nowrap;
  width: 80px;                     /* ← фиксируем ширину */
}

.table-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  flex-wrap: nowrap;
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
  gap: 6px;
}

.btn .btn-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.btn-sm {
  padding: 0;
  border-radius: 5px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.table-actions .btn .btn-icon {
  width: 14px;
  height: 14px;
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

/* ============================================
   АДАПТИВНОЕ СЖАТИЕ
   ============================================ */
@media (max-width: 1400px) {
  .template-card-row td {
    padding: 9px 10px;
  }
}

@media (max-width: 1280px) {
  .template-card-row td {
    padding: 8px 8px;
  }
  .template-title { font-size: 13.5px; }
  .template-desc  { font-size: 11.5px; }
  .template-date  { font-size: 12.5px; }
}

@media (max-width: 1100px) {
  .template-card-row td {
    padding: 7px 6px;
  }
  .template-title { font-size: 13px; }
  .template-desc  { font-size: 11px; }

  .equipment-tag {
    font-size: 10px;
    padding: 1px 6px;
  }

  .badge {
    font-size: 10px;
    padding: 3px 8px;
  }

  .btn-sm {
    width: 26px;
    height: 26px;
  }
}

@media (max-width: 1024px) {
  .template-card-row td {
    padding: 6px 5px;
  }
  .template-title { font-size: 12.5px; }
  .template-desc  { display: none; }

  .equipment-tag {
    font-size: 9.5px;
    padding: 1px 5px;
  }

  .badge {
    font-size: 9.5px;
    padding: 2px 6px;
  }
  .badge .badge-icon { width: 10px; height: 10px; }
}
</style>