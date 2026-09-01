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
      // ✅ Если это уже строка времени HH:MM:SS
      if (typeof time === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(time)) {
        return time.slice(0, 5); // HH:MM
      }
      
      // ✅ Если это строка времени HH:MM
      if (typeof time === 'string' && /^\d{2}:\d{2}$/.test(time)) {
        return time;
      }
      
      // ✅ Если это полная дата или timestamp
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

  // Возвращаем функции
  return {
    formatDate,
    formatTime,
    formatDateTime,
    formatHours
  };
}