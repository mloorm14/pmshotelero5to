import { useState } from 'react'

export default function UserSelector({ users, loading, onLogin }) {
  const activeUsers = users.filter((u) => u.active)
  const [selectedId, setSelectedId] = useState(() => activeUsers[0]?.id ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    const user = activeUsers.find((u) => u.id === Number(selectedId))
    if (user) onLogin(user)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm rounded-lg border border-wine-900/30 bg-ink-900 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-wine-800 text-xl font-bold font-display text-white">
            H
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-50">PMS Hotelero</h1>
          <p className="mt-1 text-sm text-ink-400">Selecciona tu usuario para continuar</p>
        </div>

        {loading ? (
          <p className="text-center text-sm text-ink-400">Cargando usuarios…</p>
        ) : activeUsers.length === 0 ? (
          <p className="rounded-md border border-wine-800 bg-wine-950/40 px-4 py-3 text-center text-sm text-wine-200">
            No hay usuarios activos disponibles. Contacta a un Administrador para que active una cuenta.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="user-select" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
                Usuario
              </label>
              <select
                id="user-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2.5 text-sm text-ink-50 focus:outline-none focus:ring-2 focus:ring-wine-500"
              >
                {activeUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} — {user.role}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-wine-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-wine-800 focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2 focus:ring-offset-ink-900"
            >
              Entrar
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
