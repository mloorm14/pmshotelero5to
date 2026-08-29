import { toDateOnly, isValidDateOnly, getTodayISO, addDaysISO } from './dates'
import { ROOM_STATUSES } from '../constants/rooms'

export const CHECKOUT_ALERT_LEVELS = {
  OVERDUE: 'overdue',
  DUE_TODAY: 'dueToday',
  DUE_SOON: 'dueSoon',
  NORMAL: 'normal',
}

// Umbral de "checkout proximo": entre manana y pasado manana inclusive
// (24-48h, en granularidad de dia calendario ya que check_out_date es DATE
// sin componente de hora). Fuera de ese rango y en el futuro se considera
// "normal"; en el pasado, "vencido"; hoy mismo, "hoy".
export function classifyCheckoutAlert(checkOutDate, todayISO = getTodayISO()) {
  if (!isValidDateOnly(checkOutDate)) return CHECKOUT_ALERT_LEVELS.NORMAL

  const checkOut = toDateOnly(checkOutDate)
  const today = toDateOnly(todayISO)
  const soonLimit = toDateOnly(addDaysISO(todayISO, 2))

  if (checkOut < today) return CHECKOUT_ALERT_LEVELS.OVERDUE
  if (checkOut.getTime() === today.getTime()) return CHECKOUT_ALERT_LEVELS.DUE_TODAY
  if (checkOut <= soonLimit) return CHECKOUT_ALERT_LEVELS.DUE_SOON
  return CHECKOUT_ALERT_LEVELS.NORMAL
}

// Habitaciones ocupadas con una estadia activa, anotadas con su nivel de
// alerta de checkout. Ignora habitaciones sin check_out_date (no debería
// ocurrir para "Ocupada", pero se tolera por robustez).
export function classifyRoomsByCheckout(rooms, todayISO = getTodayISO()) {
  return rooms
    .filter((room) => room.status === ROOM_STATUSES.OCCUPIED && room.billing?.checkOutDate)
    .map((room) => ({ room, level: classifyCheckoutAlert(room.billing.checkOutDate, todayISO) }))
    .sort((a, b) => toDateOnly(a.room.billing.checkOutDate) - toDateOnly(b.room.billing.checkOutDate))
}

const ALERT_LEVELS_COUNTED = [
  CHECKOUT_ALERT_LEVELS.OVERDUE,
  CHECKOUT_ALERT_LEVELS.DUE_TODAY,
  CHECKOUT_ALERT_LEVELS.DUE_SOON,
]

export function countCheckoutAlerts(rooms, todayISO = getTodayISO()) {
  return classifyRoomsByCheckout(rooms, todayISO).filter(({ level }) => ALERT_LEVELS_COUNTED.includes(level)).length
}
