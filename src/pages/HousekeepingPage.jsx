import { ROOM_STATUSES, STATUS_STYLES } from '../constants/rooms'
import StatusBadge from '../components/shared/StatusBadge'

export default function HousekeepingPage({ rooms, onMarkAsClean, onToggleMaintenance }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {rooms.map((room) => {
        const styles = STATUS_STYLES[room.status]
        const isDirty = room.status === ROOM_STATUSES.DIRTY
        const isMaintenance = room.status === ROOM_STATUSES.MAINTENANCE

        return (
          <article
            key={room.id}
            className={`rounded-2xl border-2 bg-white p-6 shadow-sm ${styles.card}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Hab. {room.number}</h3>
              <StatusBadge status={room.status} />
            </div>

            <div className="flex flex-wrap gap-2">
              {isDirty && (
                <button
                  type="button"
                  onClick={() => onMarkAsClean(room.id)}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white"
                >
                  Marcar como Limpia
                </button>
              )}

              <button
                type="button"
                onClick={() => onToggleMaintenance(room.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${
                  isMaintenance
                    ? 'bg-emerald-700 text-white hover:bg-emerald-800 focus:ring-emerald-500'
                    : 'bg-rose-700 text-white hover:bg-rose-800 focus:ring-rose-500'
                }`}
              >
                {isMaintenance ? 'Finalizar Mantenimiento' : 'Enviar a Mantenimiento'}
              </button>
            </div>

            {room.status === ROOM_STATUSES.OCCUPIED && (
              <p className="mt-3 text-xs text-red-700">
                Habitación ocupada — el estado cambiará al procesar el check-out.
              </p>
            )}
          </article>
        )
      })}
    </div>
  )
}
