<template>
  <div class="equipment-view">
    <!-- TOOLBAR -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>
          <IconEquipment class="title-icon" />
          Журнал учета оборудования
        </h2>
        <span class="count">
          {{ showArchived ? 'В архиве:' : 'Найдено:' }} {{ filteredEquipment.length }}
        </span>
        <span class="count archived-count" v-if="equipmentStore.archivedCount > 0">
          Всего в архиве: {{ equipmentStore.archivedCount }}
        </span>
      </div>
      <div class="toolbar-right">
        <input 
          type="file" 
          ref="fileInput" 
          accept=".xlsx,.xls" 
          style="display: none"
          @change="handleImportExcel"
        />
        <button class="btn btn-outline-secondary" @click="fileInput.click()">
          <IconImport class="btn-icon" />
          Импорт Excel
        </button>
        <button class="btn btn-outline-secondary" @click="exportModalOpen = true">
          <IconExport class="btn-icon" />
          Экспорт Excel
        </button>
        
        <!-- ✅ ViewToggle с двухсторонней связью -->
        <ViewToggle 
          :model-value="equipmentViewMode" 
          @update:model-value="handleViewModeChange" 
        />

        <button class="btn" :class="showArchived ? 'btn-warning' : 'btn-outline-secondary'" @click="toggleArchived">
          <IconArchive class="btn-icon" />
          {{ showArchived ? 'Показать активные' : 'Показать архив' }}
          <span v-if="equipmentStore.archivedCount > 0 && !showArchived" class="badge">{{ equipmentStore.archivedCount }}</span>
        </button>
        
        <button class="btn btn-primary" @click="openCreateForm">
          <IconPlus class="btn-icon" />
          Добавить
        </button>
      </div>
    </div>

    <div class="content-with-sidebar">
      <div class="main-content">
        <!-- ФИЛЬТРЫ -->
        <div class="filters" v-if="!showArchived">
          <div class="filters-grid">
            <div class="filters-row">
              <div class="filter-group">
                <label>Статус</label>
                <select v-model="equipmentFilters.working_status" class="form-control form-control-sm">
                  <option value="">Все статусы</option>
                  <option value="Исправен">Исправен</option>
                  <option value="Требует ремонта">Требует ремонта</option>
                  <option value="В ремонте">В ремонте</option>
                </select>
              </div>

              <div class="filter-group">
                <label>Списание</label>
                <select v-model="equipmentFilters.write_off_status" class="form-control form-control-sm">
                  <option value="">Все статусы</option>
                  <option value="На балансе">На балансе</option>
                  <option value="На списание">На списание</option>
                  <option value="Списан">Списан</option>
                </select>
              </div>

              <div class="filter-group filter-actions">
                <button class="btn btn-outline-secondary btn-sm" @click="resetAllFilters">
                  <IconReset class="btn-icon" />
                  Сбросить
                </button>
              </div>
            </div>

            <div class="filters-row filters-row-equipment">
              <div class="filter-group filter-group-equipment">
                <label>Оборудование</label>
                <EquipmentMultiSelect
                  :model-value="selectedEquipmentIds"
                  @update:model-value="handleEquipmentSelect"
                  :equipment-options="allEquipmentForSelect"
                  placeholder="Введите название или инв. номер..."
                />
              </div>
            </div>
          </div>
        </div>

        <!-- СПИСОК -->
        <div v-if="loading" class="text-center">Загрузка...</div>
        <div v-else-if="filteredEquipment.length === 0" class="empty-state">
          <span>Нет оборудования</span>
        </div>

        <EquipmentTableView
          v-else-if="equipmentViewMode === 'table'"
          :items="paginatedItems"
          @edit="openEditForm"
          @delete="confirmDelete"
          @deletePermanent="confirmDeletePermanent"
          @history="openHistoryModal"
          @restore="handleRestore"
          @row-click="openEditForm"
        />

        <EquipmentCardView
          v-else
          :items="paginatedItems"
          @edit="openEditForm"
          @delete="confirmDelete"
          @deletePermanent="confirmDeletePermanent"
          @history="openHistoryModal"
          @restore="handleRestore"
          @photo-click="openEditForm"
        />

        <Pagination 
          v-if="showPagination"
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :loading="loading"
        />
      </div>

      <!-- САЙДБАР -->
      <div class="sidebar-filters">
        <div class="sidebar-card">
          <h4>
            <IconFilter class="sidebar-icon" />
            Расширенные фильтры
          </h4>
          
          <div class="filter-group sidebar-filter-group">
            <label>Теги</label>
            <div class="tags-select">
              <div 
                v-for="tag in allTags" 
                :key="tag" 
                class="tag-option"
                :class="{ active: advancedFilters.tags?.includes(tag) }"
                @click="toggleTag(tag)"
              >
                <span class="tag-name">#{{ tag }}</span>
                <span class="tag-check" v-if="advancedFilters.tags?.includes(tag)">✓</span>
              </div>
              <div v-if="allTags.length === 0" class="no-tags">
                Нет тегов
              </div>
            </div>
          </div>

          <div class="filter-group sidebar-filter-group">
            <label>Страна</label>
            <input 
              v-model="advancedFilters.country" 
              type="text" 
              class="form-control form-control-sm" 
              placeholder="Например: Россия"
              @input="applyAdvancedFilters"
            />
          </div>

          <div class="filter-group sidebar-filter-group">
            <label>Производитель</label>
            <input 
              v-model="advancedFilters.manufacturer" 
              type="text" 
              class="form-control form-control-sm" 
              placeholder="Например: Limbs & Things"
              @input="applyAdvancedFilters"
            />
          </div>

          <div class="filter-group sidebar-filter-group">
            <label>Класс реалистичности</label>
            <input 
              v-model="advancedFilters.realism_class" 
              type="text" 
              class="form-control form-control-sm" 
              placeholder="Например: 1, 2, 3..."
              @input="applyAdvancedFilters"
            />
          </div>

          <div class="filter-group sidebar-filter-group">
            <label>Цена (₽)</label>
            <div class="price-inputs">
              <input 
                v-model.number="advancedFilters.min_price" 
                type="number" 
                class="form-control form-control-sm" 
                placeholder="От"
                @input="applyAdvancedFilters"
              />
              <span class="price-separator">—</span>
              <input 
                v-model.number="advancedFilters.max_price" 
                type="number" 
                class="form-control form-control-sm" 
                placeholder="До"
                @input="applyAdvancedFilters"
              />
            </div>
          </div>

          <div class="filter-group sidebar-filter-group">
            <label>Год закупки</label>
            <div class="price-inputs">
              <input 
                v-model.number="advancedFilters.year_from" 
                type="number" 
                class="form-control form-control-sm" 
                placeholder="От"
                @input="applyAdvancedFilters"
              />
              <span class="price-separator">—</span>
              <input 
                v-model.number="advancedFilters.year_to" 
                type="number" 
                class="form-control form-control-sm" 
                placeholder="До"
                @input="applyAdvancedFilters"
              />
            </div>
          </div>

          <button class="btn btn-outline-secondary btn-sm btn-reset" @click="resetAdvancedFilters">
            <IconReset class="btn-icon" />
            Сбросить расширенные
          </button>
        </div>
      </div>
    </div>

    <!-- DRAWER -->
    <EquipmentDrawer
      :open="showForm"
      :equipment="editingItem"
      @close="closeForm"
      @save="onSaved"
    />

    <!-- CONFIRM MODALS -->
    <ConfirmModal
      v-model:visible="showArchiveModal"
      title="Архивация оборудования"
      message="Вы уверены, что хотите отправить это оборудование в архив?"
      confirm-text="Архивировать"
      confirm-variant="warning"
      @confirm="handleArchive"
    />

    <ConfirmModal
      v-model:visible="showDeletePermanentModal"
      title="Удаление оборудования"
      message="Вы уверены, что хотите удалить это оборудование навсегда? Это действие нельзя отменить!"
      confirm-text="Удалить навсегда"
      confirm-variant="danger"
      @confirm="handleDeletePermanent"
    />

    <!-- HISTORY MODAL -->
    <HistoryModal
      :visible="showHistoryModal"
      :equipment="historyEquipment"
      @close="closeHistoryModal"
    />

    <!-- EXPORT MODAL -->
    <ExportModal
      v-if="exportModalOpen"
      :fields="exportFields"
      :labels="exportFieldLabels"
      @close="closeExportModal"
      @export="handleExportExcel"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppState } from '../composables/useAppState'
