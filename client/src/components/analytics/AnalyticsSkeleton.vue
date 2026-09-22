<template>
  <div class="analytics-skeleton">
    <!-- СТАТИСТИКА -->
    <div class="stats-grid" :class="{ 'is-mobile': isMobile }">
      <div v-for="i in 4" :key="`stat-${i}`" class="stat-card skeleton-card">
        <div class="skeleton skeleton-icon"></div>
        <div class="stat-info">
          <div class="skeleton skeleton-line w-60"></div>
          <div class="skeleton skeleton-line w-40 skeleton-mt"></div>
        </div>
      </div>
    </div>

    <!-- СПИСОК ОБОРУДОВАНИЯ -->
    <div class="equipment-accordion">
      <div v-for="i in 5" :key="`eq-${i}`" class="equipment-group skeleton-group">
        <div class="equipment-header">
          <div class="equipment-info">
            <div class="equipment-main">
              <div class="skeleton skeleton-line w-10"></div>
              <div class="skeleton skeleton-line w-40"></div>
              <div class="skeleton skeleton-pill"></div>
            </div>
            <div class="equipment-meta">
              <div class="skeleton skeleton-line w-20"></div>
              <div class="skeleton skeleton-line w-15"></div>
              <div class="skeleton skeleton-line w-20"></div>
              <div class="skeleton skeleton-line w-15"></div>
            </div>
          </div>
          <div class="skeleton skeleton-chevron"></div>
        </div>
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
.analytics-skeleton {
  display: flex; flex-direction: column; gap: 0;
}

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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white; padding: 16px 20px; border-radius: 12px;
  display: flex; align-items: center; gap: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.skeleton-card { pointer-events: none; }

.skeleton-icon {
  width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
}

.stat-info { display: flex; flex-direction: column; gap: 6px; flex: 1; }

.equipment-accordion {
  display: flex; flex-direction: column; gap: 8px;
}

.equipment-group {
  background: white; border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.skeleton-group { pointer-events: none; }

.equipment-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px;
}

.equipment-info { flex: 1; min-width: 0; }

.equipment-main {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}

.equipment-meta {
  display: flex; gap: 16px; margin-top: 8px; flex-wrap: wrap;
}

.skeleton-chevron {
  width: 20px; height: 20px; border-radius: 50%;
  flex-shrink: 0; margin-left: 12px;
}

.skeleton-line { height: 12px; }
.skeleton-mt { margin-top: 0; }
.skeleton-pill { height: 18px; width: 80px; border-radius: 10px; }

.w-10 { width: 40px; }
.w-15 { width: 70px; }
.w-20 { width: 110px; }
.w-40 { width: 200px; }
.w-60 { width: 60%; }

/* АДАПТИВ */
@media (max-width: 1600px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 1275px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 16px;
  }

  .stat-card {
    padding: 12px 14px; gap: 10px; border-radius: 10px;
  }

  .skeleton-icon { width: 36px; height: 36px; }

  .equipment-header {
    padding: 14px 16px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .equipment-main { gap: 8px; }

  .equipment-meta {
    flex-direction: column; gap: 6px; margin-top: 10px;
  }

  .equipment-meta .skeleton-line {
    width: 100% !important;
    max-width: 180px;
  }

  .skeleton-chevron { margin-left: auto; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
  .stat-card { padding: 10px 12px; }
  .equipment-header { padding: 12px 14px; }
  .skeleton-pill { width: 70px; }
}
</style>