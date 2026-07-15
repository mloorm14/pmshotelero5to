const STORAGE_KEY = 'pms-hotelero-state'
const ROLE_STORAGE_KEY = 'pms-hotelero-role'

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function loadRole() {
  try {
    return localStorage.getItem(ROLE_STORAGE_KEY)
  } catch {
    return null
  }
}

export function saveRole(role) {
  localStorage.setItem(ROLE_STORAGE_KEY, role)
}
