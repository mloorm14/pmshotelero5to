const ROLE_STORAGE_KEY = 'pms-hotelero-role'

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
