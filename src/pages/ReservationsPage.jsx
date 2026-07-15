import ReservationForm from '../components/reservations/ReservationForm'
import ReservationList from '../components/reservations/ReservationList'

export default function ReservationsPage({ rooms, reservations, onAddReservation, onConfirmReservation, onCancelReservation }) {
  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
      <ReservationForm rooms={rooms} reservations={reservations} onAddReservation={onAddReservation} />
      <ReservationList
        reservations={reservations}
        onConfirm={onConfirmReservation}
        onCancel={onCancelReservation}
      />
    </div>
  )
}
