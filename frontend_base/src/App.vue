<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { authApi } from '@/api/client'
import { endSession, session, setUser } from '@/auth/session'
import CrudView from '@/components/CrudView.vue'
import LoginView from '@/components/LoginView.vue'
import { RESOURCES } from '@/resources'

function sectionFromHash() {
  const section = location.hash.slice(1)
  return Object.hasOwn(RESOURCES, section) ? section : 'roles'
}

const section = ref(sectionFromHash())
const resource = computed(() => RESOURCES[section.value])
const isAdmin = computed(() => session.user?.role === 'admin')

function onHashChange() {
  section.value = sectionFromHash()
}

window.addEventListener('hashchange', onHashChange)
onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange))

// Si quedó un token guardado, el backend confirma si sigue siendo válido.
const checking = ref(Boolean(session.token))

onMounted(async () => {
  if (!session.token) return
  try {
    setUser(await authApi.me())
  } catch (error) {
    // Un 401 ya cerró la sesión; otro error (backend apagado) también la cierra.
    if (session.token) endSession(error.message)
  } finally {
    checking.value = false
  }
})

function logout() {
  endSession('Cerraste sesión.')
}
</script>

<template>
  <p v-if="checking" class="empty-state" role="status">Verificando sesión…</p>

  <LoginView v-else-if="!session.user" />

  <div v-else class="page">
    <div class="topbar">
      <nav v-if="isAdmin" class="nav" aria-label="Secciones">
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

      <div class="user-menu">
        <span class="muted">
          {{ session.user.username }} · <span class="user-role">{{ session.user.role }}</span>
        </span>
        <button type="button" class="btn btn-small" @click="logout">Cerrar sesión</button>
      </div>
    </div>

    <CrudView v-if="isAdmin" :key="section" :resource="resource" />
    <main v-else class="panel">
      <p class="empty-state">Usted es un usuario normal.</p>
    </main>
  </div>
</template>
