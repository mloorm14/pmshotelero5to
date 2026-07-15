export function toDateOnly(dateString) {
  if (!dateString) return new Date(Number.NaN)
  const [year, month, day] = String(dateString).split('-').map(Number)
  if (!year || !month || !day) return new Date(Number.NaN)
  return new Date(year, month - 1, day)
}

export function isValidDateOnly(dateString) {
  return !Number.isNaN(toDateOnly(dateString).getTime())
}

function formatDateOnly(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getTodayISO() {
  return formatDateOnly(new Date())
}

export function addDaysISO(dateISO, days) {
  const date = toDateOnly(dateISO)
  date.setDate(date.getDate() + days)
  return formatDateOnly(date)
}

export function validateDateRange(checkInDate, checkOutDate) {
  if (!checkInDate || !checkOutDate) {
    return { valid: false, error: 'Debe ingresar la fecha de llegada y la fecha de salida' }
  }
  if (!isValidDateOnly(checkInDate) || !isValidDateOnly(checkOutDate)) {
    return { valid: false, error: 'Las fechas ingresadas no son válidas' }
  }

  const start = toDateOnly(checkInDate)
  const end = toDateOnly(checkOutDate)

  if (end <= start) {
    return {
      valid: false,
      error: 'La fecha de salida debe ser posterior a la fecha de llegada (mínimo 1 noche)',
    }
  }

  return { valid: true, error: null }
}

export function isPastDate(dateISO, todayISO = getTodayISO()) {
  if (!isValidDateOnly(dateISO)) return false
  return toDateOnly(dateISO) < toDateOnly(todayISO)
}
