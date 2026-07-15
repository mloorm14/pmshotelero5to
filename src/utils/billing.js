import { toDateOnly, isValidDateOnly } from './dates'

export function calculateNights(checkInDate, checkOutDate) {
  if (!isValidDateOnly(checkInDate) || !isValidDateOnly(checkOutDate)) return 0

  const start = toDateOnly(checkInDate)
  const end = toDateOnly(checkOutDate)
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24))

  return diffDays > 0 ? diffDays : 0
}

export function isNightsValid(nights) {
  return Number.isInteger(nights) && nights >= 1
}

export function calculateTotal(baseRate, nights, discount) {
  const rate = Number(baseRate) || 0
  const n = Number(nights) || 0
  const disc = Number(discount) || 0
  return rate * n - disc
}

export function isTotalValid(total) {
  return Number(total) > 0
}
