<template>
  <!-- DESKTOP -->
  <div v-if="!isMobile" class="table-container skeleton-wrapper">
    <table class="repairs-table">
      <thead>
        <tr>
          <th class="col-date">Дата</th>
          <th class="col-equipment">Оборудование</th>
          <th class="col-description">Описание</th>
          <th class="col-detected-by">Кто выявил</th>
          <th class="col-possibility">Возможность устранения</th>
          <th class="col-status">Статус</th>
          <th class="col-resolved-by">Кто устранил</th>
          <th class="col-actions">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="i in 8" :key="i">
          <td><div class="skeleton skeleton-line w-70"></div></td>
          <td>
            <div class="skeleton skeleton-line w-80"></div>
            <div class="skeleton skeleton-line w-50 skeleton-mt"></div>
          </td>
          <td>
            <div class="skeleton skeleton-line w-90"></div>
            <div class="skeleton skeleton-line w-60 skeleton-mt"></div>
          </td>
          <td><div class="skeleton skeleton-line w-60"></div></td>
          <td><div class="skeleton skeleton-pill"></div></td>
          <td><div class="skeleton skeleton-pill"></div></td>
          <td><div class="skeleton skeleton-line w-60"></div></td>
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
  <div v-else class="repairs-cards skeleton-wrapper">
    <div v-for="i in 5" :key="i" class="repair-skeleton-card skeleton-card">
      <div class="card-header">
        <div class="skeleton skeleton-line w-60"></div>
        <div class="skeleton skeleton-pill"></div>
      </div>

      <div class="card-row">
        <div class="skeleton skeleton-line w-40"></div>
        <div class="skeleton skeleton-line w-30"></div>
      </div>

      <div class="card-row">
        <div class="skeleton skeleton-line w-40"></div>
        <div class="skeleton skeleton-line w-40"></div>
      </div>

      <div class="description-skeleton">
        <div class="skeleton skeleton-line w-90"></div>
        <div class="skeleton skeleton-line w-70 skeleton-mt"></div>
      </div>

      <div class="card-actions">
        <div class="skeleton skeleton-btn"></div>
        <div class="skeleton skeleton-btn"></div>
        <div class="skeleton skeleton-btn"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

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
.table-container {
  background: white; border-radius: 12px; overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
}

.skeleton-wrapper { pointer-events: none; }

.repairs-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 14px;
}
.repairs-table thead { background: #f8f9fa; }
.repairs-table th {
  padding: 14px 18px; text-align: left; font-weight: 600;
  color: #495057; border-bottom: 2px solid #dee2e6;
}
.repairs-table td {
  padding: 14px 18px; border-bottom: 1px solid #e9ecef; vertical-align: middle;
}

/* Ширины как в реальной RepairsView */
.col-date        { width: 9%; }
.col-equipment   { width: 16%; }
.col-description { width: 21%; }
.col-detected-by { width: 11%; }
.col-possibility { width: 16%; }
.col-status      { width: 10%; }
.col-resolved-by { width: 11%; }
.col-actions     { width: 100px; }

/* MOBILE CARD */
.repairs-cards { display: flex; flex-direction: column; }

.repair-skeleton-card {
  background: #fff; border: 1px solid #e9ecef; border-radius: 12px;
  padding: 14px; margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.repair-skeleton-card .card-header {
  display: flex; justify-content: space-between; align-items: center;
  gap: 8px; margin-bottom: 12px;
}

.repair-skeleton-card .card-row {
  display: flex; justify-content: space-between;
  align-items: center; padding: 5px 0; gap: 12px;
}

.description-skeleton {
  padding: 10px 12px; margin: 8px 0;
  background: #f8f9fa; border-radius: 6px;
}

.repair-skeleton-card .card-actions {
  display: flex; gap: 6px;
  margin-top: 10px; padding-top: 10px;
  border-top: 1px solid #f1f3f5; flex-wrap: wrap;
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

.skeleton-line { height: 12px; }
.skeleton-mt { margin-top: 6px; }
.skeleton-pill { height: 20px; width: 130px; border-radius: 12px; }
.skeleton-btn { width: 26px; height: 26px; border-radius: 5px; }

.w-30 { width: 30%; }
.w-40 { width: 40%; }
.w-50 { width: 50%; }
.w-60 { width: 60%; }
.w-70 { width: 70%; }
.w-80 { width: 80%; }
.w-90 { width: 90%; }

.table-actions {
  display: flex; gap: 4px; flex-wrap: nowrap; justify-content: flex-end;
}

/* Плавное сжатие (синхрон с RepairsView) */
@media (max-width: 1600px) {
  .repairs-table th, .repairs-table td { padding: 10px 10px; font-size: 13.5px; }
}
@media (max-width: 1500px) {
  .repairs-table th, .repairs-table td { padding: 9px 8px; font-size: 13px; }
}
@media (max-width: 1400px) {
  .repairs-table th, .repairs-table td { padding: 8px 7px; font-size: 12.5px; }
}

@media (max-width: 1275px) {
  .repair-skeleton-card .skeleton-pill { width: 90px; }
  .repair-skeleton-card .card-actions .skeleton-btn {
    width: 36px; height: 36px; border-radius: 8px;
  }
}
</style>