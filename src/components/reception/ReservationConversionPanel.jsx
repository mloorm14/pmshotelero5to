export default function ReservationConversionPanel({ reservations, onUseReservation }) {
  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-indigo-900">Reservas confirmadas por convertir</h3>
        <p className="text-sm text-indigo-700">
          Seleccione una reserva confirmada para precargar los datos del huésped en el check-in.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reservations.map((reservation) => (
          <button
            key={reservation.id}
            type="button"
            onClick={() => onUseReservation(reservation)}
            className="rounded-xl border border-indigo-200 bg-white p-4 text-left transition-all hover:border-indigo-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <p className="text-sm font-semibold text-slate-900">Hab. {reservation.roomNumber}</p>
            <p className="mt-1 text-sm text-slate-700">{reservation.guestName}</p>
            <p className="mt-1 text-xs text-slate-500">
              {reservation.checkInDate} → {reservation.checkOutDate}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}
