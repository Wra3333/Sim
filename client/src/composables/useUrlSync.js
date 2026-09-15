import { watch, onMounted, nextTick, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '../stores/ui.store'

function debounce(fn, ms) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

const MODULE_BY_ROUTE = {
  '/equipment': 'equipment',
  '/lessons': 'lessons',
  '/repairs': 'repairs',
  '/templates': 'templates',
  '/analytics': 'analytics'
}

const VIEW_MODES = ['cards', 'table']
const SORT_DIRECTIONS = ['asc', 'desc']

const LESSONS_SORT_FIELDS = ['created_at', 'date', 'title', 'status']
const REPAIRS_SORT_FIELDS = ['detection_date', 'equipment', 'status']
const TEMPLATES_SORT_FIELDS = ['created_at', 'title', 'discipline', 'status']

export function useUrlSync({ resolvers = {} } = {}) {
  const route = useRoute()
  const router = useRouter()
  const store = useUiStore()

  let isUpdatingFromStore = false
  let isUpdatingFromUrl = false

  const syncConfig = {
    equipment_search:      { get: () => store.filters.equipment.search,           set: (v) => store.filters.equipment.search = v || '' },
    equipment_status:      { get: () => store.filters.equipment.working_status,   set: (v) => store.filters.equipment.working_status = v || '' },
    equipment_write_off:   { get: () => store.filters.equipment.write_off_status, set: (v) => store.filters.equipment.write_off_status = v || '' },
    equipment_page:        { get: () => store.pagination.equipment.page || 1,     set: (v) => store.pagination.equipment.page = parseInt(v, 10) || 1 },
    equipment_view: {
      get: () => store.viewMode.equipment || 'cards',
      set: (v) => {
        store.viewMode.equipment = (v && VIEW_MODES.includes(v)) ? v : 'cards'
      }
    },
    equipment_edit:        { get: () => store.editing.equipment,                  set: (v) => store.editing.equipment = parseInt(v, 10) || null },
    equipment_history:     { get: () => store.history?.equipment,                 set: (v) => { if (store.history) store.history.equipment = parseInt(v, 10) || null } },

    lessons_status:        { get: () => store.filters.lessons.status,             set: (v) => store.filters.lessons.status = v || '' },
    lessons_group:         { get: () => store.filters.lessons.group,              set: (v) => store.filters.lessons.group = v || '' },
    lessons_search:        { get: () => store.filters.lessons.search,             set: (v) => store.filters.lessons.search = v || '' },
    lessons_date_from:     { get: () => store.filters.lessons.dateFrom,           set: (v) => store.filters.lessons.dateFrom = v || '' },
    lessons_date_to:       { get: () => store.filters.lessons.dateTo,             set: (v) => store.filters.lessons.dateTo = v || '' },
    lessons_sort_field: {
      get: () => store.filters.lessons.sortField || 'created_at',
      set: (v) => {
        store.filters.lessons.sortField =
          (v && LESSONS_SORT_FIELDS.includes(v)) ? v : 'created_at'
      }
    },
    lessons_sort_dir: {
      get: () => store.filters.lessons.sortDirection || 'desc',
      set: (v) => {
        store.filters.lessons.sortDirection =
          (v && SORT_DIRECTIONS.includes(v)) ? v : 'desc'
      }
    },
    lessons_page:          { get: () => store.pagination.lessons.page || 1,       set: (v) => store.pagination.lessons.page = parseInt(v, 10) || 1 },
    lessons_view: {
      get: () => store.viewMode.lessons || 'cards',
      set: (v) => {
        store.viewMode.lessons = (v && VIEW_MODES.includes(v)) ? v : 'cards'
      }
    },
    lessons_edit:          { get: () => store.editing.lesson,                     set: (v) => store.editing.lesson = parseInt(v, 10) || null },

    repairs_status:        { get: () => store.filters.repairs.status,             set: (v) => store.filters.repairs.status = v || '' },
    repairs_equipment_ids: {
      get: () => store.filters.repairs.equipmentIds?.length > 0 ? JSON.stringify(store.filters.repairs.equipmentIds) : '',
      set: (v) => {
        try { store.filters.repairs.equipmentIds = v ? JSON.parse(v) : [] }
        catch (e) { store.filters.repairs.equipmentIds = [] }
      }
    },
    repairs_date_from:     { get: () => store.filters.repairs.dateFrom,           set: (v) => store.filters.repairs.dateFrom = v || '' },
    repairs_date_to:       { get: () => store.filters.repairs.dateTo,             set: (v) => store.filters.repairs.dateTo = v || '' },
    repairs_sort_field: {
      get: () => store.filters.repairs.sortField || 'detection_date',
      set: (v) => {
        store.filters.repairs.sortField =
          (v && REPAIRS_SORT_FIELDS.includes(v)) ? v : 'detection_date'
      }
    },
    repairs_sort_dir: {
      get: () => store.filters.repairs.sortDirection || 'desc',
      set: (v) => {
        store.filters.repairs.sortDirection =
          (v && SORT_DIRECTIONS.includes(v)) ? v : 'desc'
      }
    },
    repairs_page:          { get: () => store.pagination.repairs.page || 1,       set: (v) => store.pagination.repairs.page = parseInt(v, 10) || 1 },
    repairs_view: {
      get: () => store.viewMode.repairs || 'cards',
      set: (v) => {
        store.viewMode.repairs = (v && VIEW_MODES.includes(v)) ? v : 'cards'
      }
    },
    repairs_edit:          { get: () => store.editing.repair,                     set: (v) => store.editing.repair = parseInt(v, 10) || null },

    templates_status:      { get: () => store.filters.templates.status,           set: (v) => store.filters.templates.status = v || '' },
    templates_discipline:  { get: () => store.filters.templates.discipline,       set: (v) => store.filters.templates.discipline = v || '' },
    templates_module:      { get: () => store.filters.templates.module,           set: (v) => store.filters.templates.module = v || '' },
    templates_search:      { get: () => store.filters.templates.search,           set: (v) => store.filters.templates.search = v || '' },
    templates_sort_field: {
      get: () => store.filters.templates.sortField || 'created_at',
      set: (v) => {
        store.filters.templates.sortField =
          (v && TEMPLATES_SORT_FIELDS.includes(v)) ? v : 'created_at'
      }
    },
    templates_sort_dir: {
      get: () => store.filters.templates.sortDirection || 'desc',
      set: (v) => {
        store.filters.templates.sortDirection =
          (v && SORT_DIRECTIONS.includes(v)) ? v : 'desc'
      }
    },
    templates_page:        { get: () => store.pagination.templates.page || 1,     set: (v) => store.pagination.templates.page = parseInt(v, 10) || 1 },
    templates_view: {
      get: () => store.viewMode.templates || 'cards',
      set: (v) => {
        store.viewMode.templates = (v && VIEW_MODES.includes(v)) ? v : 'cards'
      }
    },
    templates_edit:        { get: () => store.editing.template,                   set: (v) => store.editing.template = parseInt(v, 10) || null },

    // АНАЛИТИКА
    analytics_equipment_ids: {
      get: () => store.filters.analytics.equipmentIds?.length > 0 ? JSON.stringify(store.filters.analytics.equipmentIds) : '',
      set: (v) => {
        try { store.filters.analytics.equipmentIds = v ? JSON.parse(v) : [] }
        catch (e) { store.filters.analytics.equipmentIds = [] }
      }
    },
    analytics_date_from:   { get: () => store.filters.analytics.dateFrom,         set: (v) => store.filters.analytics.dateFrom = v || '' },
    analytics_date_to:     { get: () => store.filters.analytics.dateTo,           set: (v) => store.filters.analytics.dateTo = v || '' },
    analytics_faculty:     { get: () => store.filters.analytics.faculty,          set: (v) => store.filters.analytics.faculty = v || '' },
    analytics_specialty:   { get: () => store.filters.analytics.specialty,        set: (v) => store.filters.analytics.specialty = v || '' },
    analytics_course:      { get: () => store.filters.analytics.course,           set: (v) => store.filters.analytics.course = v || '' },
    analytics_teacher:     { get: () => store.filters.analytics.teacher,          set: (v) => store.filters.analytics.teacher = v || '' },
    analytics_sort_dir: {
      get: () => store.filters.analytics.sortDirection || 'desc',
      set: (v) => {
        store.filters.analytics.sortDirection =
          (v && SORT_DIRECTIONS.includes(v)) ? v : 'desc'
      }
    },
    analytics_page:        { get: () => store.pagination.analytics.page || 1,     set: (v) => store.pagination.analytics.page = parseInt(v, 10) || 1 }
  }

  const DEFAULTS = {
    equipment_search: '', equipment_status: '', equipment_write_off: '',
    equipment_page: 1, equipment_view: 'cards',
    equipment_edit: null, equipment_history: null,

    lessons_status: '', lessons_group: '', lessons_search: '',
    lessons_date_from: '', lessons_date_to: '',
    lessons_sort_field: 'created_at', lessons_sort_dir: 'desc',
    lessons_page: 1, lessons_view: 'cards', lessons_edit: null,

    repairs_status: '', repairs_equipment_ids: [],
    repairs_date_from: '', repairs_date_to: '',
    repairs_sort_field: 'detection_date', repairs_sort_dir: 'desc',
    repairs_page: 1, repairs_view: 'cards', repairs_edit: null,

    templates_status: '', templates_discipline: '', templates_module: '',
    templates_search: '',
    templates_sort_field: 'created_at', templates_sort_dir: 'desc',
    templates_page: 1, templates_view: 'cards', templates_edit: null,

    analytics_equipment_ids: [], analytics_date_from: '', analytics_date_to: '',
    analytics_faculty: '', analytics_specialty: '', analytics_course: '',
    analytics_teacher: '', analytics_sort_dir: 'desc',
    analytics_page: 1
  }

  const isEmpty = (value) =>
    value === undefined || value === null || value === ''
    || (Array.isArray(value) && value.length === 0)

  const isDefault = (key, value) => {
    const def = DEFAULTS[key]
    if (Array.isArray(value)) return value.length === 0
    return value === def
  }

  const syncToUrl = () => {
    if (isUpdatingFromUrl) return
    isUpdatingFromStore = true

    const query = { ...route.query }
    const currentModule = MODULE_BY_ROUTE[route.path]

    for (const [key, config] of Object.entries(syncConfig)) {
      if (currentModule && !key.startsWith(currentModule)) {
        delete query[key]
        continue
      }

      const value = config.get()

      if (isEmpty(value) || isDefault(key, value)) {
        delete query[key]
        continue
      }

      if (Array.isArray(value)) {
        query[key] = JSON.stringify(value)
      } else if (typeof value === 'string') {
        query[key] = value
      } else {
        query[key] = String(value)
      }
    }

    router.replace({ query })
    nextTick(() => { isUpdatingFromStore = false })
  }

  const debouncedSyncToUrl = debounce(syncToUrl, 150)

  const syncFromUrl = () => {
    if (isUpdatingFromStore) return
    isUpdatingFromUrl = true

    const q = route.query

    for (const [key, config] of Object.entries(syncConfig)) {
      if (q[key] !== undefined && q[key] !== '') {
        config.set(q[key])
      }
    }

    nextTick(() => { isUpdatingFromUrl = false })
  }

  const openFromUrl = async (key, { queryKey } = {}) => {
    const raw = route.query[queryKey ?? `${key}_edit`]
    if (!raw) return { found: false, item: null, id: null }

    const id = parseInt(raw, 10)
    if (isNaN(id) || id <= 0) return { found: false, item: null, id: null }

    const resolver = resolvers[key]
    if (!resolver) return { found: false, item: null, id }

    const item = await resolver(id)
    return { found: !!item, item, id }
  }

  watch(
    () => [store.filters, store.pagination, store.viewMode, store.editing, store.history],
    () => debouncedSyncToUrl(),
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

  onMounted(() => {
    syncFromUrl()
  })
  onActivated(() => {
  syncFromUrl()
})

  return { store, syncToUrl, syncFromUrl, openFromUrl }
}