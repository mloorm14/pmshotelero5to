import { toDateOnly, isValidDateOnly, validateDateRange, isPastDate } from './dates'
import { validateDocumentId, validatePhone } from './validation'
import { RESERVATION_STATUSES } from '../constants/reservations'

export { validateDateRange, isPastDate }

export function hasDateOverlap(reservations, roomId, checkInDate, checkOutDate, excludeReservationId = null) {
  if (!isValidDateOnly(checkInDate) || !isValidDateOnly(checkOutDate)) return false

  const start = toDateOnly(checkInDate)
  const end = toDateOnly(checkOutDate)

  return reservations
    .filter((reservation) => reservation.roomId === roomId)
    .filter((reservation) => reservation.status !== RESERVATION_STATUSES.CANCELLED)
    .filter((reservation) => reservation.id !== excludeReservationId)
    .some((reservation) => {
      const existingStart = toDateOnly(reservation.checkInDate)
      const existingEnd = toDateOnly(reservation.checkOutDate)
      return start < existingEnd && existingStart < end
    })
}

export function validateReservation(
  { roomId, guestName, checkInDate, checkOutDate, guestDocument, guestPhone },
  existingReservations = [],
  excludeReservationId = null,
) {
  const errors = {}

  if (!roomId) {
    errors.roomId = 'Debe seleccionar una habitación'
  }
  if (!guestName || guestName.trim() === '') {
    errors.guestName = 'El nombre del huésped es obligatorio'
  }

  const rangeValidation = validateDateRange(checkInDate, checkOutDate)
  if (!rangeValidation.valid) {
    errors.checkOutDate = rangeValidation.error
  } else if (isPastDate(checkInDate)) {
    errors.checkInDate = 'La fecha de llegada no puede ser anterior a hoy'
  } else if (roomId && hasDateOverlap(existingReservations, roomId, checkInDate, checkOutDate, excludeReservationId)) {
    errors.checkInDate = 'Ya existe una reserva activa para esta habitación en ese rango de fechas'
  }

  // Documento/teléfono son opcionales en una reserva (a veces no se tienen a
  // mano al reservar) — solo se valida el formato si el usuario sí escribió
  // algo, reutilizando las mismas reglas que el check-in.
  if (guestDocument && guestDocument.trim() !== '') {
    const documentValidation = validateDocumentId(guestDocument)
    if (!documentValidation.valid) errors.guestDocument = documentValidation.error
  }
  if (guestPhone && guestPhone.trim() !== '') {
    const phoneValidation = validatePhone(guestPhone)
    if (!phoneValidation.valid) errors.guestPhone = phoneValidation.error
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
