export const RESERVATION_STATUSES = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
}

export const RESERVATION_STATUS_STYLES = {
  [RESERVATION_STATUSES.PENDING]: {
    card: 'border-amber-800 bg-amber-950/30',
    badge: 'border border-amber-800 bg-amber-950 text-amber-300',
    dot: 'bg-amber-500',
  },
  [RESERVATION_STATUSES.CONFIRMED]: {
    card: 'border-emerald-800 bg-emerald-950/30',
    badge: 'border border-emerald-800 bg-emerald-950 text-emerald-300',
    dot: 'bg-emerald-500',
  },
  [RESERVATION_STATUSES.CANCELLED]: {
    card: 'border-rose-800 bg-rose-950/30',
    badge: 'border border-rose-800 bg-rose-950 text-rose-300',
    dot: 'bg-rose-500',
  },
}
