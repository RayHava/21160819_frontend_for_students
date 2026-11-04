const API_URL = import.meta.env.VITE_API_URL || '/api/v2'
const CONNECTION_ERROR =
  'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(url, { method = 'GET', data } = {}) {
  let response
  try {
    response = await fetch(url, {
      method,
      headers: data ? { 'Content-Type': 'application/json' } : undefined,
      body: data ? JSON.stringify(data) : undefined,
    })
  } catch {
    throw new ApiError(CONNECTION_ERROR, 0)
  }

  // Si el backend está apagado, el proxy de Vite responde sin un cuerpo JSON.
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(body?.message || CONNECTION_ERROR, response.status)
  }
  return body
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
