<script setup>
import { ref } from 'vue'
import BaseDialog from './BaseDialog.vue'

const props = defineProps({
  resource: { type: Object, required: true },
  row: { type: Object, required: true },
})
const emit = defineEmits(['deleted', 'missing', 'close'])

const dialog = ref(null)
const deleting = ref(false)
const errorMessage = ref('')

async function confirmDelete() {
  if (deleting.value) return
  deleting.value = true
  errorMessage.value = ''
  try {
    const result = await props.resource.api.remove(props.row.id)
    emit('deleted', result)
    deleting.value = false
    dialog.value.close()
  } catch (error) {
    deleting.value = false
    errorMessage.value = error.message
    if (error.status === 404) emit('missing')
  }
}
</script>

<template>
  <BaseDialog
    ref="dialog"
    :title="`Eliminar ${resource.singular}`"
    :busy="deleting"
    @close="emit('close')"
  >
    <p>
      ¿Seguro que quieres eliminar el {{ resource.singular }}
      <strong>{{ resource.displayName(row) }}</strong>?
    </p>
    <p class="muted">Esta acción no se puede deshacer.</p>

    <p v-if="errorMessage" class="alert alert-error" role="alert">{{ errorMessage }}</p>

    <div class="dialog-actions">
      <button type="button" class="btn" :disabled="deleting" @click="dialog.close()">
        Cancelar
      </button>
      <button type="button" class="btn btn-danger" :disabled="deleting" @click="confirmDelete">
        {{ deleting ? 'Eliminando…' : 'Eliminar' }}
      </button>
    </div>
  </BaseDialog>
</template>
