import { reactive } from 'vue'

// Guardamos el token en sessionStorage: se borra al cerrar la pestaña.
const STORAGE_KEY = 'accessToken'

function readToken() {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeToken(token) {
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Sin almacenamiento la sesión dura hasta recargar la página.
  }
}

export const session = reactive({
  token: readToken(),
  user: null,
  notice: '', // Mensaje para la pantalla de login, p. ej. "tu sesión expiró".
})

let expiryTimer

// Lee la fecha de expiración (exp) del JWT. Solo sirve para cerrar la sesión
// a tiempo en la vista; quien valida el token es el backend.
function tokenExpiresAt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload))
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

function scheduleExpiry(token) {
  clearTimeout(expiryTimer)
  const expiresAt = tokenExpiresAt(token)
  if (expiresAt) {
    expiryTimer = setTimeout(
      () => endSession('Tu sesión expiró. Inicia sesión de nuevo.'),
      Math.max(expiresAt - Date.now(), 0),
    )
  }
}

export function startSession(token, user) {
  session.token = token
  session.user = user
  session.notice = ''
  writeToken(token)
  scheduleExpiry(token)
}

export function setUser(user) {
  session.user = user
  scheduleExpiry(session.token)
}

export function endSession(notice = '') {
  clearTimeout(expiryTimer)
  session.token = null
  session.user = null
  session.notice = notice
  writeToken(null)
}
