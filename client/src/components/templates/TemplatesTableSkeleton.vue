<template>
  <!-- DESKTOP: таблица -->
  <div v-if="!isMobile" class="table-container skeleton-wrapper">
    <table class="templates-table">
      <thead>
        <tr>
          <th class="col-date">Дата создания</th>
          <th class="col-title">Название</th>
          <th class="col-discipline">Дисциплина</th>
          <th class="col-equipment">Оборудование</th>
          <th class="col-status">Статус</th>
          <th class="col-actions">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="i in 7" :key="i">
          <td><div class="skeleton skeleton-line w-70"></div></td>
          <td>
            <div class="skeleton skeleton-line w-80"></div>
            <div class="skeleton skeleton-line w-50 skeleton-mt"></div>
          </td>
          <td><div class="skeleton skeleton-line w-60"></div></td>
          <td>
            <div class="equipment-preview">
              <div class="skeleton skeleton-tag"></div>
              <div class="skeleton skeleton-tag"></div>
            </div>
          </td>
          <td><div class="skeleton skeleton-pill"></div></td>
          <td>
            <div class="table-actions">
              <div class="skeleton skeleton-btn"></div>
              <div class="skeleton skeleton-btn"></div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- MOBILE: карточки -->
  <div v-else class="templates-cards skeleton-wrapper">
    <div v-for="i in 5" :key="i" class="template-skeleton-card skeleton-card">
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
        <div class="skeleton skeleton-line w-30"></div>
      </div>

      <div class="tags-row">
        <div class="skeleton skeleton-tag"></div>
        <div class="skeleton skeleton-tag"></div>
        <div class="skeleton skeleton-tag"></div>
      </div>

      <div class="card-actions">
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
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
}

.skeleton-wrapper { pointer-events: none; }

.templates-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 14px;
}
.templates-table thead { background: #f8f9fa; }
.templates-table th {
  padding: 12px 16px; text-align: left; font-weight: 600;
  color: #495057; border-bottom: 2px solid #dee2e6;
}
.templates-table td {
  padding: 10px 16px; border-bottom: 1px solid #e9ecef; vertical-align: middle;
}

/* Ширины как в реальной TemplatesView */
.col-date       { width: 12%; }
.col-title      { width: 24%; }
.col-discipline { width: 15%; }
.col-equipment  { width: 22%; }
.col-status     { width: 12%; }
.col-actions    { width: 15%; }

/* MOBILE CARD */
.templates-cards { display: flex; flex-direction: column; }

.template-skeleton-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.template-skeleton-card .card-header {
  display: flex; justify-content: space-between; align-items: center;
  gap: 8px; margin-bottom: 12px;
}

.template-skeleton-card .card-row {
  display: flex; justify-content: space-between;
  align-items: center; padding: 5px 0; gap: 12px;
}

.template-skeleton-card .tags-row {
  display: flex; gap: 4px; flex-wrap: wrap;
  margin-top: 10px; padding-top: 10px;
  border-top: 1px solid #f1f3f5;
}

.template-skeleton-card .card-actions {
  display: flex; gap: 6px;
  margin-top: 10px; padding-top: 10px;
  border-top: 1px solid #f1f3f5;
  justify-content: flex-end;
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
.skeleton-tag { height: 16px; width: 60px; border-radius: 10px; }
.skeleton-pill { height: 20px; width: 80px; border-radius: 12px; }
.skeleton-btn { width: 28px; height: 28px; border-radius: 5px; }

.w-30 { width: 30%; }
.w-40 { width: 40%; }
.w-50 { width: 50%; }
.w-60 { width: 60%; }
.w-70 { width: 70%; }
.w-80 { width: 80%; }

.equipment-preview { display: flex; flex-wrap: wrap; gap: 4px; }

.table-actions {
  display: flex; gap: 4px; justify-content: flex-end; flex-wrap: nowrap;
}

/* Плавное сжатие (синхрон с TemplatesView) */
@media (max-width: 1600px) {
  .templates-table th, .templates-table td { padding: 10px 12px; font-size: 13.5px; }
}
@media (max-width: 1500px) {
  .templates-table th, .templates-table td { padding: 9px 10px; font-size: 13px; }
}
@media (max-width: 1400px) {
  .templates-table th, .templates-table td { padding: 8px 8px; font-size: 12.5px; }
}

@media (max-width: 1275px) {
  .template-skeleton-card .card-actions .skeleton-btn {
    width: 40px; height: 40px; border-radius: 8px;
  }
}
</style>