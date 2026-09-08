<template>
  <div class="equipment-grid">
    <EquipmentCard
      v-for="item in items"
      :key="item.id"
      :equipment="item"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
      @deletePermanent="$emit('deletePermanent', $event)"
      @history="$emit('history', $event)"
      @restore="$emit('restore', $event)"
      @photo-click="$emit('photoClick', $event)"
      @deleteFile="$emit('deleteFile', $event)"
    />
  </div>
</template>

<script setup>
import EquipmentCard from './EquipmentCard.vue';

defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  }
});

defineEmits([
  'edit', 'delete', 'deletePermanent', 
  'history', 'restore', 'photoClick',
  'deleteFile'
]);
</script>

<style scoped>
.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
</style>