import { useEquipmentStore } from '../stores'
import { useToastStore } from '../stores/toastStore'
import { equipmentApi } from '../api'
import EquipmentDrawer from '../components/equipment/EquipmentDrawer.vue'
import EquipmentTableView from '../components/equipment/EquipmentTableView.vue'
import EquipmentCardView from '../components/equipment/EquipmentCardView.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import HistoryModal from '../components/equipment/HistoryModal.vue'
import Pagination from '../components/Pagination.vue'
import ExportModal from '../components/equipment/ExportModal.vue'
import ViewToggle from '../components/ViewToggle.vue'
import EquipmentMultiSelect from '../components/EquipmentMultiSelect.vue'
import {
  IconEquipment,
  IconPlus,
  IconImport,
  IconExport,
  IconReset,
  IconArchive,
  IconFilter
} from '../components/icons'

// ============================================
// ROUTER & STORES
// ============================================
const route = useRoute()
const router = useRouter()
const { store } = useAppState()
const equipmentStore = useEquipmentStore()
const toast = useToastStore()

const { loading } = storeToRefs(equipmentStore)
const { filters, pagination, viewMode, editing, history } = storeToRefs(store)

// ============================================
// ФИЛЬТРЫ (реактивные computed)
// ============================================
const equipmentFilters = computed({
  get: () => filters.value.equipment || { working_status: '', write_off_status: '', search: '', tags: [] },
  set: (val) => {
    filters.value.equipment = val
  }
})

