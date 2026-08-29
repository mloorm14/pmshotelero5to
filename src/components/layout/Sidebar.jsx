import { ROLES } from '../../constants/roles'
import { canAccessModule } from '../../utils/roles'

const NAV_ITEMS = [
  { id: 'reservations', label: 'Reservas', description: 'Gestión de reservas', icon: 'icon-reservations' },
  { id: 'reception', label: 'Recepción', description: 'Check-in', icon: 'icon-reception' },
  { id: 'checkout', label: 'Caja y Salidas', description: 'Check-out', icon: 'icon-checkout' },
  { id: 'housekeeping', label: 'Ama de Llaves', description: 'Estado de habitaciones', icon: 'icon-housekeeping' },
  { id: 'rooms', label: 'Habitaciones', description: 'Alta, baja y tarifas', icon: 'icon-rooms' },
  { id: 'availability', label: 'Disponibilidad', description: 'Calendario por habitación', icon: 'icon-availability' },
  { id: 'reports', label: 'Reportes', description: 'Auditoría y facturación', icon: 'icon-reports' },
  { id: 'about', label: 'Acerca del sistema', description: 'Mapa de subsistemas', icon: 'icon-about' },
]

export default function Sidebar({ activeModule, onNavigate, stats, alertCount, role, onRoleChange }) {
  const visibleItems = NAV_ITEMS.filter((item) => canAccessModule(role, item.id))

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-wine-900/30 bg-ink-950 text-white">
      <div className="border-b border-wine-900/30 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-wine-800 text-lg font-bold font-display">
            H
          </div>
          <div>
            <h1 className="text-base font-bold text-ink-50">PMS Hotelero</h1>
            <p className="text-xs text-ink-400">Prototipo V&amp;V</p>
          </div>
        </div>
      </div>

      <div className="border-b border-wine-900/30 px-5 py-4">
        <label htmlFor="role" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
          Rol actual
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-50 focus:outline-none focus:ring-2 focus:ring-wine-500"
        >
          <option value={ROLES.RECEPTIONIST}>{ROLES.RECEPTIONIST}</option>
          <option value={ROLES.ADMIN}>{ROLES.ADMIN}</option>
        </select>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const isActive = activeModule === item.id
          const showAlert = item.id === 'checkout' && alertCount > 0

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full rounded-md px-4 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-wine-800 text-white shadow-sm'
                  : 'text-ink-400 hover:bg-ink-900 hover:text-ink-100'
              }`}
            >
              <span className="flex items-center gap-3">
                <svg className="h-5 w-5 shrink-0" aria-hidden="true">
                  <use href={`/icons.svg#${item.icon}`} />
                </svg>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className={`block text-xs ${isActive ? 'text-wine-200' : 'text-ink-600'}`}>
                    {item.description}
                  </span>
                </span>
                {showAlert && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-ink-950">
                    {alertCount}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-wine-900/30 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-400">Resumen</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-ink-900 px-3 py-2">
            <span className="text-ink-400">Limpias</span>
            <p className="text-lg font-bold text-emerald-400">{stats.clean}</p>
          </div>
          <div className="rounded-md bg-ink-900 px-3 py-2">
            <span className="text-ink-400">Ocupadas</span>
            <p className="text-lg font-bold text-wine-400">{stats.occupied}</p>
          </div>
          <div className="rounded-md bg-ink-900 px-3 py-2">
            <span className="text-ink-400">Sucias</span>
            <p className="text-lg font-bold text-amber-400">{stats.dirty}</p>
          </div>
          <div className="rounded-md bg-ink-900 px-3 py-2">
            <span className="text-ink-400">Mantenimiento</span>
            <p className="text-lg font-bold text-rose-400">{stats.maintenance}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
