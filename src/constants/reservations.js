export const RESERVATION_STATUSES = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Finalizada',
  CANCELLED: 'Cancelada',
}

// Ciclo de vida: Pendiente -> Confirmada -> En curso (check-in) -> Finalizada
// (check-out). Pendiente/Confirmada también pueden ir a Cancelada; En curso y
// Finalizada ya no admiten cancelación (la estadía ya inició o ya cerró).
export const ACTIVE_RESERVATION_STATUSES = [
  RESERVATION_STATUSES.PENDING,
  RESERVATION_STATUSES.CONFIRMED,
  RESERVATION_STATUSES.IN_PROGRESS,
]

export const HISTORY_RESERVATION_STATUSES = [
  RESERVATION_STATUSES.COMPLETED,
  RESERVATION_STATUSES.CANCELLED,
]

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
  [RESERVATION_STATUSES.IN_PROGRESS]: {
    card: 'border-wine-300 bg-wine-50',
    badge: 'border border-wine-200 bg-wine-100 text-wine-800',
    dot: 'bg-wine-500',
  },
  [RESERVATION_STATUSES.COMPLETED]: {
    card: 'border-ink-300 bg-ink-50',
    badge: 'border border-ink-200 bg-ink-100 text-ink-700',
    dot: 'bg-ink-400',
  },
  [RESERVATION_STATUSES.CANCELLED]: {
    card: 'border-rose-300 bg-rose-50',
    badge: 'border border-rose-200 bg-rose-100 text-rose-800',
    dot: 'bg-rose-500',
  },
}
