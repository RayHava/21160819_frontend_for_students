<script setup>
defineProps({
  resource: { type: Object, required: true },
  rows: { type: Array, required: true },
  cellText: { type: Function, required: true },
})
defineEmits(['edit', 'delete'])
</script>

<template>
  <table class="data-table">
    <thead>
      <tr>
        <th v-for="column in resource.columns" :key="column.key" scope="col">
          {{ column.label }}
        </th>
        <th scope="col"><span class="visually-hidden">Acciones</span></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.id">
        <td
          v-for="column in resource.columns"
          :key="column.key"
          :data-label="column.label"
          :class="{
            'cell-id': column.key === 'id',
            'cell-strong': column.strong,
            'cell-wrap': column.wrap,
            'cell-nowrap': column.nowrap,
          }"
        >
          <span v-if="cellText(row, column)">{{ cellText(row, column) }}</span>
          <span v-else class="muted">{{ column.empty ?? '—' }}</span>
        </td>
        <td>
          <div class="row-actions">
            <button
              type="button"
              class="btn btn-small"
              :aria-label="`Editar ${resource.displayName(row)}`"
              @click="$emit('edit', row)"
            >
              Editar
            </button>
            <button
              type="button"
              class="btn btn-small btn-danger-outline"
              :aria-label="`Eliminar ${resource.displayName(row)}`"
              @click="$emit('delete', row)"
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
