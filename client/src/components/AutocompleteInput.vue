<template>
  <div class="autocomplete-input">
    <input
      ref="inputRef"
      type="text"
      class="form-control"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :list="listId"
      @input="onInput"
    />
    <datalist :id="listId">
      <option v-for="item in options" :key="item" :value="item" />
    </datalist>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options:    { type: Array, default: () => [] },
  placeholder:{ type: String, default: '' },
  disabled:   { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const inputRef = ref(null);

const listId = computed(() =>
  'datalist-' + Math.random().toString(36).slice(2, 10)
);

const onInput = (e) => {
  emit('update:modelValue', e.target.value);
};

defineExpose({
  focus: () => inputRef.value?.focus()
});
</script>

<style scoped>
.autocomplete-input {
  width: 100%;
}
</style>