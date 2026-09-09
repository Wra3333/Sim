<template>
  <div class="tag-manager">
    <!-- Поле ввода с подсказками -->
    <div class="tag-input-wrapper">
      <div class="input-with-suggestions">
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          class="form-control"
          :placeholder="placeholder"
          @input="onInput"
          @focus="showSuggestions = true"
          @blur="closeSuggestions"
          @keydown.enter.prevent="addTag"
          @keydown.down.prevent="selectNextSuggestion"
          @keydown.up.prevent="selectPrevSuggestion"
        />
        
        <!-- Выпадающий список подсказок -->
        <div v-if="showSuggestions && filteredSuggestions.length > 0" class="suggestions-dropdown">
          <div
            v-for="(suggestion, index) in filteredSuggestions"
            :key="suggestion"
            class="suggestion-item"
            :class="{ active: selectedSuggestionIndex === index }"
            @mousedown.prevent="applySuggestion(suggestion)"
            @mouseenter="selectedSuggestionIndex = index"
          >
            <span class="suggestion-text">#{{ suggestion }}</span>
            <span class="suggestion-count" v-if="getTagUsageCount(suggestion)">
              ({{ getTagUsageCount(suggestion) }})
            </span>
          </div>
        </div>
      </div>
      
      <button class="btn btn-sm btn-primary" @click="addTag" :disabled="!searchQuery.trim()">
        Добавить
      </button>
    </div>
    
    <!-- Список тегов -->
    <div class="tags-container">
      <span
        v-for="tag in localTags"
        :key="tag"
        class="tag-item"
      >
        #{{ tag }}
        <button class="tag-remove" @click="removeTag(tag)">×</button>
      </span>
      <span v-if="!localTags || localTags.length === 0" class="no-tags">
        Теги не добавлены
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  allTags: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Введите тег и нажмите Enter...'
  }
});

const emit = defineEmits(['update:modelValue', 'tags-change']);

// ============================================
// СОСТОЯНИЕ
// ============================================
const localTags = ref([...props.modelValue]);
const searchQuery = ref('');
const showSuggestions = ref(false);
const selectedSuggestionIndex = ref(-1);
const inputRef = ref(null);
let closeTimeout = null;

// ============================================
// ВЫЧИСЛЯЕМЫЕ
// ============================================

// Фильтрованные подсказки (исключаем уже добавленные)
const filteredSuggestions = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return props.allTags.slice(0, 10);
  
  return props.allTags
    .filter(tag => 
      tag.toLowerCase().includes(query) && 
      !localTags.value.includes(tag)
    )
    .slice(0, 10);
});

// ============================================
// МЕТОДЫ
// ============================================

// Получить количество использований тега
const getTagUsageCount = (tag) => {
  // Если у вас есть данные о использовании тегов
  // можно передать через пропс или вычислять
  return null;
};

// Добавление тега
const addTag = () => {
  const tag = searchQuery.value.trim();
  if (tag && !localTags.value.includes(tag)) {
    localTags.value.push(tag);
    searchQuery.value = '';
    selectedSuggestionIndex.value = -1;
    showSuggestions.value = false;
    emitUpdate();
  }
};

// Удаление тега
const removeTag = (tag) => {
  localTags.value = localTags.value.filter(t => t !== tag);
  emitUpdate();
};

// Применение подсказки
const applySuggestion = (suggestion) => {
  if (!localTags.value.includes(suggestion)) {
    localTags.value.push(suggestion);
    searchQuery.value = '';
    selectedSuggestionIndex.value = -1;
    showSuggestions.value = false;
    emitUpdate();
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
};

// Навигация по подсказкам
const selectNextSuggestion = () => {
  if (filteredSuggestions.value.length === 0) return;
  selectedSuggestionIndex.value = 
    (selectedSuggestionIndex.value + 1) % filteredSuggestions.value.length;
};

const selectPrevSuggestion = () => {
  if (filteredSuggestions.value.length === 0) return;
  selectedSuggestionIndex.value = 
    selectedSuggestionIndex.value <= 0 
      ? filteredSuggestions.value.length - 1 
      : selectedSuggestionIndex.value - 1;
};

// Отправка изменений
const emitUpdate = () => {
  emit('update:modelValue', localTags.value);
  emit('tags-change', localTags.value);
};

// Обработка ввода
const onInput = () => {
  showSuggestions.value = true;
  selectedSuggestionIndex.value = -1;
};

// Закрытие подсказок
const closeSuggestions = () => {
  closeTimeout = setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};

// ============================================
// WATCH
// ============================================
watch(() => props.modelValue, (val) => {
  localTags.value = [...(val || [])];
}, { deep: true });
</script>

<style scoped>
.tag-manager {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ============================================
   ВВОД С ПОДСКАЗКАМИ
   ============================================ */
.tag-input-wrapper {
  display: flex;
  gap: 8px;
}

.input-with-suggestions {
  flex: 1;
  position: relative;
}

.input-with-suggestions .form-control {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.input-with-suggestions .form-control:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* ============================================
   ВЫПАДАЮЩИЙ СПИСОК ПОДСКАЗОК
   ============================================ */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ced4da;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 2px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.suggestion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: #e7f1ff;
}

.suggestion-text {
  font-size: 13px;
  color: #1a73e8;
}

.suggestion-count {
  font-size: 11px;
  color: #6c757d;
  background: #f1f3f5;
  padding: 0 8px;
  border-radius: 10px;
}

/* ============================================
   КНОПКА
   ============================================ */
.tag-input-wrapper .btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background: #0d6efd;
  color: white;
  white-space: nowrap;
}

.tag-input-wrapper .btn:hover:not(:disabled) {
  background: #0b5ed7;
}

.tag-input-wrapper .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 13px;
}

/* ============================================
   ТЕГИ
   ============================================ */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 28px;
  padding: 4px 0;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #e8f0fe;
  color: #1a73e8;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 13px;
}

.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #1a73e8;
  padding: 0 2px;
  line-height: 1;
  border-radius: 50%;
  transition: all 0.15s;
}

.tag-remove:hover {
  color: #d32f2f;
  background: rgba(211, 47, 47, 0.1);
}

.no-tags {
  color: #999;
  font-size: 13px;
  padding: 2px 0;
}

.text-muted {
  font-size: 12px;
  color: #6c757d;
  margin-top: 2px;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 480px) {
  .tag-input-wrapper {
    flex-direction: column;
  }
  
  .tag-input-wrapper .btn {
    width: 100%;
  }
}
</style>