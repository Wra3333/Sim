// src/utils/tabSync.js
// Универсальный модуль для broadcast-сообщений между вкладками.
// Работает и в store (вне setup), и в composable.

let channel = null;
const listeners = new Set();

const isSupported = typeof BroadcastChannel !== 'undefined';

export const tabSync = {
  /**
   * Инициализация канала. Идемпотентна — повторный вызов ничего не делает.
   */
  init() {
    if (!isSupported) {
      console.warn('⚠️ [tabSync] BroadcastChannel не поддерживается');
      return;
    }
    if (channel) return;

    channel = new BroadcastChannel('app-sync');
    channel.onmessage = (event) => {
      const msg = event.data;
      if (!msg || !msg.type) return;
      // Пробрасываем всем подписчикам
      listeners.forEach((fn) => {
        try {
          fn(msg);
        } catch (e) {
          console.error('[tabSync] listener error:', e);
        }
      });
    };
    console.log('✅ [tabSync] BroadcastChannel инициализирован');
  },

  /**
   * Отправить событие всем другим вкладкам.
   * Не приходит в текущую вкладку (это особенность BroadcastChannel).
   */
  broadcast(type, payload = {}) {
    if (!isSupported) return;
    if (!channel) this.init();
    if (!channel) return;
    try {
      channel.postMessage({ type, payload, ts: Date.now() });
      // console.log('📤 [tabSync] broadcast:', type, payload);
    } catch (e) {
      console.warn('[tabSync] broadcast failed:', e);
    }
  },

  /**
   * Подписка на события из других вкладок.
   * Возвращает функцию отписки.
   */
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /**
   * Закрыть канал (при размонтировании приложения).
   */
  close() {
    if (channel) {
      channel.close();
      channel = null;
    }
    listeners.clear();
  },
};