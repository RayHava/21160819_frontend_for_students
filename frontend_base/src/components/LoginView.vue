<script setup>
import { computed, ref } from 'vue'
import { authApi } from '@/api/client'
import { session, startSession } from '@/auth/session'

const identifier = ref('')
const password = ref('')
const sending = ref(false)
const errorMessage = ref('')

const canSubmit = computed(() => identifier.value.trim() !== '' && password.value !== '')

async function submit() {
  if (!canSubmit.value || sending.value) return
  sending.value = true
  errorMessage.value = ''
  try {
    const { accessToken, user } = await authApi.login(identifier.value.trim(), password.value)
    startSession(accessToken, user)
  } catch (error) {
    errorMessage.value = error.message
    password.value = ''
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <main class="login">
    <form class="panel login-card" @submit.prevent="submit">
      <h1>Iniciar sesión</h1>
      <p class="muted">Usa tu nombre de usuario o tu correo.</p>

      <p v-if="errorMessage" class="alert alert-error" role="alert">{{ errorMessage }}</p>
      <p v-else-if="session.notice" class="alert alert-info" role="status">{{ session.notice }}</p>

      <div class="field">
        <label for="login-identifier">Usuario o correo</label>
        <input
          id="login-identifier"
          v-model="identifier"
          type="text"
          autocomplete="username"
          autofocus
          required
        />
      </div>

      <div class="field">
        <label for="login-password">Contraseña</label>
        <input
          id="login-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </div>

      <button type="submit" class="btn btn-primary login-submit" :disabled="!canSubmit || sending">
        {{ sending ? 'Entrando…' : 'Entrar' }}
      </button>
    </form>
  </main>
</template>
