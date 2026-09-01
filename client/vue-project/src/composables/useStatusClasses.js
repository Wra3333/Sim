// ============================================
// СТАТУСЫ И КЛАССЫ ДЛЯ БЕЙДЖЕЙ
// ============================================

import { computed } from 'vue';

export function useStatusClasses() {
  // Класс статуса занятия
  const getStatusClass = (status) => {
    const map = {
      'Проведено': 'badge-success',
      'Запланировано': 'badge-warning',
      'Отменено': 'badge-danger'
    };
    return map[status] || 'badge-secondary';
  };

  // Класс статуса ремонта
  const getRepairStatusClass = (resolved) => {
    return resolved ? 'badge-success' : 'badge-warning';
  };

  const getRepairStatusText = (resolved) => {
    return resolved ? '✅ Устранена' : '⚠️ Новая';
  };

  // Класс статуса оборудования
  const getEquipmentStatusClass = (status) => {
    const map = {
      'Исправен': 'badge-success',
      'Требует ремонта': 'badge-warning',
      'В ремонте': 'badge-danger'
    };
    return map[status] || 'badge-secondary';
  };

  // Класс статуса списания
  const getWriteOffClass = (status) => {
    const map = {
      'На балансе': 'badge-success',
      'На списание': 'badge-warning',
      'Списан': 'badge-danger'
    };
    return map[status] || 'badge-secondary';
  };

  return {
    getStatusClass,
    getRepairStatusClass,
    getRepairStatusText,
    getEquipmentStatusClass,
    getWriteOffClass
  };
}