const equipmentPagination = computed({
  get: () => pagination.value.equipment || { page: 1, size: 6},
  set: (val) => {
    pagination.value.equipment = val
  }
})

// ✅ VIEW MODE С ПРАВИЛЬНОЙ СИНХРОНИЗАЦИЕЙ
const equipmentViewMode = computed({
  get: () => viewMode.value.equipment || 'cards',
  set: (val) => {
    viewMode.value.equipment = val
    // ✅ Сохраняем в URL сразу
    updateUrlViewMode(val)
  }
})

// ✅ ОБНОВЛЕНИЕ URL ПРИ ИЗМЕНЕНИИ VIEW MODE
const updateUrlViewMode = (mode) => {
  const query = { ...route.query }
  query.v = mode
  router.replace({ query })
}

// ✅ ОБРАБОТЧИК ИЗМЕНЕНИЯ ВИДА
const handleViewModeChange = (mode) => {
  equipmentViewMode.value = mode
}

// ✅ ВОССТАНОВЛЕНИЕ ИЗ URL ПРИ ЗАГРУЗКЕ
const restoreViewModeFromUrl = () => {
  const v = route.query.v
  if (v && ['cards', 'table'].includes(v)) {
    viewMode.value.equipment = v
    return true
  }
  return false
}

// ============================================
// ПАГИНАЦИЯ
// ============================================
const currentPage = computed({
  get: () => equipmentPagination.value.page || 1,
  set: (val) => {
    equipmentPagination.value = { ...equipmentPagination.value, page: val }
  }
})

