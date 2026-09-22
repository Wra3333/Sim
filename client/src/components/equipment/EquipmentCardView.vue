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
  'history', 'restore', 'photoClick'
]);
</script>

<style scoped>
.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

@media (max-width: 1600px) {
  .equipment-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }
}

@media (max-width: 1400px) {
  .equipment-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 1275px) {
  .equipment-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .equipment-grid {
    gap: 10px;
  }
}
</style>