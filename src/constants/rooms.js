export const ROOM_STATUSES = {
  CLEAN: 'Limpia',
  DIRTY: 'Sucia',
  OCCUPIED: 'Ocupada',
  MAINTENANCE: 'En Mantenimiento',
}

export const INITIAL_ROOMS = [
  { id: 1, number: '101', status: ROOM_STATUSES.CLEAN, guest: null, billing: null },
  { id: 2, number: '102', status: ROOM_STATUSES.CLEAN, guest: null, billing: null },
  { id: 3, number: '201', status: ROOM_STATUSES.DIRTY, guest: null, billing: null },
  { id: 4, number: '202', status: ROOM_STATUSES.MAINTENANCE, guest: null, billing: null },
]

// Paleta clara con acento carmesi/vino. Semantica de estado: verde=disponible/
// exito, ambar=advertencia, rojo=error/ocupado. Mantenimiento usa un tono rose
// distinto del rojo de "Ocupada" para no confundir ambos estados de alerta.
export const STATUS_STYLES = {
  [ROOM_STATUSES.CLEAN]: {
    card: 'border-emerald-300 bg-emerald-50',
    badge: 'border border-emerald-200 bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
  },
  [ROOM_STATUSES.DIRTY]: {
    card: 'border-amber-300 bg-amber-50',
    badge: 'border border-amber-200 bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  [ROOM_STATUSES.OCCUPIED]: {
    card: 'border-red-300 bg-red-50',
    badge: 'border border-red-200 bg-red-100 text-red-800',
    dot: 'bg-red-500',
  },
  [ROOM_STATUSES.MAINTENANCE]: {
    card: 'border-rose-300 bg-rose-50',
    badge: 'border border-rose-200 bg-rose-100 text-rose-800',
    dot: 'bg-rose-500',
  },
}

export function isRoomAvailableForCheckIn(status) {
  return status === ROOM_STATUSES.CLEAN
}
