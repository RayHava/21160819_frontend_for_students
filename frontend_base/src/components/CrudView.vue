<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import CrudDeleteDialog from './CrudDeleteDialog.vue'
import CrudFormDialog from './CrudFormDialog.vue'
import CrudTable from './CrudTable.vue'

const props = defineProps({
  resource: { type: Object, required: true },
})

// Listado
const rows = ref([])
const lookups = ref({})
const loading = ref(true)
const loadError = ref('')
let lastRequest = 0

async function load() {
  const request = ++lastRequest
  loading.value = true
  try {
    const lookupNames = Object.keys(props.resource.lookups)
    const [data, ...lists] = await Promise.all([
      props.resource.api.list(),
      ...lookupNames.map((name) => props.resource.lookups[name]()),
    ])
    if (request !== lastRequest) return
    lookups.value = Object.fromEntries(lookupNames.map((name, index) => [name, lists[index]]))
    rows.value = data
    loadError.value = ''
  } catch (error) {
    if (request === lastRequest) loadError.value = error.message
  } finally {
    if (request === lastRequest) loading.value = false
  }
}

onMounted(load)

const countLabel = computed(() => {
  const { singular, plural } = props.resource
  return `${rows.value.length} ${rows.value.length === 1 ? singular : plural}`
})

// Búsqueda: vacía muestra todos; con comas se buscan varios a la vez.
const search = ref('')

function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

const searchTerms = computed(() =>
  normalize(search.value)
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean),
)

function cellText(row, column) {
  return column.value ? column.value(row, lookups.value) : row[column.key]
}

function matches(row, term) {
  return props.resource.columns.some((column) =>
    column.key === 'id'
      ? String(row.id) === term
      : normalize(cellText(row, column)).includes(term),
  )
}

const visibleRows = computed(() => {
  if (searchTerms.value.length === 0) return rows.value
  return rows.value.filter((row) => searchTerms.value.some((term) => matches(row, term)))
})

// Crear, editar y eliminar
const formDialog = ref(null) // { row: objeto | null }
const rowToDelete = ref(null)

function onChanged({ message }) {
  showToast(message)
  load()
}

// Avisos
const toast = ref('')
let toastTimer

function showToast(message) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 4000)
}

onBeforeUnmount(() => clearTimeout(toastTimer))
</script>

<template>
  <header class="page-header">
    <div>
      <h1>{{ resource.label }}</h1>
      <p class="muted">{{ countLabel }}</p>
    </div>
    <button type="button" class="btn btn-primary" @click="formDialog = { row: null }">
      Nuevo {{ resource.singular }}
    </button>
  </header>

  <main class="panel">
    <div v-if="loadError" class="alert alert-error alert-row" role="alert">
      <span>{{ loadError }}</span>
      <button type="button" class="btn btn-small" @click="load">Reintentar</button>
    </div>

    <p v-if="loading && rows.length === 0" class="empty-state" role="status">
      Cargando {{ resource.plural }}…
    </p>

    <p v-else-if="rows.length === 0 && !loadError" class="empty-state">
      Aún no hay {{ resource.plural }}. Crea el primero con «Nuevo {{ resource.singular }}».
    </p>

    <template v-else-if="rows.length > 0">
      <div class="field">
        <label for="search">Buscar {{ resource.singular }}</label>
        <input
          id="search"
          v-model="search"
          type="search"
          autocomplete="off"
          placeholder="Escribe un ID o cualquier dato"
          aria-describedby="search-hint"
        />
        <p id="search-hint" class="field-hint" role="status">
          <template v-if="searchTerms.length > 0">
            {{ visibleRows.length }} de {{ rows.length }} {{ resource.plural }}
          </template>
          <template v-else>Separa con comas para buscar varios.</template>
        </p>
      </div>

      <CrudTable
        v-if="visibleRows.length > 0"
        :resource="resource"
        :rows="visibleRows"
        :cell-text="cellText"
        @edit="formDialog = { row: $event }"
        @delete="rowToDelete = $event"
      />
      <p v-else class="empty-state">Ningún resultado para «{{ search.trim() }}».</p>
    </template>
  </main>

  <CrudFormDialog
    v-if="formDialog"
    :resource="resource"
    :row="formDialog.row"
    :lookups="lookups"
    @saved="onChanged"
    @missing="load"
    @close="formDialog = null"
  />
  <CrudDeleteDialog
    v-if="rowToDelete"
    :resource="resource"
    :row="rowToDelete"
    @deleted="onChanged"
    @missing="load"
    @close="rowToDelete = null"
  />

  <p class="toast" :class="{ 'toast-visible': toast }" role="status">{{ toast }}</p>
</template>
