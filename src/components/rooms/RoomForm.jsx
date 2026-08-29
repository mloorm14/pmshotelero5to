import { useState } from 'react'
import RequiredLabel from '../shared/RequiredLabel'
import InlineMessage from '../shared/InlineMessage'
import { validateRoom } from '../../utils/rooms'
import { useLog } from '../../context/useLog'
import { useTransientMessage } from '../../hooks/useTransientMessage'

function createEmptyForm() {
  return { number: '', capacity: '2', defaultRate: '45.00' }
}

export default function RoomForm({ rooms, onAddRoom }) {
  const { addLog } = useLog()
  const [form, setForm] = useState(createEmptyForm)
  const [touched, setTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [message, showMessage] = useTransientMessage()

  const draft = {
    number: form.number,
    capacity: Number.parseInt(form.capacity, 10),
    defaultRate: Number.parseFloat(form.defaultRate),
  }
  const { valid, errors } = validateRoom(draft, rooms)

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
      addLog(`Error de validación de formulario: ${Object.values(errors)[0]}`, 'error')
      return
    }

    const result = await onAddRoom(draft)
    if (!result.ok) {
      showMessage(`No se pudo crear la habitación: ${result.error}`, 'error')
      return
    }

    showMessage(`Habitación ${draft.number.trim()} creada.`)
    setForm(createEmptyForm())
    setTouched({})
    setSubmitAttempted(false)
  }

  return (
    <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-ink-900">Nueva Habitación</h3>
        <p className="text-sm text-ink-500">Alta con tarifa por defecto y capacidad máxima</p>
      </div>

      <InlineMessage message={message} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <RequiredLabel htmlFor="number">Número</RequiredLabel>
          <input
            id="number"
            type="text"
            value={form.number}
            onChange={(e) => handleChange('number', e.target.value)}
            onBlur={() => handleBlur('number')}
            className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
              showError('number')
                ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
            }`}
            placeholder="Ej. 301"
          />
          {showError('number') && <p className="mt-1 text-xs text-wine-700">{errors.number}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <RequiredLabel htmlFor="capacity">Capacidad (huéspedes)</RequiredLabel>
            <input
              id="capacity"
              type="number"
              min="1"
              step="1"
              value={form.capacity}
              onChange={(e) => handleChange('capacity', e.target.value)}
              onBlur={() => handleBlur('capacity')}
              className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
                showError('capacity')
                  ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                  : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
              }`}
            />
            {showError('capacity') && <p className="mt-1 text-xs text-wine-700">{errors.capacity}</p>}
          </div>
          <div>
            <RequiredLabel htmlFor="defaultRate">Tarifa por defecto ($/noche)</RequiredLabel>
            <input
              id="defaultRate"
              type="number"
              min="0"
              step="0.01"
              value={form.defaultRate}
              onChange={(e) => handleChange('defaultRate', e.target.value)}
              onBlur={() => handleBlur('defaultRate')}
              className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
                showError('defaultRate')
                  ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                  : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
              }`}
            />
            {showError('defaultRate') && <p className="mt-1 text-xs text-wine-700">{errors.defaultRate}</p>}
          </div>
        </div>

        <button
          type="submit"
          aria-disabled={!valid}
          className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 focus:ring-offset-white ${
            valid ? 'bg-wine-700 text-white hover:bg-wine-800' : 'cursor-not-allowed bg-ink-200 text-ink-500'
          }`}
        >
          <svg className="h-4 w-4" aria-hidden="true">
            <use href="/icons.svg#icon-plus" />
          </svg>
          Crear Habitación
        </button>
      </form>
    </section>
  )
}
