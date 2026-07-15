import { isRoomAvailableForCheckIn } from '../../constants/rooms'
import RequiredLabel from '../shared/RequiredLabel'

export default function CheckInForm({ selectedRoom, form, onChange, onCheckIn }) {
  const baseRate = parseFloat(form.baseRate) || 0
  const discount = parseFloat(form.discount) || 0
  const total = baseRate - discount

  const isFormValid =
    form.fullName.trim() !== '' &&
    form.documentId.trim() !== '' &&
    form.phone.trim() !== ''

  const isRoomReady = selectedRoom && isRoomAvailableForCheckIn(selectedRoom.status)
  const hasInvalidDiscount = total <= 0
  const canCheckIn = isFormValid && isRoomReady && !hasInvalidDiscount

  const touchedEmpty = (field) => form.touched[field] && form[field].trim() === ''

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-slate-900">Formulario de Check-in</h3>
        <p className="text-sm text-slate-500">Registro de huésped y facturación</p>
      </div>

      {!selectedRoom ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-500">Seleccione una habitación limpia del grid</p>
        </div>
      ) : (
        <>
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              isRoomReady
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            <span className="font-semibold">Habitación {selectedRoom.number}</span>
            {' — '}
            {isRoomReady
              ? 'Disponible para check-in'
              : `Check-in bloqueado: habitación "${selectedRoom.status}"`}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (canCheckIn) onCheckIn()
            }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <RequiredLabel htmlFor="fullName">Nombre</RequiredLabel>
                <input
                  id="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => onChange('fullName', e.target.value)}
                  onBlur={() => onChange('touched', { ...form.touched, fullName: true })}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                    touchedEmpty('fullName')
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                  placeholder="Ej. María González"
                />
                {touchedEmpty('fullName') && (
                  <p className="mt-1 text-xs text-rose-600">Este campo es obligatorio</p>
                )}
              </div>

              <div>
                <RequiredLabel htmlFor="documentId">Documento</RequiredLabel>
                <input
                  id="documentId"
                  type="text"
                  value={form.documentId}
                  onChange={(e) => onChange('documentId', e.target.value)}
                  onBlur={() => onChange('touched', { ...form.touched, documentId: true })}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                    touchedEmpty('documentId')
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                  placeholder="Ej. 1234567890"
                />
                {touchedEmpty('documentId') && (
                  <p className="mt-1 text-xs text-rose-600">Este campo es obligatorio</p>
                )}
              </div>

              <div>
                <RequiredLabel htmlFor="phone">Teléfono</RequiredLabel>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => onChange('phone', e.target.value)}
                  onBlur={() => onChange('touched', { ...form.touched, phone: true })}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                    touchedEmpty('phone')
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200'
                  }`}
                  placeholder="Ej. 0991234567"
                />
                {touchedEmpty('phone') && (
                  <p className="mt-1 text-xs text-rose-600">Este campo es obligatorio</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h4 className="mb-4 text-sm font-semibold text-slate-800">Facturación</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="baseRate" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Tarifa Base ($)
                  </label>
                  <input
                    id="baseRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.baseRate}
                    onChange={(e) => onChange('baseRate', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label htmlFor="discount" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Descuento ($)
                  </label>
                  <input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount}
                    onChange={(e) => onChange('discount', e.target.value)}
                    className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                      hasInvalidDiscount
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200'
                    }`}
                  />
                </div>
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Total</span>
                  <div
                    className={`flex h-[42px] items-center rounded-lg border px-3 text-lg font-bold ${
                      hasInvalidDiscount
                        ? 'border-rose-300 bg-rose-50 text-rose-700'
                        : 'border-slate-200 bg-white text-indigo-700'
                    }`}
                  >
                    ${total.toFixed(2)}
                  </div>
                </div>
              </div>

              {hasInvalidDiscount && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-3 rounded-lg border border-rose-300 bg-rose-100 px-4 py-3 text-sm text-rose-800"
                >
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold">Alerta financiera</p>
                    <p className="mt-0.5">
                      El descuento supera la tarifa base. El total (${total.toFixed(2)}) debe ser mayor a cero.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!canCheckIn}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              Confirmar Check-in
            </button>
          </form>
        </>
      )}
    </section>
  )
}
