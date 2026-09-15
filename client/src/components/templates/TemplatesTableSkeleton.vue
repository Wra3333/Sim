<template>
  <div class="table-container skeleton-wrapper">
    <table class="templates-table">
      <thead>
        <tr>
          <th style="width: 110px;">Дата создания</th>
          <th style="min-width: 150px;">Название</th>
          <th style="min-width: 120px;">Дисциплина</th>
          <th style="min-width: 150px;">Оборудование</th>
          <th style="width: 100px;">Статус</th>
          <th style="width: 130px;">Действия</th>
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
</template>

<script setup>
// 7 строк — совпадает с pageSize модуля шаблонов
</script>

<style scoped>
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e9ecef;
  overflow-x: auto;
}

.skeleton-wrapper {
  pointer-events: none;
}

.templates-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.templates-table thead {
  background: #f8f9fa;
}

.templates-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.templates-table td {
  padding: 10px 16px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

/* ============================================
   SHIMMER
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

.skeleton-line {
  height: 12px;
}

.skeleton-mt {
  margin-top: 6px;
}

.skeleton-tag {
  height: 16px;
  width: 60px;
  border-radius: 10px;
}

.skeleton-pill {
  height: 20px;
  width: 80px;
  border-radius: 12px;
}

.skeleton-btn {
  width: 28px;
  height: 28px;
  border-radius: 5px;
}

.w-50 { width: 50%; }
.w-60 { width: 60%; }
.w-70 { width: 70%; }
.w-80 { width: 80%; }

/* ============================================
   ОБОРУДОВАНИЕ / ДЕЙСТВИЯ
   ============================================ */
.equipment-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.table-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  flex-wrap: nowrap;
}
</style>