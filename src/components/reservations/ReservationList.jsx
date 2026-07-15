import StatusBadge from '../shared/StatusBadge'
import { RESERVATION_STATUSES, RESERVATION_STATUS_STYLES } from '../../constants/reservations'

export default function ReservationList({ reservations, onConfirm, onCancel }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-zinc-100">Reservas Activas</h3>
        <p className="text-sm text-zinc-500">Pendientes, confirmadas y canceladas</p>
      </div>

      {reservations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-8 text-center">
          <p className="text-sm text-zinc-500">Aún no hay reservas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((reservation) => {
            const isPending = reservation.status === RESERVATION_STATUSES.PENDING
            const isConfirmed = reservation.status === RESERVATION_STATUSES.CONFIRMED

            return (
              <article
                key={reservation.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-100">
                    Hab. {reservation.roomNumber} — {reservation.guestName}
                  </span>
                  <StatusBadge status={reservation.status} styles={RESERVATION_STATUS_STYLES} />
                </div>
                <p className="mb-3 text-xs text-zinc-500">
                  {reservation.checkInDate} → {reservation.checkOutDate}
                  {reservation.checkedIn && ' · Check-in ya realizado'}
                </p>

                {(isPending || isConfirmed) && (
                  <div className="flex flex-wrap gap-2">
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => onConfirm(reservation.id)}
                        className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                      >
                        Confirmar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onCancel(reservation.id)}
                      className="rounded-lg bg-red-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
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
