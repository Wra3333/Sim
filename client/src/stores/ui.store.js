import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    sidebar: {
      pinned: false,
      visible: false
    },

    viewMode: {
      equipment: 'cards',
      lessons: 'cards',
      repairs: 'cards',
      templates: 'cards'
    },

    filters: {
      equipment: { working_status: '', write_off_status: '', search: '', tags: [], ids: [] },

      lessons: {
        status: '',
        group: '',
        search: '',
        dateFrom: '',
        dateTo: '',
        sortField: 'created_at',
        sortDirection: 'desc'
      },

      repairs: {
        status: '',
        equipmentIds: [],
        dateFrom: '',
        dateTo: '',
        sortField: 'detection_date',
        sortDirection: 'desc'
      },

      templates: {
        status: '',
        discipline: '',
        module: '',
        search: '',
        sortField: 'created_at',
        sortDirection: 'desc'
      },

      analytics: {
        equipmentIds: [],
        dateFrom: '',
        dateTo: '',
        group: '',
        participantType: '',
        faculty: '',
        specialty: '',
        course: '',
        teacher: '',
        sortDirection: 'desc'
      }
    },

    pagination: {
      equipment: { page: 1, size: 6 },
      lessons: { page: 1, size: 7 },
      repairs: { page: 1, size: 8 },
      templates: { page: 1, size: 7 },
      analytics: { page: 1, size: 7 }
    },

    editing: {
      equipment: null,
      lesson: null,
      repair: null,
      template: null
    },

    creating: {
      equipment: false,
      lesson: false,
      repair: false,
      template: false
    },

    history: {
      equipment: null,
      lesson: null,
      repair: null,
      template: null
    }
  }),

  actions: {
    toggleSidebar() {
      this.sidebar.visible = !this.sidebar.visible
      this.sidebar.pinned = this.sidebar.visible
    },
    showSidebar() {
      this.sidebar.visible = true
    },
    hideSidebar() {
      if (!this.sidebar.pinned) this.sidebar.visible = false
    },

    setViewMode(module, mode) {
      if (this.viewMode[module] !== undefined) this.viewMode[module] = mode
    },
    toggleViewMode(module) {
      if (this.viewMode[module] !== undefined) {
        this.viewMode[module] = this.viewMode[module] === 'table' ? 'cards' : 'table'
      }
    },

    setFilter(module, key, value) {
      if (this.filters[module]) this.filters[module][key] = value
    },

    resetFilters(module) {
      const defaults = {
        equipment: { working_status: '', write_off_status: '', search: '', tags: [], ids: [] },
        lessons: {
          status: '',
          group: '',
          search: '',
          dateFrom: '',
          dateTo: '',
          sortField: 'created_at',
          sortDirection: 'desc'
        },
        repairs: {
          status: '',
          equipmentIds: [],
          dateFrom: '',
          dateTo: '',
          sortField: 'detection_date',
          sortDirection: 'desc'
        },
        templates: {
          status: '',
          discipline: '',
          module: '',
          search: '',
          sortField: 'created_at',
          sortDirection: 'desc'
        },
        analytics: {
          equipmentIds: [],
          dateFrom: '',
          dateTo: '',
          group: '',
          participantType: '',
          faculty: '',
          specialty: '',
          course: '',
          teacher: '',
          sortDirection: 'desc'
        }
      }
      if (defaults[module]) {
        this.filters[module] = { ...defaults[module] }
      }
    },

    resetAllFilters() {
      this.filters = {
        equipment: { working_status: '', write_off_status: '', search: '', tags: [], ids: [] },
        lessons: {
          status: '',
          group: '',
          search: '',
          dateFrom: '',
          dateTo: '',
          sortField: 'created_at',
          sortDirection: 'desc'
        },
        repairs: {
          status: '',
          equipmentIds: [],
          dateFrom: '',
          dateTo: '',
          sortField: 'detection_date',
          sortDirection: 'desc'
        },
        templates: {
          status: '',
          discipline: '',
          module: '',
          search: '',
          sortField: 'created_at',
          sortDirection: 'desc'
        },
        analytics: {
          equipmentIds: [],
          dateFrom: '',
          dateTo: '',
          group: '',
          participantType: '',
          faculty: '',
          specialty: '',
          course: '',
          teacher: '',
          sortDirection: 'desc'
        }
      }
    },

    setPage(module, page) {
      if (this.pagination[module]) this.pagination[module].page = page
    },
    setPageSize(module, size) {
      if (this.pagination[module]) {
        this.pagination[module].size = size
        this.pagination[module].page = 1
      }
    },
    resetPage(module) {
      if (this.pagination[module]) this.pagination[module].page = 1
    },

    openCreate(module) {
      if (this.creating[module] !== undefined) {
        this.creating[module] = true
        this.editing[module] = null
      }
    },
    openEdit(module, id) {
      if (this.editing[module] !== undefined) {
        this.creating[module] = false
        this.editing[module] = id
      }
    },
    closeEdit(module) {
      if (this.editing[module] !== undefined) {
        this.creating[module] = false
        this.editing[module] = null
      }
    },
    isEditing(module, id) {
      return this.editing[module] === id
    },

    openHistory(module, id) {
      if (this.history[module] !== undefined) this.history[module] = id
    },
    closeHistory(module) {
      if (this.history[module] !== undefined) this.history[module] = null
    },
    isHistoryOpen(module, id) {
      return this.history[module] === id
    },
    toggleHistory(module, id) {
      if (this.history[module] === id) this.history[module] = null
      else this.history[module] = id
    }
  },

  persist: {
    key: 'ui_state',
    storage: localStorage,
    paths: ['sidebar', 'viewMode', 'filters', 'pagination']
  }
})