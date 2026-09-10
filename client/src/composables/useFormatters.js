// composables/useFormatters.js

// ============================================
// ФОРМАТТЕРЫ ДАТ И СТАТУСОВ
// ============================================

export function useFormatters() {
  // Форматирование даты
  const formatDate = (date) => {
    if (!date) return '—';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  // Форматирование времени
  const formatTime = (time) => {
    if (!time) return '—';
    
    try {
      if (typeof time === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(time)) {
        return time.slice(0, 5);
      }
      
      if (typeof time === 'string' && /^\d{2}:\d{2}$/.test(time)) {
        return time;
      }
      
      const d = new Date(time);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  // Форматирование даты и времени
  const formatDateTime = (date) => {
    if (!date) return '—';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '—';
      return `${formatDate(d)} ${formatTime(d)}`;
    } catch {
      return '—';
    }
  };

  // Форматирование часов в часы:минуты
  const formatHours = (hours) => {
    if (!hours || hours === 0) return '0 ч';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m} мин`;
    if (m === 0) return `${h} ч`;
    return `${h} ч ${m} мин`;
  };

  // ============================================
  // ✅ ДЛЯ <input type="datetime-local">
  // ============================================

  /**
   * Текущая дата+время в формате "YYYY-MM-DDTHH:MM" (локальное).
   * Используется при создании новых записей.
   */
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  };

  /**
   * Конвертирует дату из любого формата в "YYYY-MM-DDTHH:MM" (локальное)
   * для использования в <input type="datetime-local">.
   *
   * - Если дата в UTC (с 'Z' или смещением '+03:00') — переводит в локальное.
   * - Если строка без 'Z' — считает её уже локальной.
   * - Если пусто/невалидно — возвращает текущее время.
   */
  const toDateTimeLocal = (dateValue) => {
    if (!dateValue) return getCurrentDateTimeLocal();

    try {
      let date;

      if (typeof dateValue === 'string') {
        if (dateValue.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateValue)) {
          date = new Date(dateValue);
        } else {
          date = new Date(
            dateValue.length === 16 ? dateValue + ':00' : dateValue
          );
        }
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        date = new Date(dateValue);
      }

      if (isNaN(date.getTime())) {
        return getCurrentDateTimeLocal();
      }

      const offset = date.getTimezoneOffset();
      const local = new Date(date.getTime() - offset * 60 * 1000);
      return local.toISOString().slice(0, 16);
    } catch (e) {
      return getCurrentDateTimeLocal();
    }
  };

  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatHours,
    getCurrentDateTimeLocal,
    toDateTimeLocal
  };
}