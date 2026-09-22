<template>
  <!-- DESKTOP -->
  <div v-if="!isMobile" class="equipment-table-wrapper skeleton-wrapper">
    <table class="equipment-table">
      <thead>
        <tr>
          <th class="col-photo">Фото</th>
          <th class="col-inv">Инв. номер</th>
          <th class="col-inv-name">Наименование</th>
          <th class="col-name">Название</th>
          <th class="col-tags">Теги</th>
          <th class="col-status">Статус</th>
          <th class="col-writeoff">Списание</th>
          <th class="col-year">Год</th>
          <th class="col-actions">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="i in rows" :key="i">
          <td><div class="photo-cell skeleton"></div></td>
          <td><div class="skeleton skeleton-line w-60"></div></td>
          <td><div class="skeleton skeleton-line w-80"></div></td>
          <td><div class="skeleton skeleton-line w-90"></div></td>
          <td>
            <div class="tags-cell">
              <div class="skeleton skeleton-tag"></div>
              <div class="skeleton skeleton-tag"></div>
            </div>
          </td>
          <td><div class="skeleton skeleton-pill"></div></td>
          <td><div class="skeleton skeleton-pill"></div></td>
          <td><div class="skeleton skeleton-line w-40"></div></td>
          <td>
            <div class="table-actions">
              <div class="skeleton skeleton-btn"></div>
              <div class="skeleton skeleton-btn"></div>
              <div class="skeleton skeleton-btn"></div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- MOBILE -->
  <div v-else class="equipment-cards skeleton-wrapper">
    <div v-for="i in 5" :key="i" class="equipment-skeleton-card skeleton-card">
      <div class="photo-cell skeleton"></div>

      <div class="card-body">
        <div class="skeleton skeleton-line w-60"></div>
        <div class="skeleton skeleton-line w-40 skeleton-mt"></div>

        <div class="tags-row">
          <div class="skeleton skeleton-tag"></div>
          <div class="skeleton skeleton-tag"></div>
        </div>

        <div class="badges-row">
          <div class="skeleton skeleton-pill"></div>
          <div class="skeleton skeleton-pill"></div>
        </div>

        <div class="card-actions">
          <div class="skeleton skeleton-btn"></div>
          <div class="skeleton skeleton-btn"></div>
          <div class="skeleton skeleton-btn"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

defineProps({
  rows: { type: Number, default: 6 }
});

const isMobile = ref(false);
let mediaQuery = null;
const updateIsMobile = (e) => { isMobile.value = e.matches; };

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    mediaQuery = window.matchMedia('(max-width: 1275px)');
    isMobile.value = mediaQuery.matches;
    mediaQuery.addEventListener('change', updateIsMobile);
  }
});

onBeforeUnmount(() => {
  if (mediaQuery) mediaQuery.removeEventListener('change', updateIsMobile);
});
</script>

<style scoped>
.equipment-table-wrapper {
  background: white; border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
}

.skeleton-wrapper { pointer-events: none; }

.equipment-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 14px;
}
.equipment-table thead { background: #f8f9fa; }
.equipment-table th {
  padding: 12px 14px; text-align: left; font-weight: 600;
  color: #495057; border-bottom: 2px solid #dee2e6;
  word-break: normal; overflow-wrap: break-word;
}
.equipment-table td {
  padding: 10px 14px; border-bottom: 1px solid #e9ecef; vertical-align: middle;
}

/* Ширины колонок (примерные под EquipmentTableView) */
.col-photo    { width: 70px; }
.col-inv      { width: 11%; }
.col-inv-name { width: 16%; }
.col-name     { width: 18%; }
.col-tags     { width: 16%; }
.col-status   { width: 11%; }
.col-writeoff { width: 11%; }
.col-year     { width: 7%; }
.col-actions  { width: 100px; }

/* MOBILE */
.equipment-cards { display: flex; flex-direction: column; }

.equipment-skeleton-card {
  background: #fff; border: 1px solid #e9ecef; border-radius: 12px;
  overflow: hidden; margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.equipment-skeleton-card .photo-cell {
  width: 100%; height: 180px; border-radius: 0;
}

.equipment-skeleton-card .card-body {
  padding: 14px 16px 16px;
  display: flex; flex-direction: column; gap: 10px;
}

.equipment-skeleton-card .tags-row,
.equipment-skeleton-card .badges-row {
  display: flex; flex-wrap: wrap; gap: 4px;
}

.equipment-skeleton-card .card-actions {
  display: flex; gap: 6px; margin-top: 4px;
}

/* SHIMMER */
.skeleton {
  background: linear-gradient(90deg, #eef1f4 0%, #f6f8fa 50%, #eef1f4 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
  border-radius: 4px;
}
@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.photo-cell { width: 50px; height: 50px; border-radius: 6px; }

.skeleton-line { height: 12px; }
.skeleton-mt { margin-top: 6px; }
.skeleton-pill { height: 18px; width: 80px; border-radius: 12px; }
.skeleton-tag { height: 16px; width: 48px; border-radius: 10px; }
.skeleton-btn { width: 28px; height: 28px; border-radius: 4px; }

.w-40 { width: 40px; }
.w-60 { width: 60%; }
.w-80 { width: 80%; }
.w-90 { width: 90%; }

.tags-cell { display: flex; flex-wrap: wrap; gap: 4px; }

.table-actions { display: flex; gap: 4px; flex-wrap: wrap; }

/* Плавное сжатие */
@media (max-width: 1600px) {
  .equipment-table th, .equipment-table td { padding: 10px 12px; font-size: 13.5px; }
}
@media (max-width: 1500px) {
  .equipment-table th, .equipment-table td { padding: 9px 10px; font-size: 13px; }
}
@media (max-width: 1400px) {
  .equipment-table th, .equipment-table td { padding: 8px 8px; font-size: 12.5px; }
}

@media (max-width: 1275px) {
  .equipment-skeleton-card .card-actions .skeleton-btn {
    width: 40px; height: 40px; border-radius: 8px;
  }
}
</style>