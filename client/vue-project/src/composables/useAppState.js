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
  // STORE → URL
  // ============================================
  const syncToUrl = () => {
    if (isUpdatingFromUrl) return
    
    isUpdatingFromStore = true
    
    const query = { ...route.query }
    
    // === ОБОРУДОВАНИЕ ===
    if (store.filters.equipment.search) {
      query.q = store.filters.equipment.search
    } else {
      delete query.q
    }
    
    if (store.filters.equipment.working_status) {
      query.s = store.filters.equipment.working_status
    } else {
      delete query.s
    }
    
    if (store.filters.equipment.write_off_status) {
      query.w = store.filters.equipment.write_off_status
    } else {
      delete query.w
    }
    
    // ✅ ПАГИНАЦИЯ
    query.p = store.pagination.equipment.page || 1
    
    // ✅ ВИД ОТОБРАЖЕНИЯ
    if (store.viewMode.equipment !== 'cards') {
      query.v = store.viewMode.equipment
    } else {
      delete query.v
    }
    
    // === РЕДАКТИРОВАНИЕ ===
    if (store.editing.equipment) {
      query.e = store.editing.equipment
    } else {
      delete query.e
    }
    
    if (store.editing.repair) {
      query.repair_edit = store.editing.repair
    } else {
      delete query.repair_edit
    }
    
    if (store.editing.lesson) {
      query.lesson_edit = store.editing.lesson
    } else {
      delete query.lesson_edit
    }
    
    if (store.editing.template) {
      query.template_edit = store.editing.template
    } else {
      delete query.template_edit
    }
    
    if (store.history?.equipment) {
      query.history = store.history.equipment
    } else {
      delete query.history
    }
    
    // === АНАЛИТИКА ===
    if (store.filters.analytics) {
      const a = store.filters.analytics
      
      if (a.equipmentIds && a.equipmentIds.length > 0) {
        query.eq_ids = JSON.stringify(a.equipmentIds)
      } else {
        delete query.eq_ids
      }
      
      if (a.dateFrom) {
        query.date_from = a.dateFrom
      } else {
        delete query.date_from
      }
      
      if (a.dateTo) {
        query.date_to = a.dateTo
      } else {
        delete query.date_to
      }
    }
    
    if (store.pagination.analytics) {
      query.a_p = store.pagination.analytics.page || 1
    }
    
    // === ЗАНЯТИЯ ===
    if (store.filters.lessons) {
      const l = store.filters.lessons
      
      if (l.status) {
        query.l_status = l.status
      } else {
        delete query.l_status
      }
      
      if (l.group) {
        query.l_group = l.group
      } else {
        delete query.l_group
      }
      
      if (l.search) {
        query.l_search = l.search
      } else {
        delete query.l_search
      }
      
      if (l.dateFrom) {
        query.l_date_from = l.dateFrom
      } else {
        delete query.l_date_from
      }
      
      if (l.dateTo) {
        query.l_date_to = l.dateTo
      } else {
        delete query.l_date_to
      }
    }
    
    if (store.pagination.lessons) {
      query.l_p = store.pagination.lessons.page || 1
    }
    
    // === РЕМОНТЫ ===
    if (store.filters.repairs) {
      const r = store.filters.repairs
      
      if (r.status) {
        query.r_status = r.status
      } else {
        delete query.r_status
      }
      
      if (r.equipmentIds && r.equipmentIds.length > 0) {
        query.r_eq_ids = JSON.stringify(r.equipmentIds)
      } else {
        delete query.r_eq_ids
      }
      
      if (r.dateFrom) {
        query.r_date_from = r.dateFrom
      } else {
        delete query.r_date_from
      }
      
      if (r.dateTo) {
        query.r_date_to = r.dateTo
      } else {
        delete query.r_date_to
      }
    }
    
    if (store.pagination.repairs) {
      query.r_p = store.pagination.repairs.page || 1
    }
    
    // === ШАБЛОНЫ ===
    if (store.filters.templates) {
      const t = store.filters.templates
      
      if (t.status) {
        query.t_status = t.status
      } else {
        delete query.t_status
      }
      
      if (t.discipline) {
        query.t_discipline = t.discipline
      } else {
        delete query.t_discipline
      }
      
      if (t.module) {
        query.t_module = t.module
      } else {
        delete query.t_module
      }
      
      if (t.search) {
        query.t_search = t.search
      } else {
        delete query.t_search
      }
    }
    
    if (store.pagination.templates) {
      query.t_p = store.pagination.templates.page || 1
    }
    
    router.replace({ query })
    
    nextTick(() => {
      isUpdatingFromStore = false
    })
  }
  
  // ============================================
  // URL → STORE
  // ============================================
  const syncFromUrl = () => {
    if (isUpdatingFromStore) return
    
    isUpdatingFromUrl = true
    
    const q = route.query
    
    // === ОБОРУДОВАНИЕ ===
    if (q.q) store.filters.equipment.search = q.q
    else store.filters.equipment.search = ''
    
    if (q.s) store.filters.equipment.working_status = q.s
    else store.filters.equipment.working_status = ''
    
    if (q.w) store.filters.equipment.write_off_status = q.w
    else store.filters.equipment.write_off_status = ''
    
    // ✅ ПАГИНАЦИЯ
    store.pagination.equipment.page = q.p ? (parseInt(q.p, 10) || 1) : 1
    
    // ✅ ВИД ОТОБРАЖЕНИЯ
    if (q.v && ['cards', 'table'].includes(q.v)) {
      store.viewMode.equipment = q.v
    } else {
      store.viewMode.equipment = 'cards'
    }
    
    // === РЕДАКТИРОВАНИЕ ===
    store.editing.equipment = q.e ? (parseInt(q.e, 10) || null) : null
    store.editing.repair = q.repair_edit ? (parseInt(q.repair_edit, 10) || null) : null
    store.editing.lesson = q.lesson_edit ? (parseInt(q.lesson_edit, 10) || null) : null
    store.editing.template = q.template_edit ? (parseInt(q.template_edit, 10) || null) : null
    
    if (q.history) {
      if (!store.history) store.history = { equipment: null }
      store.history.equipment = parseInt(q.history, 10) || null
    } else {
      if (store.history) store.history.equipment = null
    }
    
    // === АНАЛИТИКА ===
    if (!store.filters.analytics) {
      store.filters.analytics = { equipmentIds: [], dateFrom: '', dateTo: '' }
    }
    
    if (q.eq_ids) {
      try {
        store.filters.analytics.equipmentIds = JSON.parse(q.eq_ids)
      } catch (e) {
        store.filters.analytics.equipmentIds = []
      }
    } else {
      store.filters.analytics.equipmentIds = []
    }
    
    store.filters.analytics.dateFrom = q.date_from || ''
    store.filters.analytics.dateTo = q.date_to || ''
    
    if (!store.pagination.analytics) {
      store.pagination.analytics = { page: 1, size: 7 }
    }
    store.pagination.analytics.page = q.a_p ? (parseInt(q.a_p, 10) || 1) : 1
    
    // === ЗАНЯТИЯ ===
    if (!store.filters.lessons) {
      store.filters.lessons = { status: '', group: '', search: '', dateFrom: '', dateTo: '' }
    }
    
    store.filters.lessons.status = q.l_status || ''
    store.filters.lessons.group = q.l_group || ''
    store.filters.lessons.search = q.l_search || ''
    store.filters.lessons.dateFrom = q.l_date_from || ''
    store.filters.lessons.dateTo = q.l_date_to || ''
    
    if (!store.pagination.lessons) {
      store.pagination.lessons = { page: 1, size: 7 }
    }
    store.pagination.lessons.page = q.l_p ? (parseInt(q.l_p, 10) || 1) : 1
    
    // === РЕМОНТЫ ===
    if (!store.filters.repairs) {
      store.filters.repairs = { status: '', equipmentIds: [], dateFrom: '', dateTo: '' }
    }
    
    store.filters.repairs.status = q.r_status || ''
    
    if (q.r_eq_ids) {
      try {
        store.filters.repairs.equipmentIds = JSON.parse(q.r_eq_ids)
      } catch (e) {
        store.filters.repairs.equipmentIds = []
      }
    } else {
      store.filters.repairs.equipmentIds = []
    }
    
    store.filters.repairs.dateFrom = q.r_date_from || ''
    store.filters.repairs.dateTo = q.r_date_to || ''
    
    if (!store.pagination.repairs) {
      store.pagination.repairs = { page: 1, size: 7}
    }
    store.pagination.repairs.page = q.r_p ? (parseInt(q.r_p, 10) || 1) : 1
    
    // === ШАБЛОНЫ ===
    if (!store.filters.templates) {
      store.filters.templates = { status: '', discipline: '', module: '', search: '' }
    }
    
    store.filters.templates.status = q.t_status || ''
    store.filters.templates.discipline = q.t_discipline || ''
    store.filters.templates.module = q.t_module || ''
    store.filters.templates.search = q.t_search || ''
    
    if (!store.pagination.templates) {
      store.pagination.templates = { page: 1, size: 7 }
    }
    store.pagination.templates.page = q.t_p ? (parseInt(q.t_p, 10) || 1) : 1
    
    nextTick(() => {
      isUpdatingFromUrl = false
    })
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
    syncFromUrl()
  })
  
  return { store, syncToUrl, syncFromUrl }
}