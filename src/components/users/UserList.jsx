import { useState } from 'react'
import InlineMessage from '../shared/InlineMessage'
import { ROLES } from '../../constants/roles'
import { useLog } from '../../context/useLog'
import { useTransientMessage } from '../../hooks/useTransientMessage'

export default function UserList({ users, onUpdateUser }) {
  const { addLog } = useLog()
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [message, showMessage] = useTransientMessage()

  function startEdit(user) {
    setEditingId(user.id)
    setEditForm({ fullName: user.fullName, role: user.role, active: user.active })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(null)
  }

  async function submitEdit(userId) {
    if (editForm.fullName.trim() === '') {
      addLog('Error de validación de formulario: El nombre completo es obligatorio', 'error')
      return
    }

    const result = await onUpdateUser(userId, {
      fullName: editForm.fullName.trim(),
      role: editForm.role,
      active: editForm.active,
    })
    if (!result.ok) {
      showMessage(`No se pudo actualizar el usuario: ${result.error}`, 'error')
      return
    }
    showMessage('Usuario actualizado.')
    cancelEdit()
  }

  return (
    <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-ink-900">Usuarios registrados</h3>
        <p className="text-sm text-ink-500">Editar nombre, rol o desactivar acceso — no se pueden eliminar usuarios</p>
      </div>

      <InlineMessage message={message} />

      {users.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 bg-ink-50 p-8 text-center">
          <p className="text-sm text-ink-500">Aún no hay usuarios registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-xs uppercase tracking-wider text-ink-500">
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Usuario</th>
                <th className="py-2 pr-4">Rol</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Creado</th>
                <th className="py-2 pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isEditing = editingId === user.id

                return (
                  <tr key={user.id} className="border-b border-ink-100 align-top">
                    {isEditing ? (
                      <>
                        <td className="py-2.5 pr-4">
                          <input
                            type="text"
                            value={editForm.fullName}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                            className="w-full rounded-md border border-ink-300 bg-white px-2 py-1.5 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
                          />
                        </td>
                        <td className="py-2.5 pr-4 text-ink-400">{user.username}</td>
                        <td className="py-2.5 pr-4">
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                            className="rounded-md border border-ink-300 bg-white px-2 py-1.5 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
                          >
                            <option value={ROLES.RECEPTIONIST}>{ROLES.RECEPTIONIST}</option>
                            <option value={ROLES.ADMIN}>{ROLES.ADMIN}</option>
                          </select>
                        </td>
                        <td className="py-2.5 pr-4">
                          <label className="flex items-center gap-2 text-xs text-ink-600">
                            <input
                              type="checkbox"
                              checked={editForm.active}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, active: e.target.checked }))}
                              className="h-4 w-4 rounded border-ink-300 text-wine-700 focus:ring-wine-500"
                            />
                            Activo
                          </label>
                        </td>
                        <td className="py-2.5 pr-4 text-ink-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 pr-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => submitEdit(user.id)}
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
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 pr-4 font-medium text-ink-900">{user.fullName}</td>
                        <td className="py-2.5 pr-4 text-ink-500">{user.username}</td>
                        <td className="py-2.5 pr-4 text-ink-700">{user.role}</td>
                        <td className="py-2.5 pr-4">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                              user.active
                                ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                                : 'border-ink-300 bg-ink-100 text-ink-600'
                            }`}
                          >
                            {user.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-ink-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 pr-4">
                          <button
                            type="button"
                            onClick={() => startEdit(user)}
                            aria-label={`Editar usuario ${user.fullName}`}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-ink-300 text-ink-600 transition-colors hover:border-wine-600 hover:text-wine-700"
                          >
                            <svg className="h-4 w-4" aria-hidden="true">
                              <use href="/icons.svg#icon-edit" />
                            </svg>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
