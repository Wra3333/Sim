// composables/useConfirm.js
import { ref } from 'vue';

export function useConfirm() {
  const show = ref(false);
  const config = ref({
    title: 'Подтверждение',
    message: 'Вы уверены?',
    confirmText: 'Да',
    cancelText: 'Отмена'
  });
  let resolvePromise = null;

  const confirm = (options = {}) => {
    config.value = { ...config.value, ...options };
    show.value = true;
    
    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  };

  const onConfirm = () => {
    show.value = false;
    if (resolvePromise) {
      resolvePromise(true);
      resolvePromise = null;
    }
  };

  const onCancel = () => {
    show.value = false;
    if (resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;
    }
  };

  return {
    show,
    config,
    confirm,
    onConfirm,
    onCancel
  };
}