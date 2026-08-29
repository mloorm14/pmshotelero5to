// Reglas de negocio del CRUD de habitaciones (alta/edición). No confundir
// con `constants/rooms.js`, que solo define estados y estilos visuales.

export function validateRoomNumber(number, existingRooms = [], excludeRoomId = null) {
  const trimmed = (number ?? '').trim()

  if (trimmed === '') {
    return { valid: false, error: 'El número de habitación es obligatorio' }
  }

  const isDuplicate = existingRooms.some(
    (room) => room.id !== excludeRoomId && room.number.trim().toLowerCase() === trimmed.toLowerCase(),
  )
  if (isDuplicate) {
    return { valid: false, error: 'Ya existe una habitación con ese número' }
  }

  return { valid: true, error: null }
}

export function isCapacityValid(capacity) {
  return Number.isInteger(capacity) && capacity >= 1
}

export function isDefaultRateValid(defaultRate) {
  return Number.isFinite(defaultRate) && defaultRate > 0
}

export function validateRoom({ number, capacity, defaultRate }, existingRooms = [], excludeRoomId = null) {
  const errors = {}

  const numberValidation = validateRoomNumber(number, existingRooms, excludeRoomId)
  if (!numberValidation.valid) errors.number = numberValidation.error

  if (!isCapacityValid(capacity)) {
    errors.capacity = 'La capacidad debe ser un número entero positivo'
  }
  if (!isDefaultRateValid(defaultRate)) {
    errors.defaultRate = 'La tarifa por defecto debe ser mayor a cero'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
