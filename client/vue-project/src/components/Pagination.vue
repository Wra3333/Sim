<script setup>
defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['update:currentPage']);
</script>

<template>
  <div class="pagination" v-if="totalPages > 1">
    <button 
      class="btn btn-secondary" 
      @click="emit('update:currentPage', currentPage - 1)" 
      :disabled="currentPage === 1 || loading"
    >
      Назад
    </button>
    
    <span class="page-info">
      Страница {{ currentPage }} из {{ totalPages }}
    </span>


    <button 
      class="btn btn-secondary" 
      @click="emit('update:currentPage', currentPage + 1)" 
      :disabled="currentPage === totalPages || loading"
    >
      Вперед
    </button>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 16px 0;
  border-top: 1px solid #e9ecef;
}

.page-info {
  font-size: 14px;
  color: #6c757d;
}

.items-count {
  font-size: 13px;
  color: #adb5bd;
}

.btn {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background: #5c636a;
  border-color: #565e64;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>