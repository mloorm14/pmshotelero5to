import { useState } from 'react'
import StatusBadge from '../shared/StatusBadge'
import InlineMessage from '../shared/InlineMessage'
import { ROOM_STATUSES } from '../../constants/rooms'
import { RESERVATION_STATUSES } from '../../constants/reservations'
import { validateRoom } from '../../utils/rooms'
import { useLog } from '../../context/useLog'
import { useTransientMessage } from '../../hooks/useTransientMessage'

export default function RoomList({ rooms, reservations, onUpdateRoom, onDeleteRoom }) {
  const { addLog } = useLog()
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [message, showMessage] = useTransientMessage()

  function startEdit(room) {
    setEditingId(room.id)
    setEditForm({
      number: room.number,
      capacity: String(room.capacity ?? 1),
      defaultRate: String(room.defaultRate ?? 0),
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(null)
  }

  async function submitEdit(roomId) {
    const draft = {
      number: editForm.number,
      capacity: Number.parseInt(editForm.capacity, 10),
      defaultRate: Number.parseFloat(editForm.defaultRate),
    }
    const { valid, errors } = validateRoom(draft, rooms, roomId)
    if (!valid) {
      addLog(`Error de validación de formulario: ${Object.values(errors)[0]}`, 'error')
      return
    }
    const result = await onUpdateRoom(roomId, draft)
    if (!result.ok) {
      showMessage(`No se pudo actualizar la habitación: ${result.error}`, 'error')
      return
    }
    showMessage(`Habitación ${draft.number.trim()} actualizada.`)
    cancelEdit()
  }

  async function handleDelete(room) {
    const result = await onDeleteRoom(room.id)
    if (!result.ok) {
      showMessage(`No se pudo eliminar la habitación ${room.number}: ${result.error}`, 'error')
      return
    }
    showMessage(`Habitación ${room.number} eliminada.`)
  }

  function hasActiveReservation(roomId) {
    return reservations.some(
      (r) =>
        r.roomId === roomId &&
        (r.status === RESERVATION_STATUSES.PENDING || r.status === RESERVATION_STATUSES.CONFIRMED),
    )
  }

  return (
    <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-ink-900">Habitaciones registradas</h3>
        <p className="text-sm text-ink-500">Edite tarifa/capacidad o elimine habitaciones sin estadía activa</p>
      </div>

      <InlineMessage message={message} />

      {rooms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 bg-ink-50 p-8 text-center">
          <p className="text-sm text-ink-500">Aún no hay habitaciones registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => {
            const isEditing = editingId === room.id
            const blockedByStatus = room.status === ROOM_STATUSES.OCCUPIED
            const blockedByReservation = hasActiveReservation(room.id)
            const canDelete = !blockedByStatus && !blockedByReservation

            return (
              <article key={room.id} className="rounded-lg border border-ink-200 bg-ink-50 p-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label htmlFor={`edit-number-${room.id}`} className="mb-1 block text-xs font-medium text-ink-600">
                          Número
                        </label>
                        <input
                          id={`edit-number-${room.id}`}
                          type="text"
                          value={editForm.number}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, number: e.target.value }))}
                          className="w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
                        />
                      </div>
                      <div>
                        <label htmlFor={`edit-capacity-${room.id}`} className="mb-1 block text-xs font-medium text-ink-600">
                          Capacidad
                        </label>
                        <input
                          id={`edit-capacity-${room.id}`}
                          type="number"
                          min="1"
                          step="1"
                          value={editForm.capacity}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, capacity: e.target.value }))}
                          className="w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
                        />
                      </div>
                      <div>
                        <label htmlFor={`edit-rate-${room.id}`} className="mb-1 block text-xs font-medium text-ink-600">
                          Tarifa por defecto
                        </label>
                        <input
                          id={`edit-rate-${room.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.defaultRate}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, defaultRate: e.target.value }))}
                          className="w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => submitEdit(room.id)}
                        className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-md border border-ink-300 px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-wine-600 hover:text-wine-700"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink-900">Hab. {room.number}</span>
                        <StatusBadge status={room.status} />
                      </div>
                      <p className="mt-1 text-xs text-ink-500">
                        Capacidad {room.capacity} huésped{room.capacity === 1 ? '' : 'es'} · Tarifa por defecto $
                        {Number(room.defaultRate ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(room)}
                        aria-label={`Editar habitación ${room.number}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-ink-300 text-ink-600 transition-colors hover:border-wine-600 hover:text-wine-700"
                      >
                        <svg className="h-4 w-4" aria-hidden="true">
                          <use href="/icons.svg#icon-edit" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(room)}
                        disabled={!canDelete}
                        aria-label={`Eliminar habitación ${room.number}`}
                        title={
                          canDelete
                            ? undefined
                            : 'No se puede eliminar: habitación ocupada o con reservas activas'
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-ink-300 text-ink-600 transition-colors hover:border-wine-600 hover:text-wine-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-300 disabled:hover:text-ink-600"
                      >
                        <svg className="h-4 w-4" aria-hidden="true">
                          <use href="/icons.svg#icon-trash" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
