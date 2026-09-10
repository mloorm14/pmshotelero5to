import { isRoomAvailableForCheckIn } from '../../constants/rooms'
import RequiredLabel from '../shared/RequiredLabel'
import { validateRequiredText, validateDocumentId, validatePhone } from '../../utils/validation'
import { calculateNights, isNightsValid, calculateTotal, isTotalValid } from '../../utils/billing'
import { validateDateRange } from '../../utils/dates'
import { useLog } from '../../context/useLog'

// Documento/teléfono precargados desde una reserva son de solo lectura
// (Bug 3) — su estilo de campo bloqueado no depende de la validación.
function identityFieldClass(locked, invalid) {
  if (locked) return 'cursor-not-allowed border-ink-200 bg-ink-100 text-ink-600'
  if (invalid) return 'bg-white border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
  return 'bg-white border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
}

export default function CheckInForm({ selectedRoom, form, onChange, onCheckIn }) {
  const { addLog } = useLog()
  const baseRate = Number.parseFloat(form.baseRate) || 0
  const discount = Number.parseFloat(form.discount) || 0
  const advance = Number.parseFloat(form.advance) || 0

  const nameValidation = validateRequiredText(form.fullName, 'El nombre')
  const documentValidation = validateDocumentId(form.documentId)
  const phoneValidation = validatePhone(form.phone)
  const dateRangeValidation = validateDateRange(form.checkInDate, form.checkOutDate)

  const nights = calculateNights(form.checkInDate, form.checkOutDate)
  const nightsValid = isNightsValid(nights)
  const subtotal = baseRate * nights
  const total = calculateTotal(baseRate, nights, discount)
  const hasInvalidDiscount = !isTotalValid(total)
  const hasInvalidAdvance = advance > 0 && total > 0 && advance > total

  const isRoomReady = selectedRoom && isRoomAvailableForCheckIn(selectedRoom.status)
  const isFormValid =
    nameValidation.valid && documentValidation.valid && phoneValidation.valid && dateRangeValidation.valid
  const canCheckIn = isFormValid && isRoomReady && nightsValid && !hasInvalidDiscount && !hasInvalidAdvance

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
    if (hasInvalidAdvance) return 'el anticipo no puede superar el total de la estadía'
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
    <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-ink-900">Formulario de Check-in</h3>
        <p className="text-sm text-ink-500">Registro de huésped y facturación</p>
      </div>

      {!selectedRoom ? (
        <div className="rounded-lg border border-dashed border-ink-300 bg-ink-50 p-8 text-center">
          <p className="text-sm text-ink-500">Seleccione una habitación limpia del grid</p>
        </div>
      ) : (
        <>
          <div
            className={`mb-6 rounded-md border px-4 py-3 text-sm ${
              isRoomReady
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-wine-300 bg-wine-50 text-wine-800'
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
                  className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
                    touchedInvalid('fullName', nameValidation)
                      ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                      : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
                  }`}
                  placeholder="Ej. María González"
                />
                {touchedInvalid('fullName', nameValidation) && (
                  <p className="mt-1 text-xs text-wine-700">{nameValidation.error}</p>
                )}
              </div>

              <div>
                <RequiredLabel htmlFor="documentId">Documento</RequiredLabel>
                <input
                  id="documentId"
                  type="text"
                  value={form.documentId}
                  readOnly={form.identityLocked?.documentId}
                  onChange={(e) => onChange('documentId', e.target.value)}
                  onBlur={() => markTouched('documentId')}
                  className={`w-full rounded-md border px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${identityFieldClass(
                    form.identityLocked?.documentId,
                    touchedInvalid('documentId', documentValidation),
                  )}`}
                  placeholder="Ej. 1234567890"
                />
                {touchedInvalid('documentId', documentValidation) && !form.identityLocked?.documentId && (
                  <p className="mt-1 text-xs text-wine-700">{documentValidation.error}</p>
                )}
              </div>

              <div>
                <RequiredLabel htmlFor="phone">Teléfono</RequiredLabel>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  readOnly={form.identityLocked?.phone}
                  onChange={(e) => onChange('phone', e.target.value)}
                  onBlur={() => markTouched('phone')}
                  className={`w-full rounded-md border px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${identityFieldClass(
                    form.identityLocked?.phone,
                    touchedInvalid('phone', phoneValidation),
                  )}`}
                  placeholder="Ej. 0991234567"
                />
                {touchedInvalid('phone', phoneValidation) && !form.identityLocked?.phone && (
                  <p className="mt-1 text-xs text-wine-700">{phoneValidation.error}</p>
                )}
              </div>

              {(form.identityLocked?.documentId || form.identityLocked?.phone) && (
                <p className="text-xs text-ink-500 sm:col-span-2">
                  Datos precargados desde la reserva — para corregirlos, cancele esta reserva y cree una nueva (aún
                  no hay edición de reservas existentes).
                </p>
              )}
            </div>

            <div className="rounded-lg border border-ink-200 bg-ink-50 p-5">
              <h4 className="mb-4 text-sm font-semibold text-ink-800">Estadía</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="checkInDate" className="mb-1.5 block text-sm font-medium text-ink-700">
                    Fecha de entrada
                  </label>
                  <input
                    id="checkInDate"
                    type="date"
                    value={form.checkInDate}
                    onChange={(e) => onChange('checkInDate', e.target.value)}
                    onBlur={() => markTouched('checkInDate')}
                    className="w-full rounded-md border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
                  />
                </div>
                <div>
                  <label htmlFor="checkOutDate" className="mb-1.5 block text-sm font-medium text-ink-700">
                    Fecha de salida estimada
                  </label>
                  <input
                    id="checkOutDate"
                    type="date"
                    value={form.checkOutDate}
                    onChange={(e) => onChange('checkOutDate', e.target.value)}
                    onBlur={() => markTouched('checkOutDate')}
                    className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
                      form.touched.checkOutDate && !dateRangeValidation.valid
                        ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                        : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
                    }`}
                  />
                </div>
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-ink-700">Noches</span>
                  <div className="flex h-[42px] items-center rounded-md border border-ink-300 bg-ink-100 px-3 text-lg font-bold text-ink-900">
                    {nights}
                  </div>
                </div>
              </div>
              {form.touched.checkOutDate && !dateRangeValidation.valid && (
                <p className="mt-2 text-xs text-wine-700">{dateRangeValidation.error}</p>
              )}
            </div>

            <div className="rounded-lg border border-ink-200 bg-ink-50 p-5">
              <h4 className="mb-4 text-sm font-semibold text-ink-800">Facturación</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="baseRate" className="mb-1.5 block text-sm font-medium text-ink-700">
                    Tarifa Base por Noche ($)
                  </label>
                  <input
                    id="baseRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.baseRate}
                    onChange={(e) => onChange('baseRate', e.target.value)}
                    className="w-full rounded-md border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
                  />
                </div>
                <div>
                  <label htmlFor="discount" className="mb-1.5 block text-sm font-medium text-ink-700">
                    Descuento ($)
                  </label>
                  <input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount}
                    onChange={(e) => onChange('discount', e.target.value)}
                    className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
                      hasInvalidDiscount
                        ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                        : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
                    }`}
                  />
                </div>
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-ink-700">Total</span>
                  <div
                    className={`flex h-[42px] items-center rounded-md border px-3 text-lg font-bold ${
                      hasInvalidDiscount
                        ? 'border-wine-300 bg-wine-50 text-wine-800'
                        : 'border-ink-300 bg-ink-100 text-wine-700'
                    }`}
                  >
                    ${total.toFixed(2)}
                  </div>
                </div>
              </div>

              {hasInvalidDiscount && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-3 rounded-md border border-wine-300 bg-wine-50 px-4 py-3 text-sm text-wine-800"
                >
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-wine-600" aria-hidden="true">
                    <use href="/icons.svg#icon-alert" />
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

            <div className="rounded-lg border border-ink-200 bg-ink-50 p-5">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-800">
                <svg className="h-4 w-4 text-ink-500" aria-hidden="true">
                  <use href="/icons.svg#icon-cash" />
                </svg>
                Anticipo (opcional)
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="advance" className="mb-1.5 block text-sm font-medium text-ink-700">
                    Monto del anticipo ($)
                  </label>
                  <input
                    id="advance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.advance}
                    onChange={(e) => onChange('advance', e.target.value)}
                    className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
                      hasInvalidAdvance
                        ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                        : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="advanceMethod" className="mb-1.5 block text-sm font-medium text-ink-700">
                    Método
                  </label>
                  <select
                    id="advanceMethod"
                    value={form.advanceMethod}
                    onChange={(e) => onChange('advanceMethod', e.target.value)}
                    className="w-full rounded-md border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
              </div>
              {hasInvalidAdvance && (
                <p className="mt-2 text-xs text-wine-700">
                  El anticipo (${advance.toFixed(2)}) no puede superar el total de la estadía (${total.toFixed(2)}).
                </p>
              )}
            </div>

            <div className="rounded-lg border border-ink-200 bg-ink-50 p-5">
              <h4 className="mb-4 text-sm font-semibold text-ink-800">Desglose del cobro</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-500">Tarifa base por noche</dt>
                  <dd className="text-ink-700">${baseRate.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">Noches</dt>
                  <dd className="text-ink-700">{nights}</dd>
                </div>
                <div className="flex justify-between border-t border-ink-200 pt-2">
                  <dt className="text-ink-500">Subtotal (tarifa × noches)</dt>
                  <dd className="font-medium text-ink-800">${subtotal.toFixed(2)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-500">Descuento aplicado</dt>
                    <dd className="text-emerald-700">− ${discount.toFixed(2)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-ink-200 pt-2">
                  <dt className="font-semibold text-ink-700">Total</dt>
                  <dd className="text-lg font-bold text-wine-700">${total.toFixed(2)}</dd>
                </div>
              </dl>
            </div>

            <button
              type="submit"
              aria-disabled={!canCheckIn}
              className={`w-full rounded-md px-4 py-3 text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 focus:ring-offset-white ${
                canCheckIn
                  ? 'bg-wine-700 text-white hover:bg-wine-800'
                  : 'cursor-not-allowed bg-ink-200 text-ink-500'
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
