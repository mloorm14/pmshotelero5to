const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new Error('No se pudo conectar con la API. ¿Está el backend corriendo?')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status} al conectar con la API`)
  }

  if (res.status === 204) return null
  return res.json()
}

function toQueryString(params = {}) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
  return query ? `?${query}` : ''
}

export const api = {
  getRooms: () => request('/rooms'),
  updateRoom: (id, patch) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),

  getReservations: () => request('/reservations'),
  addReservation: (payload) => request('/reservations', { method: 'POST', body: JSON.stringify(payload) }),
  updateReservation: (id, patch) => request(`/reservations/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),

  checkIn: (payload) => request('/checkin', { method: 'POST', body: JSON.stringify(payload) }),
  checkOut: (payload) => request('/checkout', { method: 'POST', body: JSON.stringify(payload) }),

  getHistory: (filters) => request(`/history${toQueryString(filters)}`),
}
