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

// Paleta oscura carmesi/vino. Semantica de estado: verde=disponible/exito,
// ambar=advertencia, rojo=error/ocupado. Mantenimiento usa un tono rose
// distinto del rojo de "Ocupada" para no confundir ambos estados de alerta.
export const STATUS_STYLES = {
  [ROOM_STATUSES.CLEAN]: {
    card: 'border-emerald-800 bg-emerald-950/30',
    badge: 'border border-emerald-800 bg-emerald-950 text-emerald-300',
    dot: 'bg-emerald-500',
  },
  [ROOM_STATUSES.DIRTY]: {
    card: 'border-amber-800 bg-amber-950/30',
    badge: 'border border-amber-800 bg-amber-950 text-amber-300',
    dot: 'bg-amber-500',
  },
  [ROOM_STATUSES.OCCUPIED]: {
    card: 'border-red-800 bg-red-950/30',
    badge: 'border border-red-800 bg-red-950 text-red-300',
    dot: 'bg-red-500',
  },
  [ROOM_STATUSES.MAINTENANCE]: {
    card: 'border-rose-800 bg-rose-950/30',
    badge: 'border border-rose-800 bg-rose-950 text-rose-300',
    dot: 'bg-rose-500',
  },
}

export function isRoomAvailableForCheckIn(status) {
  return status === ROOM_STATUSES.CLEAN
}
