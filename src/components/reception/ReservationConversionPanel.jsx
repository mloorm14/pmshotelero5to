export default function ReservationConversionPanel({ reservations, selectedReservationId, onUseReservation }) {
  return (
    <section className="rounded-lg border border-wine-200 bg-wine-50 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-wine-800">Reservas confirmadas por convertir</h3>
        <p className="text-sm text-wine-700/80">
          Seleccione una reserva confirmada para precargar los datos del huésped en el check-in.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reservations.map((reservation) => {
          const isSelected = selectedReservationId === reservation.id

          return (
            <button
              key={reservation.id}
              type="button"
              onClick={() => onUseReservation(reservation)}
              className={`relative rounded-md border bg-white p-4 text-left transition-all hover:border-wine-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 focus:ring-offset-white ${
                isSelected ? 'border-wine-600 ring-2 ring-wine-600 ring-offset-2 ring-offset-white' : 'border-ink-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">Hab. {reservation.roomNumber}</p>
                {isSelected && (
                  <span className="rounded-full bg-wine-700 px-2 py-0.5 text-xs font-medium text-white">
                    Seleccionada
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-700">{reservation.guestName}</p>
              <p className="mt-1 text-xs text-ink-500">
                {reservation.checkInDate} → {reservation.checkOutDate}
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
