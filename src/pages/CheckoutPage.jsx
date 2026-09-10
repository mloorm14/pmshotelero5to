import { useCallback, useEffect, useState } from 'react'
import { ROOM_STATUSES } from '../constants/rooms'
import StatusBadge from '../components/shared/StatusBadge'
import InlineMessage from '../components/shared/InlineMessage'
import Breadcrumb from '../components/shared/Breadcrumb'
import MinibarPanel from '../components/checkout/MinibarPanel'
import { calculateNights } from '../utils/billing'
import { calculateNetAdvances, calculateBalanceDue, sumMinibarCharges, PAYMENT_TYPES } from '../utils/payments'
import { classifyRoomsByCheckout, CHECKOUT_ALERT_LEVELS } from '../utils/alerts'
import { useTransientMessage } from '../hooks/useTransientMessage'
import { api } from '../utils/api'
import { useLog } from '../context/useLog'

const ALERT_COPY = {
  [CHECKOUT_ALERT_LEVELS.OVERDUE]: { label: 'Vencido', className: 'border-wine-300 bg-wine-100 text-wine-800' },
  [CHECKOUT_ALERT_LEVELS.DUE_TODAY]: { label: 'Hoy', className: 'border-amber-300 bg-amber-100 text-amber-800' },
  [CHECKOUT_ALERT_LEVELS.DUE_SOON]: { label: 'Próximo', className: 'border-ink-300 bg-ink-100 text-ink-700' },
}