const pageSize = computed({
  get: () => equipmentPagination.value.size || 6,
  set: (val) => {
    equipmentPagination.value = { ...equipmentPagination.value, size: val, page: 1 }
  }
})

// ============================================
// СОСТОЯНИЕ
// ============================================
const showArchived = ref(false)
const showForm = ref(false)
const editingItem = ref(null)
const showArchiveModal = ref(false)
const showDeletePermanentModal = ref(false)
const deleteItemId = ref(null)
const allTags = ref([])

const fileInput = ref(null)
const exportModalOpen = ref(false)
const exportFields = ref([
  'inventory_number', 'inventory_name', 'name', 'year_of_release',
  'description', 'purchase_basis', 'working_status', 'write_off_status',
  'photo', 'price', 'country', 'manufacturer', 'original_name', 'realism_class'
])

const exportFieldLabels = {
  inventory_number: 'Инвентарный номер',
  inventory_name: 'Инвентарное наименование',
  name: 'Название',
  year_of_release: 'Год закупки',
  description: 'Краткое описание',
  purchase_basis: 'Основание закупки',
  working_status: 'Состояние',
  write_off_status: 'Статус списания',
  photo: 'Фото',
  price: 'Стоимость (₽)',
  country: 'Страна',
  manufacturer: 'Производитель',
  original_name: 'Оригинальное название',
  realism_class: 'Класс реалистичности'
}

// ============================================
// HISTORY MODAL
// ============================================
const showHistoryModal = computed({
  get: () => !!history.value?.equipment,
  set: (val) => {
    if (!val) {
      store.closeHistory('equipment')
    }
  }
})

const historyEquipment = computed({
  get: () => {
    const id = history.value?.equipment
    if (id) {
      return equipmentStore.allEquipment.find(eq => eq.id === id) || null
    }
    return null
  },
  set: (val) => {
    if (val) {
      store.openHistory('equipment', val.id)
    } else {
      store.closeHistory('equipment')
    }
  }
})

// ============================================
// MULTI SELECT
// ============================================
const selectedEquipmentIds = ref([])

const allEquipmentForSelect = computed(() => {
  return equipmentStore.allEquipment.filter(eq => 
    !eq.is_archived && 
    eq.working_status === 'Исправен' && 
    eq.write_off_status === 'На балансе'
  )
})

const handleEquipmentSelect = (ids) => {
  selectedEquipmentIds.value = ids
  const names = ids.map(id => {
    const eq = equipmentStore.getById(id)
    return eq?.name || ''
  }).filter(Boolean)
  equipmentFilters.value.search = names.join(' ')
  currentPage.value = 1
}

// ============================================
// РАСШИРЕННЫЕ ФИЛЬТРЫ
// ============================================
const advancedFilters = ref({
  tags: [],
  realism_class: '',
  country: '',
  manufacturer: '',
  min_price: null,
  max_price: null,
  year_from: null,
  year_to: null
})

const toggleTag = (tag) => {
  const index = advancedFilters.value.tags.indexOf(tag)
  if (index > -1) {
    advancedFilters.value.tags.splice(index, 1)
  } else {
    advancedFilters.value.tags.push(tag)
  }
  applyAdvancedFilters()
}

const applyAdvancedFilters = () => {
  currentPage.value = 1
}

const resetAdvancedFilters = () => {
  advancedFilters.value = {
    tags: [],
    realism_class: '',
    country: '',
    manufacturer: '',
    min_price: null,
    max_price: null,
    year_from: null,
    year_to: null
  }
  currentPage.value = 1
}

