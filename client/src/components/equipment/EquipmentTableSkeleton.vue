<template>
  <div class="equipment-table-wrapper skeleton-wrapper">
    <table class="equipment-table">
      <thead>
        <tr>
          <th>Фото</th>
          <th>Инв. номер</th>
          <th>Наименование</th>
          <th>Название</th>
          <th>Теги</th>
          <th>Статус</th>
          <th>Списание</th>
          <th>Год</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="i in rows" :key="i">
          <td>
            <div class="photo-cell skeleton"></div>
          </td>
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
</template>

<script setup>
defineProps({
  rows: { type: Number, default: 6 }
});
</script>

<style scoped>
.equipment-table-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
  overflow-x: auto;
}

.skeleton-wrapper {
  pointer-events: none;
}

.equipment-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.equipment-table thead {
  background: #f8f9fa;
}

.equipment-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.equipment-table td {
  padding: 10px 16px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

/* ============================================
   ОБЩИЙ SHIMMER
   ============================================ */
.skeleton {
  background: linear-gradient(
    90deg,
    #eef1f4 0%,
    #f6f8fa 50%,
    #eef1f4 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ============================================
   ФОТО
   ============================================ */
.photo-cell {
  width: 50px;
  height: 50px;
  border-radius: 6px;
}

/* ============================================
   ПЛАШКИ
   ============================================ */
.skeleton-line {
  height: 12px;
}

.skeleton-pill {
  height: 18px;
  width: 80px;
  border-radius: 12px;
}

.skeleton-tag {
  height: 16px;
  width: 48px;
  border-radius: 10px;
}

.skeleton-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
}

.w-40 { width: 40px; }
.w-60 { width: 60%; }
.w-80 { width: 80%; }
.w-90 { width: 90%; }

/* ============================================
   ЯЧЕЙКИ
   ============================================ */
.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.table-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
</style>