function CheckoutAlertsPanel({ rooms }) {
  const alerts = classifyRoomsByCheckout(rooms).filter(({ level }) => level !== CHECKOUT_ALERT_LEVELS.NORMAL)
  if (alerts.length === 0) return null

  return (
    <section className="mb-6 rounded-lg border border-wine-200 bg-wine-50 p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <svg className="h-5 w-5 text-wine-700" aria-hidden="true">
          <use href="/icons.svg#icon-alert" />
        </svg>
        <h3 className="text-sm font-semibold text-wine-800">Alertas de check-out</h3>
      </div>
      <ul className="space-y-1.5">
        {alerts.map(({ room, level }) => (
          <li key={room.id} className="flex items-center justify-between text-sm">
            <span className="text-wine-900">
              Hab. {room.number} — {room.guest?.fullName ?? 'Huésped'} · sale {room.billing.checkOutDate}
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ALERT_COPY[level].className}`}>
              {ALERT_COPY[level].label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// Saldo con signo → una única acción con el monto exacto (no editable): no
// hay forma de cobrar/devolver un monto distinto al que dice el ledger.
function SettlementAction({ room, balance, onSettle }) {
  const [method, setMethod] = useState('Efectivo')
  const [submitting, setSubmitting] = useState(false)

  if (balance === 0) {
    return (
      <p className="mt-3 flex items-center gap-2 border-t border-ink-200 pt-3 text-sm text-emerald-700">
        <svg className="h-4 w-4 shrink-0" aria-hidden="true">
          <use href="/icons.svg#icon-check" />
        </svg>
        Estadía saldada — no queda ningún cobro ni devolución pendiente.
      </p>
    )
  }

  const isCharge = balance > 0
  const amount = Math.abs(balance)
  const type = isCharge ? PAYMENT_TYPES.FINAL_PAYMENT : PAYMENT_TYPES.REFUND
  const label = isCharge ? 'Cobrar saldo pendiente' : 'Registrar devolución'
  const explanation = isCharge
    ? `Al huésped le falta pagar $${amount.toFixed(2)} para completar el total de la estadía.`
    : `El anticipo registrado supera el total de la estadía por $${amount.toFixed(2)} — corresponde devolver esa diferencia.`

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    await onSettle(room.id, type, amount, method)
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 border-t border-ink-200 pt-3">
      <p className="text-xs text-ink-500">{explanation}</p>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor={`settle-method-${room.id}`} className="mb-1 block text-xs font-medium text-ink-600">
            Método
          </label>
          <select
            id={`settle-method-${room.id}`}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className={`rounded-md px-3 py-2 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            isCharge ? 'bg-wine-700 hover:bg-wine-800' : 'bg-ink-800 hover:bg-ink-900'
          }`}
        >
          {label} (${amount.toFixed(2)})
        </button>
      </div>
    </form>
  )
}

// Botón secundario y menos prominente que "Procesar Check-out": para el
// walk-out real (huésped que se retira sin saldar). Exige un motivo antes de
// confirmar — no es un bypass silencioso, deja constancia en `payments`
// (PAYMENT_TYPES.UNCOLLECTED_BALANCE) para que Reportes lo pueda mostrar y
// localizar por separado del total facturado.
function ForcedCheckoutAction({ room, balance, onForceCheckOut }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (balance <= 0) return null

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-xs font-medium text-ink-500 underline decoration-dotted underline-offset-2 hover:text-wine-700"
      >
        Salida sin pago completo
      </button>
    )
  }

  const trimmedNote = note.trim()

  async function handleSubmit(e) {
    e.preventDefault()
    if (trimmedNote === '') return
    setSubmitting(true)
    await onForceCheckOut(room.id, trimmedNote)
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 rounded-md border border-dashed border-ink-300 bg-ink-50 p-3">
      <label htmlFor={`forced-note-${room.id}`} className="block text-xs font-medium text-ink-600">
        Motivo de la salida sin pago completo (obligatorio)
      </label>
      <input
        id={`forced-note-${room.id}`}
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ej. Cliente se retiró sin pagar"
        className="w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting || trimmedNote === ''}
          className="rounded-md border border-ink-400 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-ink-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirmar salida sin pago (${balance.toFixed(2)} quedan pendientes)
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink-500 hover:text-ink-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default function CheckoutPage({ rooms, onCheckOut, onAddPayment, onAddMinibarCharge }) {
  const { addLog } = useLog()
  const [message, showMessage] = useTransientMessage()
  const occupiedRooms = rooms.filter((r) => r.status === ROOM_STATUSES.OCCUPIED)
  const [paymentsByRoom, setPaymentsByRoom] = useState({})
  const [minibarChargesByRoom, setMinibarChargesByRoom] = useState({})
  const [minibarProducts, setMinibarProducts] = useState([])
  // No hay "selección" real en esta página (todas las habitaciones ocupadas
  // se muestran a la vez) — activeRoomId solo alimenta el breadcrumb, se
  // actualiza con la tarjeta que el usuario tocó/enfocó por última vez y se
  // apaga solo si esa habitación deja de estar ocupada (ver breadcrumbRoom).
  const [activeRoomId, setActiveRoomId] = useState(null)
  const breadcrumbRoom = occupiedRooms.find((r) => r.id === activeRoomId)

  const loadPayments = useCallback(
    async (roomId) => {
      try {
        const payments = await api.getPayments(roomId)
        setPaymentsByRoom((prev) => ({ ...prev, [roomId]: payments }))
      } catch (err) {
        addLog(`Error al cargar los pagos de la habitación: ${err.message}`, 'error')
      }
    },
    [addLog],
  )

  const loadMinibarCharges = useCallback(
    async (roomId) => {
      try {
        const charges = await api.getMinibarCharges(roomId)
        setMinibarChargesByRoom((prev) => ({ ...prev, [roomId]: charges }))
      } catch (err) {
        addLog(`Error al cargar el consumo de minibar de la habitación: ${err.message}`, 'error')
      }
    },
    [addLog],
  )

  const occupiedRoomIds = occupiedRooms.map((r) => r.id).join(',')
  useEffect(() => {
    occupiedRoomIds
      .split(',')
      .filter(Boolean)
      .forEach((id) => {
        loadPayments(Number(id))
        loadMinibarCharges(Number(id))
      })
  }, [occupiedRoomIds, loadPayments, loadMinibarCharges])

  useEffect(() => {
    api
      .getMinibarProducts(true)
      .then(setMinibarProducts)
      .catch((err) => addLog(`Error al cargar el catálogo de minibar: ${err.message}`, 'error'))
  }, [addLog])

  async function handleSettle(roomId, type, amount, method) {
    const room = rooms.find((r) => r.id === roomId)
    const result = await onAddPayment({ roomId, type, amount, method })
    if (!result.ok) {
      showMessage(`No se pudo registrar el pago: ${result.error}`, 'error')
      return
    }
    await loadPayments(roomId)
    showMessage(
      `${type === PAYMENT_TYPES.FINAL_PAYMENT ? 'Cobro' : 'Devolución'} de $${amount.toFixed(2)} registrado — habitación ${room?.number ?? roomId}.`,
    )
  }

  async function handleAddMinibarCharge(roomId, productId, quantity) {
    const room = rooms.find((r) => r.id === roomId)
    const result = await onAddMinibarCharge({ roomId, productId, quantity })
    if (!result.ok) {
      showMessage(`No se pudo registrar el consumo de minibar: ${result.error}`, 'error')
      return
    }
    await loadMinibarCharges(roomId)
    showMessage(`Consumo de minibar registrado — habitación ${room?.number ?? roomId}.`)
  }

  async function handleCheckOut(roomId) {
    const room = rooms.find((r) => r.id === roomId)
    const result = await onCheckOut(roomId)
    if (!result.ok) {
      showMessage(`No se pudo procesar el check-out: ${result.error}`, 'error')
      return
    }
    showMessage(`Check-out completado — habitación ${room?.number ?? roomId} lista para limpieza.`)
  }

  async function handleForceCheckOut(roomId, note) {
    const room = rooms.find((r) => r.id === roomId)
    const result = await onCheckOut(roomId, { forced: true, note })
    if (!result.ok) {
      showMessage(`No se pudo procesar el check-out forzado: ${result.error}`, 'error')
      return
    }
    showMessage(
      `Check-out forzado — habitación ${room?.number ?? roomId} lista para limpieza. Saldo pendiente registrado en Reportes.`,
    )
  }

  return (
    <div>
      <Breadcrumb module="Caja y Salidas" roomNumber={breadcrumbRoom?.number} />
      <InlineMessage message={message} />
      <CheckoutAlertsPanel rooms={rooms} />
      {occupiedRooms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 bg-white p-12 text-center shadow-sm">
          <svg className="mx-auto h-10 w-10 text-ink-300" aria-hidden="true">
            <use href="/icons.svg#icon-building" />
          </svg>
          <p className="mt-4 text-lg font-medium text-ink-700">No hay habitaciones ocupadas</p>
          <p className="mt-1 text-sm text-ink-500">
            Las habitaciones con check-in activo aparecerán aquí para procesar su salida.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {occupiedRooms.map((room) => {
            const nights = room.billing?.checkInDate
              ? calculateNights(room.billing.checkInDate, room.billing.checkOutDate)
              : null
            const payments = paymentsByRoom[room.id] ?? []
            const minibarCharges = minibarChargesByRoom[room.id] ?? []
            const minibarTotal = sumMinibarCharges(minibarCharges)
            const netAdvances = calculateNetAdvances(payments)
            const balance = room.billing ? calculateBalanceDue(room.billing.total + minibarTotal, payments) : null

            return (
              <article
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                onFocusCapture={() => setActiveRoomId(room.id)}
                className="rounded-lg border border-wine-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-ink-900">Hab. {room.number}</h3>
                  <StatusBadge status={room.status} />
                </div>

                {room.guest && (
                  <dl className="mb-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-ink-500">Huésped</dt>
                      <dd className="font-medium text-ink-800">{room.guest.fullName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-500">Documento</dt>
                      <dd className="text-ink-700">{room.guest.documentId}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-500">Teléfono</dt>
                      <dd className="text-ink-700">{room.guest.phone}</dd>
                    </div>
                    {room.billing?.checkInDate && (
                      <div className="flex justify-between">
                        <dt className="text-ink-500">Estadía</dt>
                        <dd className="text-ink-700">
                          {room.billing.checkInDate} → {room.billing.checkOutDate} ({nights} noche
                          {nights === 1 ? '' : 's'})
                        </dd>
                      </div>
                    )}
                  </dl>
                )}

                {/* Antes del bloque de saldo a propósito: primero se
                    registra qué consumió el huésped, luego se ve el saldo
                    actualizado con eso incluido (el minibar es un cargo, no
                    un pago — sube el saldo en vez de bajarlo). */}
                {room.billing && (
                  <MinibarPanel
                    room={room}
                    charges={minibarCharges}
                    products={minibarProducts}
                    onAddCharge={(productId, quantity) => handleAddMinibarCharge(room.id, productId, quantity)}
                  />
                )}

                {room.billing && (
                  <dl className="mb-3 space-y-2 text-sm">
                    <div className="flex justify-between border-t border-ink-200 pt-2">
                      <dt className="text-ink-500">Total de la estadía</dt>
                      <dd className="font-medium text-ink-800">${room.billing.total.toFixed(2)}</dd>
                    </div>
                    {minibarTotal > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-ink-500">Consumo de minibar</dt>
                        <dd className="text-wine-700">+ ${minibarTotal.toFixed(2)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-ink-500">Anticipos registrados</dt>
                      <dd className="text-emerald-700">− ${netAdvances.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-ink-200 pt-2">
                      <dt className="text-ink-500">Saldo</dt>
                      <dd className={`text-lg font-bold ${balance < 0 ? 'text-emerald-700' : 'text-wine-700'}`}>
                        {balance < 0 ? '−' : ''}${Math.abs(balance).toFixed(2)}
                        <span className="ml-1 text-xs font-normal text-ink-500">
                          {balance > 0 ? 'por cobrar' : balance < 0 ? 'por devolver' : 'saldado'}
                        </span>
                      </dd>
                    </div>
                  </dl>
                )}

                {room.billing && <SettlementAction room={room} balance={balance} onSettle={handleSettle} />}

                {/* Bug 1 crítico: no se permite liberar la habitación con saldo
                    pendiente sin pasar por el flujo explícito de checkout forzado —
                    ver POST /api/checkout en server/index.js, que hace cumplir esto
                    mismo aunque se llame directo a la API. */}
                <button
                  type="button"
                  disabled={room.billing && balance !== 0}
                  onClick={() => handleCheckOut(room.id)}
                  className="mt-4 w-full rounded-md bg-amber-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-500 disabled:hover:bg-ink-200"
                >
                  Procesar Check-out
                </button>
                {room.billing && balance !== 0 && (
                  <p className="mt-2 text-xs text-wine-700">
                    No se puede procesar el check-out con saldo {balance > 0 ? 'por cobrar' : 'por devolver'} — use
                    el botón de arriba para saldarlo, o "Salida sin pago completo" si el huésped ya se retiró.
                  </p>
                )}
                {room.billing && (
                  <ForcedCheckoutAction room={room} balance={balance} onForceCheckOut={handleForceCheckOut} />
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