// ============================================
// КОНФИГУРАЦИЯ ФИЛЬТРОВ
// ============================================
const filterConfig = {
  working_status: {
    filterFn: (item, value) => {
      if (!value) return true
      return item.working_status === value
    }
  },
  write_off_status: {
    filterFn: (item, value) => {
      if (!value) return true
      return item.write_off_status === value
    }
  },
  search: {
    filterFn: (item, value) => {
      if (!value) return true
      if (selectedEquipmentIds.value.length > 0) {
        return selectedEquipmentIds.value.includes(item.id)
      }
      const search = value.toLowerCase()
      return (
        item.name?.toLowerCase().includes(search) ||
        item.inventory_number?.toLowerCase().includes(search) ||
        item.inventory_name?.toLowerCase().includes(search)
      )
    }
  },
  tags: {
    filterFn: (item, value) => {
      if (!value || value.length === 0) return true
      return value.some(tag => (item.tags || []).includes(tag))
    }
  },
  realism_class: {
    filterFn: (item, value) => {
      if (!value) return true
      return item.realism_class?.toLowerCase().includes(value.toLowerCase())
    }
  },
  country: {
    filterFn: (item, value) => {
      if (!value) return true
      return item.country?.toLowerCase().includes(value.toLowerCase())
    }
  },
  manufacturer: {
    filterFn: (item, value) => {
      if (!value) return true
      return item.manufacturer?.toLowerCase().includes(value.toLowerCase())
    }
  },
  min_price: {
    filterFn: (item, value) => {
      if (value === null || value === undefined) return true
      return (item.price || 0) >= value
    }
  },
  max_price: {
    filterFn: (item, value) => {
      if (value === null || value === undefined) return true
      return (item.price || 0) <= value
    }
  },
  year_from: {
    filterFn: (item, value) => {
      if (value === null || value === undefined) return true
      return (item.year_of_release || 0) >= value
    }
  },
  year_to: {
    filterFn: (item, value) => {
      if (value === null || value === undefined) return true
      return (item.year_of_release || 0) <= value
    }
  }
}

// ============================================
// ВЫЧИСЛЯЕМЫЕ ДЛЯ ФИЛЬТРАЦИИ
// ============================================
const filteredEquipment = computed(() => {
  let list = []
  
  if (showArchived.value) {
    list = [...equipmentStore.archivedItems]
  } else {
    list = [...equipmentStore.items]
  }
  
  const allFilters = { ...equipmentFilters.value, ...advancedFilters.value }
  
  return list.filter(item => {
    let result = true
    for (const [key, config] of Object.entries(filterConfig)) {
      const filterValue = allFilters[key]
      if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
        if (Array.isArray(filterValue)) {
          if (filterValue.length > 0) {
            result = result && config.filterFn(item, filterValue)
          }
        } else {
          result = result && config.filterFn(item, filterValue)
        }
      }
    }
    return result
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredEquipment.value.length / pageSize.value) || 1
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredEquipment.value.slice(start, end)
})

const showPagination = computed(() => {
  return filteredEquipment.value.length > pageSize.value
})

// ============================================
// МЕТОДЫ
// ============================================
const setViewMode = (mode) => {
  equipmentViewMode.value = mode
}

const loadTags = async () => {
  try {
    const res = await equipmentApi.getTags()
    allTags.value = res.data || []
  } catch (error) {
    console.error('Ошибка загрузки тегов:', error)
  }
}

const toggleArchived = () => {
  showArchived.value = !showArchived.value
  selectedEquipmentIds.value = []
  equipmentFilters.value.search = ''
  currentPage.value = 1
}

const loadEquipment = async () => {
  loading.value = true
  try {
    await equipmentStore.fetchAll()
    await loadTags()
  } catch (error) {
    console.error('Error loading:', error)
    toast.error(error?.response?.data?.message || "Ошибка загрузки оборудования")
  } finally {
    loading.value = false
  }
}

const openCreateForm = () => {
  editingItem.value = null
  showForm.value = true
}

const openEditForm = (item) => {
  if (!item) return
  if (item.is_archived) {
    toast.warning('Нельзя редактировать архивированное оборудование')
    return
  }
  editingItem.value = item
  showForm.value = true
  if (item.id) {
    store.openEdit('equipment', item.id)
  }
}

