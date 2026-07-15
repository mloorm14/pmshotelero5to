import { useState } from 'react'
import RoomSelector from '../components/reception/RoomSelector'
import CheckInForm from '../components/reception/CheckInForm'
import ReservationConversionPanel from '../components/reception/ReservationConversionPanel'
import { getTodayISO, addDaysISO } from '../utils/dates'
import { calculateNights, calculateTotal } from '../utils/billing'
import { RESERVATION_STATUSES } from '../constants/reservations'

function createEmptyForm() {
  return {
    fullName: '',
    documentId: '',
    phone: '',
    checkInDate: getTodayISO(),
    checkOutDate: addDaysISO(getTodayISO(), 1),
    baseRate: '80.00',
    discount: '0',
    reservationId: null,
    touched: {},
  }
}

export default function ReceptionPage({ rooms, reservations, onCheckIn, onConvertReservation }) {
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [form, setForm] = useState(createEmptyForm)

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null
  const convertibleReservations = reservations.filter(
    (r) => r.status === RESERVATION_STATUSES.CONFIRMED && !r.checkedIn,
  )

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleUseReservation(reservation) {
    setSelectedRoomId(reservation.roomId)
    setForm({
      ...createEmptyForm(),
      fullName: reservation.guestName,
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
      reservationId: reservation.id,
    })
  }

  async function handleCheckIn() {
    if (!selectedRoom) return

    const guest = {
      fullName: form.fullName.trim(),
      documentId: form.documentId.trim(),
      phone: form.phone.trim(),
    }
    const nights = calculateNights(form.checkInDate, form.checkOutDate)
    const baseRate = Number.parseFloat(form.baseRate) || 0
    const discount = Number.parseFloat(form.discount) || 0
    const billing = {
      baseRate,
      nights,
      discount,
      total: calculateTotal(baseRate, nights, discount),
      checkInDate: form.checkInDate,
      checkOutDate: form.checkOutDate,
    }

    const success = await onCheckIn(selectedRoom.id, guest, billing)
    if (!success) return

    if (form.reservationId) onConvertReservation(form.reservationId)
    setForm(createEmptyForm())
    setSelectedRoomId(null)
  }

  return (
    <div className="space-y-8">
      {convertibleReservations.length > 0 && (
        <ReservationConversionPanel
          reservations={convertibleReservations}
          onUseReservation={handleUseReservation}
        />
      )}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <RoomSelector
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={setSelectedRoomId}
        />
        <CheckInForm
          selectedRoom={selectedRoom}
          form={form}
          onChange={handleFormChange}
          onCheckIn={handleCheckIn}
        />
      </div>
    </div>
  )
}
