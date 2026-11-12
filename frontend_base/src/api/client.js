import { endSession, session } from '@/auth/session'

const API_URL = import.meta.env.VITE_API_URL || '/api/v2'
const AUTH_URL = import.meta.env.VITE_AUTH_URL || '/api/v1/auth'
const CONNECTION_ERROR =
  'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(url, { method = 'GET', data, token = session.token } = {}) {
  const headers = {}
  if (data) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })
  } catch {
    throw new ApiError(CONNECTION_ERROR, 0)
  }

  // Si el backend está apagado, el proxy de Vite responde sin un cuerpo JSON.
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body?.message || CONNECTION_ERROR
    // Un 401 con token significa que la sesión ya no es válida: volvemos al login.
    if (response.status === 401 && token) endSession(message)
    throw new ApiError(message, response.status)
  }
  return body
}

export const authApi = {
  // Devuelve { accessToken, tokenType, expiresIn, user }.
  login: (identifier, password) =>
    request(`${AUTH_URL}/login`, {
      method: 'POST',
      data: { identifier, password },
      token: null,
    }),
  me: async () => (await request(`${AUTH_URL}/me`)).data,
}

export function createResourceApi(path) {
  const url = `${API_URL}/${path}`
  return {
    list: async () => (await request(url)).data,
    create: (data) => request(url, { method: 'POST', data }),
    update: (id, data) => request(`${url}/${id}`, { method: 'PUT', data }),
    remove: (id) => request(`${url}/${id}`, { method: 'DELETE' }),
  }
}
