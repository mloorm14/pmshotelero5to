const NAV_ITEMS = [
  { id: 'reception', label: 'Recepción', description: 'Check-in', icon: '🛎️' },
  { id: 'checkout', label: 'Caja y Salidas', description: 'Check-out', icon: '💳' },
  { id: 'housekeeping', label: 'Ama de Llaves', description: 'Estado de habitaciones', icon: '🧹' },
]

export default function Sidebar({ activeModule, onNavigate, stats }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-white">
      <div className="border-b border-slate-700 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-lg font-bold">
            H
          </div>
          <div>
            <h1 className="text-base font-bold">PMS Hotelero</h1>
            <p className="text-xs text-slate-400">Prototipo V&amp;V</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = activeModule === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full rounded-xl px-4 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className={`block text-xs ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {item.description}
                  </span>
                </span>
              </span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-slate-700 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Resumen</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-slate-800 px-3 py-2">
            <span className="text-slate-400">Limpias</span>
            <p className="text-lg font-bold text-emerald-400">{stats.clean}</p>
          </div>
          <div className="rounded-lg bg-slate-800 px-3 py-2">
            <span className="text-slate-400">Ocupadas</span>
            <p className="text-lg font-bold text-indigo-400">{stats.occupied}</p>
          </div>
          <div className="rounded-lg bg-slate-800 px-3 py-2">
            <span className="text-slate-400">Sucias</span>
            <p className="text-lg font-bold text-amber-400">{stats.dirty}</p>
          </div>
          <div className="rounded-lg bg-slate-800 px-3 py-2">
            <span className="text-slate-400">Mantenimiento</span>
            <p className="text-lg font-bold text-rose-400">{stats.maintenance}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
