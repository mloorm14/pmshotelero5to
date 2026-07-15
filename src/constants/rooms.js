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

export const STATUS_STYLES = {
  [ROOM_STATUSES.CLEAN]: {
    card: 'border-emerald-200 bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
  },
  [ROOM_STATUSES.DIRTY]: {
    card: 'border-amber-200 bg-amber-50',
    badge: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
  },
  [ROOM_STATUSES.OCCUPIED]: {
    card: 'border-indigo-200 bg-indigo-50',
    badge: 'bg-indigo-100 text-indigo-800',
    dot: 'bg-indigo-500',
  },
  [ROOM_STATUSES.MAINTENANCE]: {
    card: 'border-rose-200 bg-rose-50',
    badge: 'bg-rose-100 text-rose-800',
    dot: 'bg-rose-500',
  },
}

export function isRoomAvailableForCheckIn(status) {
  return status === ROOM_STATUSES.CLEAN
}
