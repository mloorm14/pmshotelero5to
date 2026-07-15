import { isRoomAvailableForCheckIn } from '../../constants/rooms'
import RequiredLabel from '../shared/RequiredLabel'
import { validateRequiredText, validateDocumentId, validatePhone } from '../../utils/validation'
import { calculateNights, isNightsValid, calculateTotal, isTotalValid } from '../../utils/billing'
import { validateDateRange } from '../../utils/dates'
import { useLog } from '../../context/LogContext'

export default function CheckInForm({ selectedRoom, form, onChange, onCheckIn }) {
  const { addLog } = useLog()
  const baseRate = Number.parseFloat(form.baseRate) || 0
  const discount = Number.parseFloat(form.discount) || 0

  const nameValidation = validateRequiredText(form.fullName, 'El nombre')
  const documentValidation = validateDocumentId(form.documentId)
  const phoneValidation = validatePhone(form.phone)
  const dateRangeValidation = validateDateRange(form.checkInDate, form.checkOutDate)

  const nights = calculateNights(form.checkInDate, form.checkOutDate)
  const nightsValid = isNightsValid(nights)
  const total = calculateTotal(baseRate, nights, discount)
  const hasInvalidDiscount = !isTotalValid(total)

  const isRoomReady = selectedRoom && isRoomAvailableForCheckIn(selectedRoom.status)
  const isFormValid =
    nameValidation.valid && documentValidation.valid && phoneValidation.valid && dateRangeValidation.valid
  const canCheckIn = isFormValid && isRoomReady && nightsValid && !hasInvalidDiscount

  const touchedInvalid = (field, validation) => form.touched[field] && !validation.valid
  const markTouched = (field) => onChange('touched', { ...form.touched, [field]: true })

  function getBlockReason() {
    if (!isRoomReady) return `habitación "${selectedRoom?.status}" no disponible`
    if (!nameValidation.valid) return nameValidation.error
    if (!documentValidation.valid) return documentValidation.error
    if (!phoneValidation.valid) return phoneValidation.error
    if (!dateRangeValidation.valid) return dateRangeValidation.error
    if (!nightsValid) return 'la estadía debe ser de al menos 1 noche'
    if (hasInvalidDiscount) return 'el total debe ser mayor a cero'
    return 'datos incompletos'
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (canCheckIn) {
      onCheckIn()
    } else {
      addLog(`Error de validación de formulario: ${getBlockReason()}`, 'error')
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-zinc-100">Formulario de Check-in</h3>
        <p className="text-sm text-zinc-500">Registro de huésped y facturación</p>
      </div>

      {!selectedRoom ? (
        <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-8 text-center">
          <p className="text-sm text-zinc-500">Seleccione una habitación limpia del grid</p>
        </div>
      ) : (
        <>
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              isRoomReady
                ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
                : 'border-red-800 bg-red-950/40 text-red-300'
            }`}
          >
            <span className="font-semibold">Habitación {selectedRoom.number}</span>
            {' — '}
            {isRoomReady
              ? 'Disponible para check-in'
              : `Check-in bloqueado: habitación "${selectedRoom.status}"`}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <RequiredLabel htmlFor="fullName">Nombre</RequiredLabel>
                <input
                  id="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => onChange('fullName', e.target.value)}
                  onBlur={() => markTouched('fullName')}
                  className={`w-full rounded-lg border bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 ${
                    touchedInvalid('fullName', nameValidation)
                      ? 'border-red-600 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-zinc-700 focus:border-red-500 focus:ring-red-500/30'
                  }`}
                  placeholder="Ej. María González"
                />
                {touchedInvalid('fullName', nameValidation) && (
                  <p className="mt-1 text-xs text-red-400">{nameValidation.error}</p>
                )}
              </div>

              <div>
                <RequiredLabel htmlFor="documentId">Documento</RequiredLabel>
                <input
                  id="documentId"
                  type="text"
                  value={form.documentId}
                  onChange={(e) => onChange('documentId', e.target.value)}
                  onBlur={() => markTouched('documentId')}
                  className={`w-full rounded-lg border bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 ${
                    touchedInvalid('documentId', documentValidation)
                      ? 'border-red-600 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-zinc-700 focus:border-red-500 focus:ring-red-500/30'
                  }`}
                  placeholder="Ej. 1234567890"
                />
                {touchedInvalid('documentId', documentValidation) && (
                  <p className="mt-1 text-xs text-red-400">{documentValidation.error}</p>
                )}
              </div>

              <div>
                <RequiredLabel htmlFor="phone">Teléfono</RequiredLabel>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => onChange('phone', e.target.value)}
                  onBlur={() => markTouched('phone')}
                  className={`w-full rounded-lg border bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 ${
                    touchedInvalid('phone', phoneValidation)
                      ? 'border-red-600 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-zinc-700 focus:border-red-500 focus:ring-red-500/30'
                  }`}
                  placeholder="Ej. 0991234567"
                />
                {touchedInvalid('phone', phoneValidation) && (
                  <p className="mt-1 text-xs text-red-400">{phoneValidation.error}</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
              <h4 className="mb-4 text-sm font-semibold text-zinc-200">Estadía</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="checkInDate" className="mb-1.5 block text-sm font-medium text-zinc-300">
                    Fecha de entrada
                  </label>
                  <input
                    id="checkInDate"
                    type="date"
                    value={form.checkInDate}
                    onChange={(e) => onChange('checkInDate', e.target.value)}
                    onBlur={() => markTouched('checkInDate')}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  />
                </div>
                <div>
                  <label htmlFor="checkOutDate" className="mb-1.5 block text-sm font-medium text-zinc-300">
                    Fecha de salida estimada
                  </label>
                  <input
                    id="checkOutDate"
                    type="date"
                    value={form.checkOutDate}
                    onChange={(e) => onChange('checkOutDate', e.target.value)}
                    onBlur={() => markTouched('checkOutDate')}
                    className={`w-full rounded-lg border bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 ${
                      form.touched.checkOutDate && !dateRangeValidation.valid
                        ? 'border-red-600 focus:border-red-500 focus:ring-red-500/30'
                        : 'border-zinc-700 focus:border-red-500 focus:ring-red-500/30'
                    }`}
                  />
                </div>
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-zinc-300">Noches</span>
                  <div className="flex h-[42px] items-center rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-lg font-bold text-zinc-100">
                    {nights}
                  </div>
                </div>
              </div>
              {form.touched.checkOutDate && !dateRangeValidation.valid && (
                <p className="mt-2 text-xs text-red-400">{dateRangeValidation.error}</p>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5">
              <h4 className="mb-4 text-sm font-semibold text-zinc-200">Facturación</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="baseRate" className="mb-1.5 block text-sm font-medium text-zinc-300">
                    Tarifa Base por Noche ($)
                  </label>
                  <input
                    id="baseRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.baseRate}
                    onChange={(e) => onChange('baseRate', e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  />
                </div>
                <div>
                  <label htmlFor="discount" className="mb-1.5 block text-sm font-medium text-zinc-300">
                    Descuento ($)
                  </label>
                  <input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount}
                    onChange={(e) => onChange('discount', e.target.value)}
                    className={`w-full rounded-lg border bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 ${
                      hasInvalidDiscount
                        ? 'border-red-600 focus:border-red-500 focus:ring-red-500/30'
                        : 'border-zinc-700 focus:border-red-500 focus:ring-red-500/30'
                    }`}
                  />
                </div>
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-zinc-300">Total</span>
                  <div
                    className={`flex h-[42px] items-center rounded-lg border px-3 text-lg font-bold ${
                      hasInvalidDiscount
                        ? 'border-red-700 bg-red-950/40 text-red-300'
                        : 'border-zinc-700 bg-zinc-950 text-red-300'
                    }`}
                  >
                    ${total.toFixed(2)}
                  </div>
                </div>
              </div>

              {hasInvalidDiscount && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-3 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-200"
                >
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Alerta financiera</p>
                    <p className="mt-0.5">
                      El descuento supera la tarifa. El total (${total.toFixed(2)}) debe ser mayor a cero.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              aria-disabled={!canCheckIn}
              className={`w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                canCheckIn
                  ? 'bg-red-800 text-white hover:bg-red-700'
                  : 'cursor-not-allowed bg-zinc-800 text-zinc-500'
              }`}
            >
              Confirmar Check-in
            </button>
          </form>
        </>
      )}
    </section>
  )
}
