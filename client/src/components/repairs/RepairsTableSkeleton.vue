<template>
  <div class="table-container skeleton-wrapper">
    <table class="repairs-table">
      <thead>
        <tr>
          <th style="width: 120px;">Дата</th>
          <th style="min-width: 220px;">Оборудование</th>
          <th style="min-width: 280px;">Описание</th>
          <th style="min-width: 140px;">Кто выявил</th>
          <th style="min-width: 220px;">Возможность устранения</th>
          <th style="width: 140px;">Статус</th>
          <th style="min-width: 140px;">Кто устранил</th>
          <th style="width: 170px;">Действия</th>
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
</template>

<script setup>
// 8 строк — совпадает с pageSize модуля ремонтов
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

.repairs-table {
  width: 100%;
  min-width: 1300px;
  border-collapse: collapse;
  font-size: 14px;
}

.repairs-table thead {
  background: #f8f9fa;
}

.repairs-table th {
  padding: 14px 18px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.repairs-table td {
  padding: 14px 18px;
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

.skeleton-pill {
  height: 20px;
  width: 130px;
  border-radius: 12px;
}

.skeleton-btn {
  width: 26px;
  height: 26px;
  border-radius: 5px;
}

.w-50 { width: 50%; }
.w-60 { width: 60%; }
.w-70 { width: 70%; }
.w-80 { width: 80%; }
.w-90 { width: 90%; }

/* ============================================
   ДЕЙСТВИЯ
   ============================================ */
.table-actions {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
  justify-content: flex-end;
}
</style>