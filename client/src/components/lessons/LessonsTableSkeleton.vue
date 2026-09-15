<template>
  <div class="table-container skeleton-wrapper">
    <table class="lessons-table">
      <thead>
        <tr>
          <th style="width: 110px;">Дата создания</th>
          <th style="min-width: 180px;">Образование</th>
          <th style="min-width: 150px;">Название</th>
          <th style="min-width: 130px;">Группа</th>
          <th style="min-width: 120px;">Преподаватель</th>
          <th style="width: 160px;">Когда</th>
          <th style="width: 90px;">Студентов</th>
          <th style="width: 140px;">Статус</th>
          <th style="width: 160px;">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="i in 7" :key="i">
          <td><div class="skeleton skeleton-line w-70"></div></td>
          <td>
            <div class="skeleton skeleton-line w-60"></div>
            <div class="skeleton skeleton-line w-40 skeleton-mt"></div>
            <div class="skeleton skeleton-line w-30 skeleton-mt"></div>
          </td>
          <td>
            <div class="skeleton skeleton-line w-90"></div>
            <div class="skeleton skeleton-line w-60 skeleton-mt"></div>
          </td>
          <td><div class="skeleton skeleton-line w-50"></div></td>
          <td><div class="skeleton skeleton-line w-70"></div></td>
          <td>
            <div class="skeleton skeleton-line w-70"></div>
            <div class="skeleton skeleton-line w-50 skeleton-mt"></div>
          </td>
          <td><div class="skeleton skeleton-line w-30 skeleton-center"></div></td>
          <td><div class="skeleton skeleton-pill"></div></td>
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
// 7 строк — совпадает с pageSize модуля занятий
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

.lessons-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.lessons-table thead {
  background: #f8f9fa;
}

.lessons-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.lessons-table td {
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

.skeleton-pill {
  height: 20px;
  width: 90px;
  border-radius: 12px;
}

.skeleton-btn {
  width: 28px;
  height: 28px;
  border-radius: 5px;
}

.w-30 { width: 30%; }
.w-40 { width: 40%; }
.w-50 { width: 50%; }
.w-60 { width: 60%; }
.w-70 { width: 70%; }
.w-90 { width: 90%; }

.skeleton-center {
  margin: 0 auto;
}

/* ============================================
   ДЕЙСТВИЯ
   ============================================ */
.table-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  flex-wrap: nowrap;
}
</style>