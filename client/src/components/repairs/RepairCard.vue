<template>
  <tr 
    class="repair-card-row"
    :class="{ 
      'row-resolved': repair.is_resolved, 
      'row-impossible': repair.resolution_status === 'impossible' 
    }"
    @click="handleRowClick"
  >
    <td class="repair-id">#{{ repair.id }}</td>

    <td>
      <strong class="equipment-name">{{ repair.equipment?.name || 'Оборудование' }}</strong>
      <span class="inv-number">Инв. № {{ repair.equipment?.inventory_number || '—' }}</span>
    </td>

    <td class="description-cell">
      <span class="desc-text">{{ repair.nature_of_malfunction || '—' }}</span>
      <span 
        v-if="repair.resolution_status === 'impossible'" 
        class="badge badge-danger badge-sm"
      >
        <IconTrash class="badge-icon" />
        Списан
      </span>
    </td>

    <td class="date-cell">{{ formatDate(repair.detection_date) }}</td>

    <td class="detected-by-cell">{{ repair.detected_by || '—' }}</td>

    <td class="possibility-cell">
      <span 
        class="possibility-badge"
        :class="getPossibilityClass(repair.repair_possibility)"
      >
        <IconCheck 
          v-if="repair.repair_possibility === 'Самостоятельно'" 
          class="badge-icon" 
        />
        <IconUser 
          v-else-if="repair.repair_possibility === 'Требуется сервисный инженер'" 
          class="badge-icon" 
        />
        <IconAlert 
          v-else-if="repair.repair_possibility === 'Не подлежит ремонту'" 
          class="badge-icon" 
        />
        <span>{{ repair.repair_possibility || '—' }}</span>
      </span>
    </td>

    <td class="status-cell">
      <span class="badge" :class="getStatusClass(repair.is_resolved)">
        <IconCheck v-if="repair.is_resolved" class="badge-icon" />
        <IconAlert v-else class="badge-icon" />
        {{ repair.is_resolved ? 'Устранена' : 'Новая' }}
      </span>
    </td>

    <td class="resolved-by-cell">{{ repair.resolved_by || '—' }}</td>

    <td class="actions-cell" @click.stop>
      <div class="table-actions">
        <button 
          v-if="!repair.is_resolved" 
          class="btn btn-sm btn-success" 
          @click="$emit('resolve', repair)"
          title="Устранить"
        >
          <IconCheck class="btn-icon" />
        </button>

        <button 
          v-if="repair.is_resolved" 
          class="btn btn-sm btn-outline-secondary" 
          @click="$emit('edit-resolved-by', repair)"
          title="Кто устранил"
        >
          <IconUser class="btn-icon" />
        </button>

        <button 
          class="btn btn-sm btn-outline-primary" 
          @click="$emit('edit', repair)"
          title="Редактировать"
        >
          <IconEdit class="btn-icon" />
        </button>

        <button 
          v-if="!repair.is_resolved" 
          class="btn btn-sm btn-outline-danger" 
          @click="$emit('delete', repair.id)"
          title="Удалить"
        >
          <IconTrash class="btn-icon" />
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup>
import {
  IconCheck,
  IconAlert,
  IconUser,
  IconEdit,
  IconTrash
} from '../icons';

const props = defineProps({
  repair: { type: Object, required: true }
});

const emit = defineEmits(['row-click', 'resolve', 'edit-resolved-by', 'edit', 'delete']);

const handleRowClick = () => {
  emit('row-click', props.repair);
  emit('edit', props.repair);
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getStatusClass = (isResolved) => {
  return isResolved ? 'badge-success' : 'badge-warning';
};

const getPossibilityClass = (value) => {
  const classes = {
    'Самостоятельно': 'possibility-easy',
    'Требуется сервисный инженер': 'possibility-medium',
    'Не подлежит ремонту': 'possibility-hard'
  };
  return classes[value] || 'possibility-unknown';
};
</script>

<style scoped>
/* ============================================
   СТРОКА
   ============================================ */
.repair-card-row {
  cursor: pointer;
  transition: background 0.15s;
}

.repair-card-row:hover {
  background: #f0f7ff;
}

.repair-card-row.row-resolved {
  opacity: 0.85;
}

.repair-card-row.row-resolved:hover {
  background: #f0f7ff;
}

.repair-card-row.row-impossible {
  background: #fdf2f2;
}

.repair-card-row.row-impossible:hover {
  background: #fce8e8;
}

/* ============================================
   ЯЧЕЙКИ
   ============================================ */
.repair-card-row td {
  padding: 12px 16px;
  vertical-align: middle;
  line-height: 1.4;
}

.repair-id {
  font-weight: 600;
  color: #0d6efd;
  font-size: 14px;
  white-space: nowrap;
}

.equipment-name {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #212529;
  margin-bottom: 3px;
}

.inv-number {
  display: block;
  font-size: 12px;
  color: #6c757d;
}

.description-cell {
  max-width: 300px;
  padding-right: 22px;
}

.desc-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.45;
  word-break: break-word;
}

.date-cell,
.detected-by-cell,
.resolved-by-cell {
  color: #495057;
  white-space: nowrap;
}

.status-cell,
.possibility-cell {
  white-space: nowrap;
}

/* ============================================
   БЕЙДЖИ
   ============================================ */
.badge {
  padding: 5px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.badge .badge-icon {
  width: 13px;
  height: 13px;
  stroke: currentColor;
  flex-shrink: 0;
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

.badge-sm {
  font-size: 10px;
  padding: 2px 8px;
  margin-top: 5px;
}

/* ============================================
   ВОЗМОЖНОСТЬ УСТРАНЕНИЯ
   ============================================ */
.possibility-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.possibility-badge .badge-icon {
  width: 13px;
  height: 13px;
  stroke: currentColor;
  flex-shrink: 0;
}

.possibility-easy {
  background: #d4edda;
  color: #155724;
}

.possibility-medium {
  background: #fff3cd;
  color: #856404;
}

.possibility-hard {
  background: #f8d7da;
  color: #721c24;
}

.possibility-unknown {
  background: #e9ecef;
  color: #495057;
}

/* ============================================
   КНОПКИ — уменьшенные
   ============================================ */
.actions-cell {
  padding-left: 10px;
}

.table-actions {
  display: flex;
  gap: 4px;                         /* ✅ было 6px */
  flex-wrap: nowrap;
  justify-content: flex-end;
}

.btn {
  padding: 6px 14px;
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

/* ✅ Уменьшенная кнопка */
.btn-sm {
  padding: 0;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;                      /* ✅ было 30px */
  height: 26px;                     /* ✅ было 30px */
  flex-shrink: 0;
}

/* ✅ Уменьшенная иконка внутри кнопки */
.table-actions .btn .btn-icon {
  width: 13px;                      /* ✅ было 16px */
  height: 13px;                     /* ✅ было 16px */
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

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline-secondary:hover {
  background: #6c757d;
  color: white;
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
</style>