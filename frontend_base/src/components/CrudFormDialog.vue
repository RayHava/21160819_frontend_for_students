<script setup>
import { computed, reactive, ref } from 'vue'
import BaseDialog from './BaseDialog.vue'

const props = defineProps({
  resource: { type: Object, required: true },
  row: { type: Object, default: null },
  lookups: { type: Object, required: true },
})
const emit = defineEmits(['saved', 'missing', 'close'])

const dialog = ref(null)
const saving = ref(false)
const errorMessage = ref('')

const fields = computed(() =>
  props.resource.fields.filter((field) => props.row || !field.editOnly),
)

const values = reactive(
  Object.fromEntries(
    props.resource.fields.map((field) => [
      field.key,
      props.row?.[field.key] ?? (field.type === 'checkbox' ? true : ''),
    ]),
  ),
)

function isRequired(field) {
  return field.required === true || (field.required === 'create' && !props.row)
}

const isEmpty = (value) => typeof value === 'string' && !value.trim()

const canSave = computed(() =>
  fields.value.every((field) => !isRequired(field) || !isEmpty(values[field.key])),
)

function buildPayload() {
  const payload = {}
  for (const field of fields.value) {
    const value = values[field.key]
    if (isEmpty(value)) {
      if (field.whenEmpty !== 'omit') payload[field.key] = null
    } else if (typeof value === 'string' && field.type !== 'password') {
      payload[field.key] = value.trim()
    } else {
      payload[field.key] = value
    }
  }
  return payload
}

async function submit() {
  if (saving.value || !canSave.value) return
  errorMessage.value = ''
  saving.value = true
  try {
    const { api } = props.resource
    const payload = buildPayload()
    const result = props.row
      ? await api.update(props.row.id, payload)
      : await api.create(payload)
    emit('saved', result)
    saving.value = false
    dialog.value.close()
  } catch (error) {
    saving.value = false
    errorMessage.value = error.message
    if (error.status === 404) emit('missing')
  }
}
</script>

<template>
  <BaseDialog
    ref="dialog"
    :title="row ? `Editar ${resource.singular} #${row.id}` : `Nuevo ${resource.singular}`"
    :busy="saving"
    @close="emit('close')"
  >
    <form novalidate @submit.prevent="submit">
      <template v-for="field in fields" :key="field.key">
        <label v-if="field.type === 'checkbox'" class="field-checkbox">
          <input v-model="values[field.key]" type="checkbox" />
          {{ field.label }}
        </label>

        <div v-else class="field">
          <label :for="`field-${field.key}`">
            {{ field.label }}
            <span v-if="!isRequired(field)" class="optional">(opcional)</span>
          </label>

          <textarea
            v-if="field.type === 'textarea'"
            :id="`field-${field.key}`"
            v-model="values[field.key]"
            rows="3"
          ></textarea>

          <select
            v-else-if="field.type === 'select'"
            :id="`field-${field.key}`"
            v-model="values[field.key]"
          >
            <option value="" disabled>Selecciona una opción</option>
            <option
              v-for="option in field.options(lookups)"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>

          <input
            v-else
            :id="`field-${field.key}`"
            v-model="values[field.key]"
            :type="field.type ?? 'text'"
            :autocomplete="field.type === 'password' ? 'new-password' : 'off'"
          />

          <p v-if="row && field.editHint" class="field-hint">{{ field.editHint }}</p>
          <p
            v-if="field.emptyHint && field.options(lookups).length === 0"
            class="field-hint"
          >
            {{ field.emptyHint }}
          </p>
        </div>
      </template>

      <p v-if="errorMessage" class="alert alert-error" role="alert">{{ errorMessage }}</p>

      <div class="dialog-actions">
        <button type="button" class="btn" :disabled="saving" @click="dialog.close()">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" :disabled="saving || !canSave">
          {{ saving ? 'Guardando…' : 'Guardar' }}
        </button>
      </div>
    </form>
  </BaseDialog>
</template>
