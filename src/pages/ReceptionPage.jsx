import { useState } from 'react'
import RoomSelector from '../components/reception/RoomSelector'
import CheckInForm from '../components/reception/CheckInForm'

const EMPTY_FORM = {
  fullName: '',
  documentId: '',
  phone: '',
  baseRate: '80.00',
  discount: '0',
  touched: {},
}

export default function ReceptionPage({ rooms, onCheckIn }) {
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleCheckIn() {
    if (!selectedRoom) return

    const guest = {
      fullName: form.fullName.trim(),
      documentId: form.documentId.trim(),
      phone: form.phone.trim(),
    }
    const billing = {
      baseRate: parseFloat(form.baseRate) || 0,
      discount: parseFloat(form.discount) || 0,
      total: (parseFloat(form.baseRate) || 0) - (parseFloat(form.discount) || 0),
    }

    onCheckIn(selectedRoom.id, guest, billing)
    setForm(EMPTY_FORM)
    setSelectedRoomId(null)
  }

  return (
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
  )
}
