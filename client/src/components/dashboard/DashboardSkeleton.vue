<template>
  <div class="dashboard-skeleton">
    <!-- СТАТИСТИКА -->
    <div class="stats-grid">
      <div v-for="i in 4" :key="`stat-${i}`" class="stat-card skeleton-card">
        <div class="skeleton skeleton-icon"></div>
        <div class="stat-info">
          <div class="skeleton skeleton-line w-40"></div>
          <div class="skeleton skeleton-line w-60 skeleton-mt"></div>
          <div class="skeleton skeleton-line w-80 skeleton-mt"></div>
        </div>
        <div class="skeleton skeleton-arrow"></div>
      </div>
    </div>

    <!-- ДВЕ КОЛОНКИ -->
    <div class="two-columns">
      <!-- ЛЕВАЯ: ЗАЯВКИ -->
      <div class="column">
        <div class="recent skeleton-card">
          <div class="section-header">
            <div class="skeleton skeleton-line w-40"></div>
            <div class="skeleton skeleton-line w-20"></div>
          </div>
          <div class="recent-list">
            <div v-for="i in 5" :key="`rep-${i}`" class="recent-item">
              <div class="skeleton skeleton-badge"></div>
              <div class="item-content">
                <div class="skeleton skeleton-line w-70"></div>
                <div class="skeleton skeleton-line w-50 skeleton-mt"></div>
                <div class="skeleton skeleton-line w-40 skeleton-mt"></div>
              </div>
              <div class="skeleton skeleton-line w-15"></div>
            </div>
          </div>
        </div>

        <div class="recent skeleton-card" style="margin-top: 16px;">
          <div class="section-header">
            <div class="skeleton skeleton-line w-40"></div>
            <div class="skeleton skeleton-line w-20"></div>
          </div>
          <div class="recent-list">
            <div v-for="i in 5" :key="`res-${i}`" class="recent-item">
              <div class="skeleton skeleton-badge"></div>
              <div class="item-content">
                <div class="skeleton skeleton-line w-70"></div>
                <div class="skeleton skeleton-line w-50 skeleton-mt"></div>
                <div class="skeleton skeleton-line w-40 skeleton-mt"></div>
              </div>
              <div class="skeleton skeleton-line w-15"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ПРАВАЯ: ЗАНЯТИЯ -->
      <div class="column">
        <div class="recent skeleton-card">
          <div class="section-header">
            <div class="skeleton skeleton-line w-40"></div>
            <div class="skeleton skeleton-line w-20"></div>
          </div>
          <div class="recent-list">
            <div v-for="i in 5" :key="`les-${i}`" class="recent-item">
              <div class="skeleton skeleton-badge-wide"></div>
              <div class="item-content">
                <div class="skeleton skeleton-line w-70"></div>
                <div class="skeleton skeleton-line w-50 skeleton-mt"></div>
                <div class="skeleton skeleton-line w-60 skeleton-mt"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 4 карточки статистики + по 5 строк в каждом списке
</script>

<style scoped>
.dashboard-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0;
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

.skeleton-card {
  pointer-events: none;
}

.skeleton-line {
  height: 12px;
}

.skeleton-mt {
  margin-top: 6px;
}

.skeleton-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  flex-shrink: 0;
}

.skeleton-arrow {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  flex-shrink: 0;
  opacity: 0.5;
}

.skeleton-badge {
  width: 40px;
  height: 24px;
  border-radius: 12px;
  flex-shrink: 0;
}

.skeleton-badge-wide {
  width: 100px;
  height: 24px;
  border-radius: 12px;
  flex-shrink: 0;
}

.w-15 { width: 40px; }
.w-20 { width: 20%; }
.w-40 { width: 40%; }
.w-50 { width: 50%; }
.w-60 { width: 60%; }
.w-70 { width: 70%; }
.w-80 { width: 80%; }

/* ============================================
   СТАТИСТИКА
   ============================================ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e8ecf1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.stat-info {
  flex: 1;
  min-width: 0;
}

/* ============================================
   ДВЕ КОЛОНКИ
   ============================================ */
.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.column {
  display: flex;
  flex-direction: column;
}

/* ============================================
   КАРТОЧКИ
   ============================================ */
.recent {
  background: white;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid #e8ecf1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

/* ============================================
   СПИСКИ
   ============================================ */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  border-bottom: 1px solid #f0f2f5;
}

.recent-item:last-child {
  border-bottom: none;
}

.item-content {
  flex: 1;
  min-width: 0;
}

/* ============================================
   АДАПТИВ
   ============================================ */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .two-columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 14px 16px;
  }

  .recent {
    padding: 12px 14px;
  }
}
</style>