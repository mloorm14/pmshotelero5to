const SESSION_STORAGE_KEY = 'pms-hotelero-session'

// session = { userId, fullName, username, role } — se guarda el objeto
// completo (no solo el id) para no tener que volver a pedirlo a la API en
// cada carga. Se revalida igual contra la lista de usuarios activos al
// montar la app (ver src/App.jsx) por si el usuario fue desactivado entre
// sesiones.
export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(session) {
  if (session) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}
