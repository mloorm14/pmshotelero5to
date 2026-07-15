import { isRoomAvailableForCheckIn, STATUS_STYLES } from '../../constants/rooms'
import StatusBadge from '../shared/StatusBadge'

export default function RoomSelector({ rooms, selectedRoomId, onSelectRoom }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-slate-900">Habitaciones</h3>
        <p className="text-sm text-slate-500">Solo las habitaciones limpias pueden seleccionarse para check-in</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {rooms.map((room) => {
          const styles = STATUS_STYLES[room.status]
          const canSelect = isRoomAvailableForCheckIn(room.status)
          const isSelected = selectedRoomId === room.id

          return (
            <button
              key={room.id}
              type="button"
              disabled={!canSelect}
              onClick={() => canSelect && onSelectRoom(room.id)}
              className={`relative rounded-xl border-2 p-5 text-left transition-all ${styles.card} ${
                isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
              } ${canSelect ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-60'}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-800">Hab. {room.number}</span>
                {isSelected && (
                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                    Seleccionada
                  </span>
                )}
              </div>
              <StatusBadge status={room.status} />
              {!canSelect && (
                <p className="mt-3 text-xs font-medium text-rose-600">
                  No disponible para check-in
                </p>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
