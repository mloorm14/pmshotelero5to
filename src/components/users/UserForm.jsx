import { useState } from 'react'
import RequiredLabel from '../shared/RequiredLabel'
import InlineMessage from '../shared/InlineMessage'
import { ROLES } from '../../constants/roles'
import { useLog } from '../../context/useLog'
import { useTransientMessage } from '../../hooks/useTransientMessage'

function createEmptyForm() {
  return { fullName: '', username: '', role: ROLES.RECEPTIONIST }
}

function validateUserDraft({ fullName, username }) {
  const errors = {}
  if (!fullName || fullName.trim() === '') errors.fullName = 'El nombre completo es obligatorio'
  if (!username || username.trim() === '') errors.username = 'El nombre de usuario es obligatorio'
  return { valid: Object.keys(errors).length === 0, errors }
}

export default function UserForm({ onAddUser }) {
  const { addLog } = useLog()
  const [form, setForm] = useState(createEmptyForm)
  const [touched, setTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [message, showMessage] = useTransientMessage()

  const { valid, errors } = validateUserDraft(form)
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

    const result = await onAddUser({
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      role: form.role,
    })
    if (!result.ok) {
      showMessage(`No se pudo crear el usuario: ${result.error}`, 'error')
      return
    }

    showMessage(`Usuario ${form.username.trim()} creado.`)
    setForm(createEmptyForm())
    setTouched({})
    setSubmitAttempted(false)
  }

  return (
    <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-ink-900">Nuevo Usuario</h3>
        <p className="text-sm text-ink-500">Login simulado — sin contraseña, solo nombre y rol</p>
      </div>

      <InlineMessage message={message} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <RequiredLabel htmlFor="fullName">Nombre completo</RequiredLabel>
          <input
            id="fullName"
            type="text"
            value={form.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            onBlur={() => handleBlur('fullName')}
            className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
              showError('fullName')
                ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
            }`}
            placeholder="Ej. Carla Reyes"
          />
          {showError('fullName') && <p className="mt-1 text-xs text-wine-700">{errors.fullName}</p>}
        </div>

        <div>
          <RequiredLabel htmlFor="username">Usuario</RequiredLabel>
          <input
            id="username"
            type="text"
            value={form.username}
            onChange={(e) => handleChange('username', e.target.value)}
            onBlur={() => handleBlur('username')}
            className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 ${
              showError('username')
                ? 'border-wine-600 focus:border-wine-600 focus:ring-wine-500/30'
                : 'border-ink-300 focus:border-wine-600 focus:ring-wine-500/30'
            }`}
            placeholder="Ej. carla.reyes"
          />
          {showError('username') && <p className="mt-1 text-xs text-wine-700">{errors.username}</p>}
          <p className="mt-1 text-xs text-ink-400">No se puede editar una vez creado el usuario.</p>
        </div>

        <div>
          <RequiredLabel htmlFor="role">Rol</RequiredLabel>
          <select
            id="role"
            value={form.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="w-full rounded-md border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
          >
            <option value={ROLES.RECEPTIONIST}>{ROLES.RECEPTIONIST}</option>
            <option value={ROLES.ADMIN}>{ROLES.ADMIN}</option>
          </select>
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
          Crear Usuario
        </button>
      </form>
    </section>
  )
}
