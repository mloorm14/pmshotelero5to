import { useState } from 'react'
import RequiredLabel from '../shared/RequiredLabel'
import InlineMessage from '../shared/InlineMessage'
import { validateReservation } from '../../utils/reservations'
import { getTodayISO, addDaysISO } from '../../utils/dates'
import { useLog } from '../../context/useLog'
import { useTransientMessage } from '../../hooks/useTransientMessage'

function createEmptyForm() {
  return {
    roomId: '',
    guestName: '',
    guestDocument: '',
    guestPhone: '',
    checkInDate: getTodayISO(),
    checkOutDate: addDaysISO(getTodayISO(), 1),
  }
}

export default function ReservationForm({ rooms, reservations, onAddReservation }) {
  const { addLog } = useLog()
  const [form, setForm] = useState(createEmptyForm)
  const [touched, setTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [message, showMessage] = useTransientMessage()

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

    const result = await onAddReservation(draft)
    if (!result.ok) {
      showMessage(`No se pudo crear la reserva: ${result.error}`, 'error')
      return
    }

    showMessage(`Reserva creada para ${draft.guestName.trim()}.`)
    setForm(createEmptyForm())
    setTouched({})
    setSubmitAttempted(false)
  }

  return (
    <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-ink-900">Nueva Reserva</h3>
        <p className="text-sm text-ink-500">Registro anticipado de huésped y fechas de estadía</p>
      </div>

      <InlineMessage message={message} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <RequiredLabel htmlFor="roomId">Habitación</RequiredLabel>
          <select
            id="roomId"
            value={form.roomId}
            onChange={(e) => handleChange('roomId', e.target.value)}
            onBlur={() => handleBlur('roomId')}
            className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
              showError('roomId')
                ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
            }`}
          >
            <option value="">Seleccione una habitación</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                Hab. {room.number}
              </option>
            ))}
          </select>
          {showError('roomId') && <p className="mt-1 text-xs text-wine-700">{errors.roomId}</p>}
        </div>

        <div>
          <RequiredLabel htmlFor="guestName">Nombre del huésped</RequiredLabel>
          <input
            id="guestName"
            type="text"
            value={form.guestName}
            onChange={(e) => handleChange('guestName', e.target.value)}
            onBlur={() => handleBlur('guestName')}
            className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
              showError('guestName')
                ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
            }`}
            placeholder="Ej. María González"
          />
          {showError('guestName') && <p className="mt-1 text-xs text-wine-700">{errors.guestName}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="guestDocument" className="mb-1.5 block text-sm font-medium text-ink-700">
              Documento <span className="font-normal text-ink-400">(opcional)</span>
            </label>
            <input
              id="guestDocument"
              type="text"
              value={form.guestDocument}
              onChange={(e) => handleChange('guestDocument', e.target.value)}
              onBlur={() => handleBlur('guestDocument')}
              className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
                showError('guestDocument')
                  ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                  : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
              }`}
              placeholder="Ej. 1234567890"
            />
            {showError('guestDocument') && <p className="mt-1 text-xs text-wine-700">{errors.guestDocument}</p>}
          </div>
          <div>
            <label htmlFor="guestPhone" className="mb-1.5 block text-sm font-medium text-ink-700">
              Teléfono <span className="font-normal text-ink-400">(opcional)</span>
            </label>
            <input
              id="guestPhone"
              type="tel"
              value={form.guestPhone}
              onChange={(e) => handleChange('guestPhone', e.target.value)}
              onBlur={() => handleBlur('guestPhone')}
              className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
                showError('guestPhone')
                  ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                  : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
              }`}
              placeholder="Ej. 0991234567"
            />
            {showError('guestPhone') && <p className="mt-1 text-xs text-wine-700">{errors.guestPhone}</p>}
          </div>
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
              className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
                showError('checkInDate')
                  ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                  : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
              }`}
            />
            {showError('checkInDate') && <p className="mt-1 text-xs text-wine-700">{errors.checkInDate}</p>}
          </div>
          <div>
            <RequiredLabel htmlFor="checkOutDate">Fecha de salida</RequiredLabel>
            <input
              id="checkOutDate"
              type="date"
              value={form.checkOutDate}
              onChange={(e) => handleChange('checkOutDate', e.target.value)}
              onBlur={() => handleBlur('checkOutDate')}
              className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
                showError('checkOutDate')
                  ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                  : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
              }`}
            />
            {showError('checkOutDate') && <p className="mt-1 text-xs text-wine-700">{errors.checkOutDate}</p>}
          </div>
        </div>

        <button
          type="submit"
          aria-disabled={!valid}
          className={`w-full rounded-md px-4 py-3 text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 focus:ring-offset-white ${
            valid ? 'bg-wine-700 text-white hover:bg-wine-800' : 'cursor-not-allowed bg-ink-200 text-ink-500'
          }`}
        >
          Crear Reserva
        </button>
      </form>
    </section>
  )
}
