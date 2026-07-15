export const RESERVATION_STATUSES = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
}

export const RESERVATION_STATUS_STYLES = {
  [RESERVATION_STATUSES.PENDING]: {
    card: 'border-amber-200 bg-amber-50',
    badge: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  [RESERVATION_STATUSES.CONFIRMED]: {
    card: 'border-emerald-200 bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
  },
  [RESERVATION_STATUSES.CANCELLED]: {
    card: 'border-rose-200 bg-rose-50',
    badge: 'bg-rose-100 text-rose-800',
    dot: 'bg-rose-500',
  },
}
