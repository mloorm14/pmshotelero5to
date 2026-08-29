import { useState } from 'react'
import RoomSelector from '../components/reception/RoomSelector'
import CheckInForm from '../components/reception/CheckInForm'
import ReservationConversionPanel from '../components/reception/ReservationConversionPanel'
import InlineMessage from '../components/shared/InlineMessage'
import { useTransientMessage } from '../hooks/useTransientMessage'
import { getTodayISO, addDaysISO } from '../utils/dates'
import { calculateNights, calculateTotal } from '../utils/billing'
import { RESERVATION_STATUSES } from '../constants/reservations'
import { PAYMENT_TYPES } from '../utils/payments'

function createEmptyForm(baseRate = '80.00') {
  return {
    fullName: '',
    documentId: '',
    phone: '',
    checkInDate: getTodayISO(),
    checkOutDate: addDaysISO(getTodayISO(), 1),
    baseRate,
    discount: '0',
    advance: '0',
    advanceMethod: 'Efectivo',
    reservationId: null,
    // Documento/teléfono precargados desde una reserva quedan de solo
    // lectura (Bug 3): evita que el check-in registre una identidad distinta
    // a la de quien reservó sin que el sistema lo note.
    identityLocked: { documentId: false, phone: false },
    touched: {},
  }
}

export default function ReceptionPage({ rooms, reservations, onCheckIn, onAddPayment, onConvertReservation }) {
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  // Selección independiente de la de habitación: antes compartían implícitamente
  // el mismo "elemento resaltado" y elegir una habitación después de una reserva
  // apagaba el resaltado de la reserva aunque el dato siguiera guardado.
  const [selectedReservationId, setSelectedReservationId] = useState(null)
  const [form, setForm] = useState(() => createEmptyForm())
  const [message, showMessage] = useTransientMessage()

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null
  const convertibleReservations = reservations.filter((r) => r.status === RESERVATION_STATUSES.CONFIRMED)

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSelectRoom(roomId) {
    setSelectedRoomId(roomId)
    const room = rooms.find((r) => r.id === roomId)
    if (room?.defaultRate) {
      setForm((prev) => ({ ...prev, baseRate: room.defaultRate.toFixed(2) }))
    }
  }

  function handleUseReservation(reservation) {
    const room = rooms.find((r) => r.id === reservation.roomId)
    setSelectedRoomId(reservation.roomId)
    setSelectedReservationId(reservation.id)
    setForm({
      ...createEmptyForm(room?.defaultRate ? room.defaultRate.toFixed(2) : '80.00'),
      fullName: reservation.guestName,
      documentId: reservation.guestDocument ?? '',
      phone: reservation.guestPhone ?? '',
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
      reservationId: reservation.id,
      identityLocked: {
        documentId: Boolean(reservation.guestDocument),
        phone: Boolean(reservation.guestPhone),
      },
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

    const result = await onCheckIn(selectedRoom.id, guest, billing)
    if (!result.ok) {
      showMessage(`No se pudo completar el check-in: ${result.error}`, 'error')
      return
    }

    const advance = Number.parseFloat(form.advance) || 0
    if (advance > 0) {
      await onAddPayment({
        roomId: selectedRoom.id,
        type: PAYMENT_TYPES.ADVANCE,
        amount: advance,
        method: form.advanceMethod,
      })
    }

    if (form.reservationId) onConvertReservation(form.reservationId)

    showMessage(
      `Check-in registrado: ${guest.fullName} en habitación ${selectedRoom.number}${
        advance > 0 ? ` con anticipo de $${advance.toFixed(2)}` : ''
      }.`,
    )
    setForm(createEmptyForm())
    setSelectedRoomId(null)
    setSelectedReservationId(null)
  }

  return (
    <div className="space-y-8">
      <InlineMessage message={message} />
      {convertibleReservations.length > 0 && (
        <ReservationConversionPanel
          reservations={convertibleReservations}
          selectedReservationId={selectedReservationId}
          onUseReservation={handleUseReservation}
        />
      )}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <RoomSelector
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={handleSelectRoom}
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