const closeForm = () => {
  showForm.value = false
  store.closeEdit('equipment')
}

const onSaved = () => {
  closeForm()
  loadEquipment()
}

const confirmDelete = (id) => {
  deleteItemId.value = id
  showArchiveModal.value = true
}

const handleArchive = async () => {
  if (!deleteItemId.value) return

  try {
    await equipmentStore.delete(deleteItemId.value)
    await loadEquipment()
    toast.success('Оборудование отправлено в архив')
  } catch (error) {
    toast.error(error?.response?.data?.message || "Ошибка архивации")
  } finally {
    showArchiveModal.value = false
    deleteItemId.value = null
  }
}

const confirmDeletePermanent = (id) => {
  deleteItemId.value = id
  showDeletePermanentModal.value = true
}

const handleDeletePermanent = async () => {
  if (!deleteItemId.value) return

  try {
    await equipmentApi.deletePermanent(deleteItemId.value)
    await loadEquipment()
    toast.success('Оборудование удалено навсегда')
  } catch (error) {
    toast.error(error?.response?.data?.message || "Ошибка удаления")
  } finally {
    showDeletePermanentModal.value = false
    deleteItemId.value = null
  }
}

const handleRestore = async (id) => {
  try {
    await equipmentStore.restore(id)
    await loadEquipment()
    toast.success('Оборудование восстановлено из архива')
  } catch (error) {
    toast.error(error?.response?.data?.message || "Ошибка восстановления")
  }
}

const openHistoryModal = (item) => {
  if (item && item.id) {
    store.openHistory('equipment', item.id)
  }
}

const closeHistoryModal = () => {
  store.closeHistory('equipment')
}

const resetAllFilters = () => {
  store.resetFilters('equipment')
  selectedEquipmentIds.value = []
  advancedFilters.value = {
    tags: [],
    realism_class: '',
    country: '',
    manufacturer: '',
    min_price: null,
    max_price: null,
    year_from: null,
    year_to: null
  }
  currentPage.value = 1
}

const handleImportExcel = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await equipmentApi.importExcel(formData)

    if (response.data.success) {
      toast.success(`Импортировано: ${response.data.createdCount} шт.`)
      await loadEquipment()
    } else {
      toast.error(response.data.errors?.map(e => e.message).join('\n'))
    }
  } catch (error) {
    toast.error(error?.response?.data?.message || "Ошибка импорта")
  }
}

const closeExportModal = () => {
  exportModalOpen.value = false
}

