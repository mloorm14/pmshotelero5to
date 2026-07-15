import { useState } from 'react'
import RequiredLabel from '../shared/RequiredLabel'
import { validateReservation } from '../../utils/reservations'
import { getTodayISO, addDaysISO } from '../../utils/dates'
import { useLog } from '../../context/LogContext'

function createEmptyForm() {
  return {
    roomId: '',
    guestName: '',
    checkInDate: getTodayISO(),
    checkOutDate: addDaysISO(getTodayISO(), 1),
  }
}

export default function ReservationForm({ rooms, reservations, onAddReservation }) {
  const { addLog } = useLog()
  const [form, setForm] = useState(createEmptyForm)
  const [touched, setTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const draft = { ...form, roomId: form.roomId ? Number(form.roomId) : '' }
  const { valid, errors } = validateReservation(draft, reservations)

  const showError = (field) => (touched[field] || submitAttempted) && errors[field]

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitAttempted(true)
    if (!valid) {
      const firstError = Object.values(errors)[0]
      addLog(`Error de validación de formulario: ${firstError}`, 'error')
      return
    }

    const success = await onAddReservation(draft)
    if (!success) return

    setForm(createEmptyForm())
    setTouched({})
    setSubmitAttempted(false)
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-zinc-900">Nueva Reserva</h3>
        <p className="text-sm text-zinc-600">Registro anticipado de huésped y fechas de estadía</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <RequiredLabel htmlFor="roomId">Habitación</RequiredLabel>
          <select
            id="roomId"
            value={form.roomId}
            onChange={(e) => handleChange('roomId', e.target.value)}
            onBlur={() => handleBlur('roomId')}
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 ${
              showError('roomId')
                ? 'border-red-600 focus:border-red-600 focus:ring-red-500/30'
                : 'border-zinc-300 focus:border-red-600 focus:ring-red-500/30'
            }`}
          >
            <option value="">Seleccione una habitación</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                Hab. {room.number}
              </option>
            ))}
          </select>
          {showError('roomId') && <p className="mt-1 text-xs text-red-700">{errors.roomId}</p>}
        </div>

        <div>
          <RequiredLabel htmlFor="guestName">Nombre del huésped</RequiredLabel>
          <input
            id="guestName"
            type="text"
            value={form.guestName}
            onChange={(e) => handleChange('guestName', e.target.value)}
            onBlur={() => handleBlur('guestName')}
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 ${
              showError('guestName')
                ? 'border-red-600 focus:border-red-600 focus:ring-red-500/30'
                : 'border-zinc-300 focus:border-red-600 focus:ring-red-500/30'
            }`}
            placeholder="Ej. María González"
          />
          {showError('guestName') && <p className="mt-1 text-xs text-red-700">{errors.guestName}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <RequiredLabel htmlFor="checkInDate">Fecha de llegada</RequiredLabel>
            <input
              id="checkInDate"
              type="date"
              value={form.checkInDate}
              onChange={(e) => handleChange('checkInDate', e.target.value)}
              onBlur={() => handleBlur('checkInDate')}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 ${
                showError('checkInDate')
                  ? 'border-red-600 focus:border-red-600 focus:ring-red-500/30'
                  : 'border-zinc-300 focus:border-red-600 focus:ring-red-500/30'
              }`}
            />
            {showError('checkInDate') && <p className="mt-1 text-xs text-red-700">{errors.checkInDate}</p>}
          </div>
          <div>
            <RequiredLabel htmlFor="checkOutDate">Fecha de salida</RequiredLabel>
            <input
              id="checkOutDate"
              type="date"
              value={form.checkOutDate}
              onChange={(e) => handleChange('checkOutDate', e.target.value)}
              onBlur={() => handleBlur('checkOutDate')}
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 ${
                showError('checkOutDate')
                  ? 'border-red-600 focus:border-red-600 focus:ring-red-500/30'
                  : 'border-zinc-300 focus:border-red-600 focus:ring-red-500/30'
              }`}
            />
            {showError('checkOutDate') && <p className="mt-1 text-xs text-red-700">{errors.checkOutDate}</p>}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white"
        >
          Crear Reserva
        </button>
      </form>
    </section>
  )
}
