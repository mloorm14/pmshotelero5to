export const RESERVATION_STATUSES = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
}

export const RESERVATION_STATUS_STYLES = {
  [RESERVATION_STATUSES.PENDING]: {
    card: 'border-amber-300 bg-amber-50',
    badge: 'border border-amber-200 bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  [RESERVATION_STATUSES.CONFIRMED]: {
    card: 'border-emerald-300 bg-emerald-50',
    badge: 'border border-emerald-200 bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
  },
  [RESERVATION_STATUSES.CANCELLED]: {
    card: 'border-rose-300 bg-rose-50',
    badge: 'border border-rose-200 bg-rose-100 text-rose-800',
    dot: 'bg-rose-500',
  },
}
