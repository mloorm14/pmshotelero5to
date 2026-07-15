export default function ReservationConversionPanel({ reservations, onUseReservation }) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-red-800">Reservas confirmadas por convertir</h3>
        <p className="text-sm text-red-700/80">
          Seleccione una reserva confirmada para precargar los datos del huésped en el check-in.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reservations.map((reservation) => (
          <button
            key={reservation.id}
            type="button"
            onClick={() => onUseReservation(reservation)}
            className="rounded-xl border border-zinc-200 bg-white p-4 text-left transition-all hover:border-red-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white"
          >
            <p className="text-sm font-semibold text-zinc-900">Hab. {reservation.roomNumber}</p>
            <p className="mt-1 text-sm text-zinc-700">{reservation.guestName}</p>
            <p className="mt-1 text-xs text-zinc-600">
              {reservation.checkInDate} → {reservation.checkOutDate}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}
