import { ROOM_STATUSES } from '../constants/rooms'
import StatusBadge from '../components/shared/StatusBadge'

export default function CheckoutPage({ rooms, onCheckOut }) {
  const occupiedRooms = rooms.filter((r) => r.status === ROOM_STATUSES.OCCUPIED)

  return (
    <div>
      {occupiedRooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <p className="text-4xl">🏨</p>
          <p className="mt-4 text-lg font-medium text-slate-700">No hay habitaciones ocupadas</p>
          <p className="mt-1 text-sm text-slate-500">
            Las habitaciones con check-in activo aparecerán aquí para procesar su salida.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {occupiedRooms.map((room) => (
            <article
              key={room.id}
              className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Hab. {room.number}</h3>
                <StatusBadge status={room.status} />
              </div>

              {room.guest && (
                <dl className="mb-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Huésped</dt>
                    <dd className="font-medium text-slate-800">{room.guest.fullName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Documento</dt>
                    <dd className="text-slate-800">{room.guest.documentId}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Teléfono</dt>
                    <dd className="text-slate-800">{room.guest.phone}</dd>
                  </div>
                  {room.billing && (
                    <div className="flex justify-between border-t border-slate-100 pt-2">
                      <dt className="text-slate-500">Total cobrado</dt>
                      <dd className="text-lg font-bold text-indigo-600">
                        ${room.billing.total.toFixed(2)}
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              <button
                type="button"
                onClick={() => onCheckOut(room.id)}
                className="w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Procesar Check-out
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
