<template>
  <div class="equipment-grid">
    <div v-for="i in 6" :key="i" class="equipment-card skeleton-card">
      <!-- Фото -->
      <div class="card-photo skeleton"></div>

      <!-- Тело -->
      <div class="card-body">
        <div class="skeleton skeleton-line w-60"></div>
        <div class="skeleton skeleton-line w-40"></div>

        <div class="tags-row">
          <div class="skeleton skeleton-tag"></div>
          <div class="skeleton skeleton-tag"></div>
        </div>

        <div class="badges-row">
          <div class="skeleton skeleton-pill"></div>
          <div class="skeleton skeleton-pill"></div>
        </div>

        <div class="actions-row">
          <div class="skeleton skeleton-btn"></div>
          <div class="skeleton skeleton-btn"></div>
          <div class="skeleton skeleton-btn"></div>
          <div class="skeleton skeleton-btn"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Количество карточек зафиксировано — 6 (совпадает с pageSize модуля оборудования)
</script>

<style scoped>
.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  min-height: 300px;
}

.skeleton-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  pointer-events: none;
}

/* ============================================
   ФОТО
   ============================================ */
.card-photo {
  width: 100%;
  height: 180px;
  border-radius: 0;
}

/* ============================================
   ТЕЛО КАРТОЧКИ
   ============================================ */
.card-body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.badges-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.actions-row {
  display: flex;
  gap: 6px;
  margin-top: 4px;
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

.skeleton-line {
  height: 12px;
}

.skeleton-tag {
  height: 16px;
  width: 48px;
  border-radius: 10px;
}

.skeleton-pill {
  height: 18px;
  width: 80px;
  border-radius: 12px;
}

.skeleton-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
}

.w-40 { width: 40%; }
.w-60 { width: 60%; }
</style>