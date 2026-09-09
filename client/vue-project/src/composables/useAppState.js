import { watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../stores/appStore'

export function useAppState() {
  const route = useRoute()
  const router = useRouter()
  const store = useAppStore()
  
  let isUpdatingFromStore = false
  let isUpdatingFromUrl = false

  // ============================================
  // КОНФИГУРАЦИЯ ПОЛЕЙ ДЛЯ СИНХРОНИЗАЦИИ
  // ============================================
  const syncConfig = {
    // ОБОРУДОВАНИЕ
    q: { get: () => store.filters.equipment.search, set: (v) => store.filters.equipment.search = v || '' },
    s: { get: () => store.filters.equipment.working_status, set: (v) => store.filters.equipment.working_status = v || '' },
    w: { get: () => store.filters.equipment.write_off_status, set: (v) => store.filters.equipment.write_off_status = v || '' },
    p: { get: () => store.pagination.equipment.page || 1, set: (v) => store.pagination.equipment.page = parseInt(v, 10) || 1 },
    v: { 
      get: () => store.viewMode.equipment || 'cards', 
      set: (v) => {
        const mode = (v && ['cards', 'table'].includes(v)) ? v : 'cards'
        store.viewMode.equipment = mode
      }
    },
    e: { get: () => store.editing.equipment, set: (v) => store.editing.equipment = parseInt(v, 10) || null },
    history: { get: () => store.history?.equipment, set: (v) => { if (store.history) store.history.equipment = parseInt(v, 10) || null } },
    
    // ЗАНЯТИЯ
    l_status: { get: () => store.filters.lessons.status, set: (v) => store.filters.lessons.status = v || '' },
    l_group: { get: () => store.filters.lessons.group, set: (v) => store.filters.lessons.group = v || '' },
    l_search: { get: () => store.filters.lessons.search, set: (v) => store.filters.lessons.search = v || '' },
    l_date_from: { get: () => store.filters.lessons.dateFrom, set: (v) => store.filters.lessons.dateFrom = v || '' },
    l_date_to: { get: () => store.filters.lessons.dateTo, set: (v) => store.filters.lessons.dateTo = v || '' },
    l_p: { get: () => store.pagination.lessons.page || 1, set: (v) => store.pagination.lessons.page = parseInt(v, 10) || 1 },
    lesson_edit: { get: () => store.editing.lesson, set: (v) => store.editing.lesson = parseInt(v, 10) || null },
    
    // РЕМОНТЫ
    r_status: { get: () => store.filters.repairs.status, set: (v) => store.filters.repairs.status = v || '' },
    r_eq_ids: { 
      get: () => store.filters.repairs.equipmentIds?.length > 0 ? JSON.stringify(store.filters.repairs.equipmentIds) : '',
      set: (v) => { 
        try { store.filters.repairs.equipmentIds = v ? JSON.parse(v) : [] } 
        catch (e) { store.filters.repairs.equipmentIds = [] }
      }
    },
    r_date_from: { get: () => store.filters.repairs.dateFrom, set: (v) => store.filters.repairs.dateFrom = v || '' },
    r_date_to: { get: () => store.filters.repairs.dateTo, set: (v) => store.filters.repairs.dateTo = v || '' },
    r_p: { get: () => store.pagination.repairs.page || 1, set: (v) => store.pagination.repairs.page = parseInt(v, 10) || 1 },
    repair_edit: { get: () => store.editing.repair, set: (v) => store.editing.repair = parseInt(v, 10) || null },
    
    // ШАБЛОНЫ
    t_status: { get: () => store.filters.templates.status, set: (v) => store.filters.templates.status = v || '' },
    t_discipline: { get: () => store.filters.templates.discipline, set: (v) => store.filters.templates.discipline = v || '' },
    t_module: { get: () => store.filters.templates.module, set: (v) => store.filters.templates.module = v || '' },
    t_search: { get: () => store.filters.templates.search, set: (v) => store.filters.templates.search = v || '' },
    t_p: { get: () => store.pagination.templates.page || 1, set: (v) => store.pagination.templates.page = parseInt(v, 10) || 1 },
    template_edit: { get: () => store.editing.template, set: (v) => store.editing.template = parseInt(v, 10) || null },
    
    // АНАЛИТИКА
    eq_ids: {
      get: () => store.filters.analytics.equipmentIds?.length > 0 ? JSON.stringify(store.filters.analytics.equipmentIds) : '',
      set: (v) => {
        try { store.filters.analytics.equipmentIds = v ? JSON.parse(v) : [] }
        catch (e) { store.filters.analytics.equipmentIds = [] }
      }
    },
    date_from: { get: () => store.filters.analytics.dateFrom, set: (v) => store.filters.analytics.dateFrom = v || '' },
    date_to: { get: () => store.filters.analytics.dateTo, set: (v) => store.filters.analytics.dateTo = v || '' },
    a_p: { get: () => store.pagination.analytics.page || 1, set: (v) => store.pagination.analytics.page = parseInt(v, 10) || 1 }
  }

  // ============================================
  // STORE → URL
  // ============================================
  const syncToUrl = () => {
    if (isUpdatingFromUrl) return
    isUpdatingFromStore = true
    
    const query = { ...route.query }
    
    for (const [key, config] of Object.entries(syncConfig)) {
      const value = config.get()
      
      // ✅ Всегда сохраняем v, даже если 'cards'
      if (key === 'v' || key === 'p' || key === 'l_p' || key === 'r_p' || key === 't_p' || key === 'a_p') {
        if (value !== undefined && value !== null) {
          query[key] = typeof value === 'string' ? value : String(value)
        }
      } else if (value && value !== '' && value !== '[]') {
        query[key] = typeof value === 'string' ? value : String(value)
      } else {
        delete query[key]
      }
    }
    
    router.replace({ query })
    nextTick(() => { isUpdatingFromStore = false })
  }

  // ============================================
  // URL → STORE
  // ============================================
  const syncFromUrl = () => {
    if (isUpdatingFromStore) return
    isUpdatingFromUrl = true
    
    const q = route.query
    
    for (const [key, config] of Object.entries(syncConfig)) {
      if (q[key] !== undefined && q[key] !== '') {
        config.set(q[key])
      }
    }
    
    // ✅ Если v нет в URL, но есть в store, сохраняем store
    if (!q.v && store.viewMode.equipment) {
      // уже есть в store
    }
    
    nextTick(() => { isUpdatingFromUrl = false })
  }

  // ============================================
  // WATCH
  // ============================================
  watch(
    () => [store.filters, store.pagination, store.viewMode, store.editing, store.history],
    () => syncToUrl(),
    { deep: true }
  )

  watch(
    () => route.query,
    () => {
      if (isUpdatingFromStore) return
      syncFromUrl()
    },
    { deep: true }
  )

  // ============================================
  // LIFECYCLE
  // ============================================
  onMounted(() => {
    // ✅ Сначала загружаем из URL
    syncFromUrl()
    
    // ✅ Если v нет в URL, но есть в store, добавляем в URL
    if (!route.query.v && store.viewMode.equipment) {
      const query = { ...route.query, v: store.viewMode.equipment }
      router.replace({ query })
    }
  })

  return { store, syncToUrl, syncFromUrl }
}