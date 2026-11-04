<script setup>
import { onMounted, ref, useId } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const titleId = useId()
const dialog = ref(null)

onMounted(() => dialog.value.showModal())

function preventCloseWhileBusy(event) {
  if (props.busy) event.preventDefault()
}

defineExpose({ close: () => dialog.value.close() })
</script>

<template>
  <dialog
    ref="dialog"
    class="dialog"
    :aria-labelledby="titleId"
    @cancel="preventCloseWhileBusy"
    @close="emit('close')"
  >
    <h2 :id="titleId" class="dialog-title">{{ title }}</h2>
    <slot />
  </dialog>
</template>
