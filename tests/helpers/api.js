// Helpers que pegan directo a la API (no a la UI) para montar el estado
// previo de cada caso (habitación en tal estado, estadía ya iniciada, etc.).
// La acción bajo prueba de cada test siempre pasa por la UI — esto solo
// evita depender del orden de ejecución de otros archivos de test.

const API_URL = 'http://localhost:3001/api'

export async function getUserIdByName(request, fullName) {
  const res = await request.get(`${API_URL}/users`)
  const users = await res.json()
  const user = users.find((u) => u.fullName === fullName)
  if (!user) throw new Error(`Usuario semilla "${fullName}" no encontrado — ¿se corrió npm run migrate?`)
  return user.id
}

// Deja una habitación en un estado conocido sin pasar por check-in/check-out
// reales — limpia huésped/facturación al mismo tiempo para que no queden
// datos de una estadía anterior a medio cerrar.
export async function setRoomStatus(request, roomId, status) {
  const res = await request.put(`${API_URL}/rooms/${roomId}`, {
    data: { status, guest: null, billing: null },
  })
  if (!res.ok()) throw new Error(`No se pudo poner la habitación ${roomId} en estado "${status}": ${await res.text()}`)
}

// Monta una estadía activa (check-in) directo por API, para casos donde lo
// que se prueba es lo que pasa DESPUÉS del check-in (checkout, minibar), no
// el check-in en sí (eso ya lo cubre TC-01).
export async function apiCheckIn(request, { roomId, guest, billing, userId }) {
  const res = await request.post(`${API_URL}/checkin`, { data: { roomId, guest, billing, userId } })
  if (!res.ok()) throw new Error(`apiCheckIn falló para la habitación ${roomId}: ${await res.text()}`)
  return res.json()
}
