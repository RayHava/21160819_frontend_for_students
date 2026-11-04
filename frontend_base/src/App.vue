<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import CrudView from '@/components/CrudView.vue'
import { RESOURCES } from '@/resources'

function sectionFromHash() {
  const section = location.hash.slice(1)
  return Object.hasOwn(RESOURCES, section) ? section : 'roles'
}

const section = ref(sectionFromHash())
const resource = computed(() => RESOURCES[section.value])

function onHashChange() {
  section.value = sectionFromHash()
}

window.addEventListener('hashchange', onHashChange)
onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange))
</script>

<template>
  <div class="page">
    <nav class="nav" aria-label="Secciones">
      <a
        v-for="(item, key) in RESOURCES"
        :key="key"
        :href="`#${key}`"
        class="nav-link"
        :aria-current="section === key ? 'page' : undefined"
      >
        {{ item.label }}
      </a>
    </nav>

    <CrudView :key="section" :resource="resource" />
  </div>
</template>
