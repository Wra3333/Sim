import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    // Сайдбар
    sidebar: {
      pinned: false,
      visible: false
    },
    
    // Вид отображения для каждой страницы
    viewMode: {
      equipment: 'cards',    // 'table' или 'cards'
      lessons: 'cards',
      repairs: 'cards',
      templates: 'cards'
    },
    
    // Фильтры
    filters: {
      equipment: { working_status: '', write_off_status: '', search: '', tags: [] },
      lessons: { 
        status: '', 
        group: '', 
        search: '',
        dateFrom: '',
        dateTo: ''
      },
      repairs: { status: '', equipmentIds: [], dateFrom: '', dateTo: '' },
      templates: { status: '', discipline: '', module: '', search: '' },
      analytics: { equipmentIds: [], dateFrom: '', dateTo: '' }
    },
    
    // Пагинация
    pagination: {
      equipment: { page: 1, size: 7 },
      lessons: { page: 1, size: 7 },
      repairs: { page: 1, size: 8 },
      templates: { page: 1, size: 7 },
      analytics: { page: 1, size: 7 }
    },
    
    // Редактирование
    editing: {
      equipment: null,
      lesson: null,
      repair: null,
      template: null
    },
    
    // История поломок (для оборудования)
    history: {
      equipment: null,
      lesson: null,
      repair: null,
      template: null
    }
  }),
  
  actions: {
    // ============ САЙДБАР ============
    toggleSidebar() {
      this.sidebar.visible = !this.sidebar.visible
      this.sidebar.pinned = this.sidebar.visible
    },
    showSidebar() {
      this.sidebar.visible = true
    },
    hideSidebar() {
      if (!this.sidebar.pinned) {
        this.sidebar.visible = false
      }
    },
    
    // ============ ВИД ОТОБРАЖЕНИЯ ============
    setViewMode(module, mode) {
      if (this.viewMode[module] !== undefined) {
        this.viewMode[module] = mode
      }
    },
    
    toggleViewMode(module) {
      if (this.viewMode[module] !== undefined) {
        this.viewMode[module] = this.viewMode[module] === 'table' ? 'cards' : 'table'
      }
    },
    
    // ============ ФИЛЬТРЫ ============
    setFilter(module, key, value) {
      if (this.filters[module]) {
        this.filters[module][key] = value
      }
    },
    
    resetFilters(module) {
      const defaults = {
        equipment: { working_status: '', write_off_status: '', search: '', tags: [] },
        lessons: { status: '', group: '', search: '', dateFrom: '', dateTo: '' },
        repairs: { status: '', equipmentIds: [], dateFrom: '', dateTo: '' },
        templates: { status: '', discipline: '', module: '', search: '' },
        analytics: { equipmentIds: [], dateFrom: '', dateTo: '' }
      }
      if (defaults[module]) {
        this.filters[module] = { ...defaults[module] }
      }
    },
    
    resetAllFilters() {
      this.filters = {
        equipment: { working_status: '', write_off_status: '', search: '', tags: [] },
        lessons: { status: '', group: '', search: '', dateFrom: '', dateTo: '' },
        repairs: { status: '', equipmentIds: [], dateFrom: '', dateTo: '' },
        templates: { status: '', discipline: '', module: '', search: '' },
        analytics: { equipmentIds: [], dateFrom: '', dateTo: '' }
      }
    },
    
    // ============ ПАГИНАЦИЯ ============
    setPage(module, page) {
      if (this.pagination[module]) {
        this.pagination[module].page = page
      }
    },
    
    setPageSize(module, size) {
      if (this.pagination[module]) {
        this.pagination[module].size = size
        this.pagination[module].page = 1
      }
    },
    
    resetPage(module) {
      if (this.pagination[module]) {
        this.pagination[module].page = 1
      }
    },
    
    // ============ РЕДАКТИРОВАНИЕ ============
    openEdit(module, id) {
      if (this.editing[module] !== undefined) {
        this.editing[module] = id
      }
    },
    closeEdit(module) {
      if (this.editing[module] !== undefined) {
        this.editing[module] = null
      }
    },
    isEditing(module, id) {
      return this.editing[module] === id
    },
    
    // ============ ИСТОРИЯ ПОЛОМОК ============
    openHistory(module, id) {
      if (this.history[module] !== undefined) {
        this.history[module] = id
      }
    },
    closeHistory(module) {
      if (this.history[module] !== undefined) {
        this.history[module] = null
      }
    },
    isHistoryOpen(module, id) {
      return this.history[module] === id
    },
    toggleHistory(module, id) {
      if (this.history[module] === id) {
        this.history[module] = null
      } else {
        this.history[module] = id
      }
    }
  },
  
  persist: {
    key: 'app_state',
    storage: localStorage,
    paths: ['sidebar', 'viewMode', 'filters', 'pagination', 'history']
  }
})