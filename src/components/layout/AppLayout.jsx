import Sidebar from './Sidebar'

export default function AppLayout({ activeModule, onNavigate, stats, children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar activeModule={activeModule} onNavigate={onNavigate} stats={stats} />
      <div className="flex flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-8 py-5">
          <h2 className="text-xl font-bold text-slate-900">
            {activeModule === 'reception' && 'Recepción — Check-in'}
            {activeModule === 'checkout' && 'Caja y Salidas — Check-out'}
            {activeModule === 'housekeeping' && 'Ama de Llaves — Estado de Habitaciones'}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Datos persistentes en localStorage
          </p>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">{children}</main>
      </div>
    </div>
  )
}
