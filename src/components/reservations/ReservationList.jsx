import StatusBadge from '../shared/StatusBadge'
import {
  RESERVATION_STATUSES,
  RESERVATION_STATUS_STYLES,
  ACTIVE_RESERVATION_STATUSES,
  HISTORY_RESERVATION_STATUSES,
} from '../../constants/reservations'

function ReservationCard({ reservation, onConfirm, onCancel }) {
  const isPending = reservation.status === RESERVATION_STATUSES.PENDING
  const isConfirmed = reservation.status === RESERVATION_STATUSES.CONFIRMED

  return (
    <article className="rounded-lg border border-ink-200 bg-ink-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-900">
          Hab. {reservation.roomNumber} — {reservation.guestName}
        </span>
        <StatusBadge status={reservation.status} styles={RESERVATION_STATUS_STYLES} />
      </div>
      <p className="mb-3 text-xs text-ink-500">
        {reservation.checkInDate} → {reservation.checkOutDate}
      </p>

      {(isPending || isConfirmed) && (
        <div className="flex flex-wrap gap-2">
          {isPending && (
            <button
              type="button"
              onClick={() => onConfirm(reservation.id)}
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white"
            >
              Confirmar
            </button>
          )}
          <button
            type="button"
            onClick={() => onCancel(reservation.id)}
            className="rounded-md bg-wine-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-wine-800 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 focus:ring-offset-white"
          >
            Cancelar
          </button>
        </div>
      )}
    </article>
  )
}

export default function ReservationList({ reservations, onConfirm, onCancel }) {
  const active = reservations.filter((r) => ACTIVE_RESERVATION_STATUSES.includes(r.status))
  const history = reservations.filter((r) => HISTORY_RESERVATION_STATUSES.includes(r.status))

  return (
    <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-ink-900">Reservas Activas</h3>
        <p className="text-sm text-ink-500">Pendientes, confirmadas y en curso</p>
      </div>

      {active.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 bg-ink-50 p-8 text-center">
          <p className="text-sm text-ink-500">No hay reservas activas por ahora</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((reservation) => (
            <ReservationCard key={reservation.id} reservation={reservation} onConfirm={onConfirm} onCancel={onCancel} />
          ))}
        </div>
      )}

      {history.length > 0 && (
        <details className="mt-6 border-t border-ink-200 pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink-600 transition-colors hover:text-wine-700">
            Historial ({history.length})
          </summary>
          <div className="mt-3 space-y-3">
            {history.map((reservation) => (
              <article key={reservation.id} className="rounded-lg border border-ink-200 bg-ink-50 p-4 opacity-80">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-900">
                    Hab. {reservation.roomNumber} — {reservation.guestName}
                  </span>
                  <StatusBadge status={reservation.status} styles={RESERVATION_STATUS_STYLES} />
                </div>
                <p className="text-xs text-ink-500">
                  {reservation.checkInDate} → {reservation.checkOutDate}
                </p>
              </article>
            ))}
          </div>
        </details>
      )}
    </section>
  )
}