const handleExportExcel = async (selectedFields) => {
  try {
    if (!selectedFields || selectedFields.length === 0) {
      toast.error('Пожалуйста, выберите хотя бы одно поле')
      return
    }

    const response = await equipmentApi.exportExcel(selectedFields)

    const binaryString = atob(response.data.data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = response.data.filename || 'equipment_export.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.success('Экспорт успешен')
    closeExportModal()
  } catch (error) {
    console.error('Ошибка экспорта:', error)
    toast.error(error?.response?.data?.message || "Ошибка экспорта")
  }
}

// ============================================
// ОТКРЫТИЕ ИЗ URL
// ============================================
const openFromUrl = async () => {
  const e = route.query.e
  const historyId = route.query.history
  
  if (e) {
    const id = parseInt(e, 10)
    if (!isNaN(id) && id > 0) {
      if (equipmentStore.allEquipment.length === 0) {
        await equipmentStore.fetchAll()
      }
      
      const item = equipmentStore.allEquipment.find(eq => eq.id === id)
      if (item) {
        if (showForm.value) {
          closeForm()
        }
        await nextTick()
        openEditForm(item)
        return true
      } else {
        toast.warning(`Оборудование с ID ${id} не найдено`)
      }
    }
  }
  
  if (historyId) {
    const id = parseInt(historyId, 10)
    if (!isNaN(id) && id > 0) {
      if (equipmentStore.allEquipment.length === 0) {
        await equipmentStore.fetchAll()
      }
      
      const item = equipmentStore.allEquipment.find(eq => eq.id === id)
      if (item) {
        if (showForm.value) {
          closeForm()
        }
        await nextTick()
        store.openHistory('equipment', id)
        return true
      } else {
        toast.warning(`Оборудование с ID ${id} не найдено для истории`)
      }
    }
  }
  
  return false
}

// ============================================
// ХОТКЕЙ ENTER
// ============================================
const handleKeydown = (e) => {
  const tag = e.target.tagName.toLowerCase()
  if (e.key === 'Enter' && tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
    e.preventDefault()
    if (showForm.value) {
      closeForm()
    } else {
      openCreateForm()
    }
  }
}

// ============================================
// WATCH (только для сброса страницы при фильтрации)
// ============================================
watch(
  [() => equipmentFilters.value.working_status, () => equipmentFilters.value.write_off_status, () => equipmentFilters.value.search],
  () => {
    if (!showArchived.value) {
      currentPage.value = 1
    }
  },
  { deep: true }
)

// ✅ WATCH для синхронизации viewMode с URL
watch(
  () => equipmentViewMode.value,
  (newMode) => {
    const query = { ...route.query }
    query.v = newMode
    router.replace({ query })
  }
)

// ✅ WATCH для восстановления viewMode из URL
watch(
  () => route.query.v,
  (newVal) => {
    if (newVal && ['cards', 'table'].includes(newVal)) {
      if (viewMode.value.equipment !== newVal) {
        viewMode.value.equipment = newVal
      }
    }
  }
)

// ============================================
// LIFECYCLE
// ============================================
onMounted(async () => {
  // ✅ Восстанавливаем viewMode из URL до загрузки
  const hasViewMode = restoreViewModeFromUrl()
  
  await loadEquipment()
  document.addEventListener('keydown', handleKeydown)
  
  // ✅ Восстанавливаем пагинацию из URL
  if (route.query.p) {
    const page = parseInt(route.query.p, 10)
    if (!isNaN(page) && page > 0) {
      currentPage.value = page
    }
  }
  
  // ✅ Если viewMode не был в URL, но есть в store — сохраняем в URL
  if (!hasViewMode && viewMode.value.equipment) {
    const query = { ...route.query, v: viewMode.value.equipment }
    router.replace({ query })
  }
  
  await openFromUrl()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})

onActivated(() => {
  loadEquipment()
})
</script>

<style scoped>
.equipment-view {
  padding: 0;
}

/* ============================================
   TOOLBAR
   ============================================ */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-left h2 .title-icon {
  width: 24px;
  height: 24px;
  stroke: #212529;
}

.toolbar-left .count {
  color: #6c757d;
  font-size: 14px;
}

.toolbar-left .archived-count {
  color: #856404;
  background: #fff3cd;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 13px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

/* ============================================
   КОНТЕНТ С САЙДБАРОМ
   ============================================ */
.content-with-sidebar {
  display: flex;
  gap: 20px;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.sidebar-filters {
  width: 280px;
  flex-shrink: 0;
}

/* ============================================
   ФИЛЬТРЫ
   ============================================ */
.filters {
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filters-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filters-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filters-row-equipment {
  margin-top: 2px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 140px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 500;
  color: #495057;
  margin: 0;
}

.filter-group .form-control,
.filter-group .form-control-sm {
  padding: 4px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  width: 100%;
  height: 32px;
  line-height: 1.4;
}

.filter-group .form-control:focus,
.filter-group .form-control-sm:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.filter-actions {
  flex: 0 0 auto;
  min-width: auto;
  justify-content: flex-end;
}

.filter-group-equipment {
  flex: 1;
  min-width: 250px;
}

/* ============================================
   MULTI SELECT
   ============================================ */
.filter-group-equipment .multi-select-wrapper {
  min-width: 200px;
}

.filter-group-equipment .multi-select-wrapper .input-wrapper input {
  padding: 4px 10px;
  height: 32px;
  font-size: 13px;
}

.filter-group-equipment .multi-select-wrapper .selected-list {
  margin-top: 4px;
}

.filter-group-equipment .multi-select-wrapper .selected-item {
  font-size: 12px;
  padding: 2px 8px;
}

/* ============================================
   САЙДБАР
   ============================================ */
.sidebar-card {
  background: white;
  border-radius: 8px;
  padding: 14px 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.sidebar-card h4 {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sidebar-card h4 .sidebar-icon {
  width: 16px;
  height: 16px;
  stroke: #212529;
}

.sidebar-filter-group {
  margin-bottom: 10px;
}

.sidebar-filter-group label {
  font-size: 12px;
  font-weight: 500;
  color: #495057;
  margin-bottom: 3px;
  display: block;
}

.sidebar-filter-group .form-control-sm {
  padding: 4px 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 13px;
  width: 100%;
  background: white;
  height: 30px;
}

.sidebar-filter-group .form-control-sm:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

/* Теги */
.tags-select {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-option {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  cursor: pointer;
  background: #f1f3f5;
  color: #495057;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.tag-option:hover {
  background: #e9ecef;
}

.tag-option.active {
  background: #e7f1ff;
  color: #0d6efd;
  border-color: #0d6efd;
}

.tag-option .tag-check {
  font-size: 10px;
}

.no-tags {
  color: #adb5bd;
  font-size: 12px;
}

/* Цена и год */
.price-inputs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.price-inputs .form-control-sm {
  flex: 1;
  min-width: 50px;
  padding: 4px 8px;
  font-size: 12px;
  height: 30px;
}

.price-separator {
  color: #6c757d;
  font-size: 12px;
}

.btn-reset {
  width: 100%;
  margin-top: 2px;
  justify-content: center;
  height: 30px;
  font-size: 12px;
  padding: 0 12px;
}

/* ============================================
   КНОПКИ
   ============================================ */
.btn {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
}

.btn .btn-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
}

.btn .badge {
  background: #dc3545;
  color: white;
  border-radius: 50%;
  padding: 0 6px;
  font-size: 11px;
  line-height: 18px;
  min-width: 18px;
  text-align: center;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 13px;
  height: 32px;
}

.btn-primary {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
}

.btn-primary:hover {
  background: #0b5ed7;
  border-color: #0a58ca;
}

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
}

.btn-outline-secondary:hover {
  background: #6c757d;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
  border-color: #ffc107;
}

.btn-warning:hover {
  background: #e0a800;
  border-color: #d39e00;
}

/* ============================================
   ОСТАЛЬНЫЕ СТИЛИ
   ============================================ */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.text-center {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}

/* ============================================
   АДАПТИВНОСТЬ
   ============================================ */
@media (max-width: 1200px) {
  .sidebar-filters {
    width: 240px;
  }
}

@media (max-width: 992px) {
  .content-with-sidebar {
    flex-direction: column;
  }
  
  .sidebar-filters {
    width: 100%;
  }
  
  .sidebar-card {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
  }
  
  .sidebar-card h4 {
    grid-column: 1 / -1;
    margin-bottom: 2px;
  }
  
  .sidebar-filter-group {
    margin-bottom: 0;
  }
  
  .btn-reset {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .filter-actions {
    flex: 1;
  }
  
  .filter-group-equipment {
    min-width: 100%;
  }
  
  .sidebar-card {
    grid-template-columns: 1fr;
  }
  
  .price-inputs {
    flex-wrap: wrap;
  }
  
  .price-inputs .form-control-sm {
    min-width: 70px;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-left {
    justify-content: center;
  }
  
  .toolbar-right {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>