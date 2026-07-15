export default function ReservationConversionPanel({ reservations, onUseReservation }) {
  return (
    <section className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-red-200">Reservas confirmadas por convertir</h3>
        <p className="text-sm text-red-300/80">
          Seleccione una reserva confirmada para precargar los datos del huésped en el check-in.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reservations.map((reservation) => (
          <button
            key={reservation.id}
            type="button"
            onClick={() => onUseReservation(reservation)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-all hover:border-red-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <p className="text-sm font-semibold text-zinc-100">Hab. {reservation.roomNumber}</p>
            <p className="mt-1 text-sm text-zinc-300">{reservation.guestName}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {reservation.checkInDate} → {reservation.checkOutDate}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}
