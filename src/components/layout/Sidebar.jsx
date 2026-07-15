import { ROLES } from '../../constants/roles'
import { canAccessModule } from '../../utils/roles'

const NAV_ITEMS = [
  { id: 'reservations', label: 'Reservas', description: 'Gestión de reservas', icon: '📅' },
  { id: 'reception', label: 'Recepción', description: 'Check-in', icon: '🛎️' },
  { id: 'checkout', label: 'Caja y Salidas', description: 'Check-out', icon: '💳' },
  { id: 'housekeeping', label: 'Ama de Llaves', description: 'Estado de habitaciones', icon: '🧹' },
  { id: 'reports', label: 'Reportes', description: 'Auditoría y facturación', icon: '📊' },
  { id: 'about', label: 'Acerca del sistema', description: 'Mapa de subsistemas', icon: 'ℹ️' },
]

export default function Sidebar({ activeModule, onNavigate, stats, role, onRoleChange }) {
  const visibleItems = NAV_ITEMS.filter((item) => canAccessModule(role, item.id))

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-red-900/30 bg-black text-white">
      <div className="border-b border-red-900/30 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-800 text-lg font-bold">
            H
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-100">PMS Hotelero</h1>
            <p className="text-xs text-zinc-500">Prototipo V&amp;V</p>
          </div>
        </div>
      </div>

      <div className="border-b border-red-900/30 px-5 py-4">
        <label htmlFor="role" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Rol actual
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value={ROLES.RECEPTIONIST}>{ROLES.RECEPTIONIST}</option>
          <option value={ROLES.ADMIN}>{ROLES.ADMIN}</option>
        </select>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => {
          const isActive = activeModule === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full rounded-xl px-4 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-red-800 text-white shadow-lg shadow-red-950/50'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className={`block text-xs ${isActive ? 'text-red-200' : 'text-zinc-600'}`}>
                    {item.description}
                  </span>
                </span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-red-900/30 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">Resumen</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-zinc-900 px-3 py-2">
            <span className="text-zinc-500">Limpias</span>
            <p className="text-lg font-bold text-emerald-400">{stats.clean}</p>
          </div>
          <div className="rounded-lg bg-zinc-900 px-3 py-2">
            <span className="text-zinc-500">Ocupadas</span>
            <p className="text-lg font-bold text-red-400">{stats.occupied}</p>
          </div>
          <div className="rounded-lg bg-zinc-900 px-3 py-2">
            <span className="text-zinc-500">Sucias</span>
            <p className="text-lg font-bold text-amber-400">{stats.dirty}</p>
          </div>
          <div className="rounded-lg bg-zinc-900 px-3 py-2">
            <span className="text-zinc-500">Mantenimiento</span>
            <p className="text-lg font-bold text-rose-400">{stats.maintenance}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
