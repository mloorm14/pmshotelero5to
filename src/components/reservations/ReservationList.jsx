import StatusBadge from '../shared/StatusBadge'
import { RESERVATION_STATUSES, RESERVATION_STATUS_STYLES } from '../../constants/reservations'

export default function ReservationList({ reservations, onConfirm, onCancel }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-zinc-900">Reservas Activas</h3>
        <p className="text-sm text-zinc-600">Pendientes, confirmadas y canceladas</p>
      </div>

      {reservations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="text-sm text-zinc-600">Aún no hay reservas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((reservation) => {
            const isPending = reservation.status === RESERVATION_STATUSES.PENDING
            const isConfirmed = reservation.status === RESERVATION_STATUSES.CONFIRMED

            return (
              <article
                key={reservation.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-900">
                    Hab. {reservation.roomNumber} — {reservation.guestName}
                  </span>
                  <StatusBadge status={reservation.status} styles={RESERVATION_STATUS_STYLES} />
                </div>
                <p className="mb-3 text-xs text-zinc-600">
                  {reservation.checkInDate} → {reservation.checkOutDate}
                  {reservation.checkedIn && ' · Check-in ya realizado'}
                </p>

                {(isPending || isConfirmed) && (
                  <div className="flex flex-wrap gap-2">
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => onConfirm(reservation.id)}
                        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white"
                      >
                        Confirmar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onCancel(reservation.id)}
                      className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
