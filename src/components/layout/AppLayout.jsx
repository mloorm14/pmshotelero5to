import Sidebar from './Sidebar'
import LogPanel from '../logging/LogPanel'

const TITLES = {
  reservations: 'Reservas',
  reception: 'Recepción — Check-in',
  checkout: 'Caja y Salidas — Check-out',
  housekeeping: 'Ama de Llaves — Estado de Habitaciones',
  reports: 'Reportes y Auditoría',
  about: 'Acerca del sistema',
}

export default function AppLayout({ activeModule, onNavigate, stats, role, onRoleChange, children }) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar
        activeModule={activeModule}
        onNavigate={onNavigate}
        stats={stats}
        role={role}
        onRoleChange={onRoleChange}
      />
      <div className="flex flex-1 flex-col">
        <header className="border-b border-zinc-800 bg-zinc-950 px-8 py-5">
          <h2 className="text-xl font-bold text-zinc-100">{TITLES[activeModule]}</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Datos persistentes en PostgreSQL — Rol: {role}
          </p>
        </header>
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-8">{children}</main>
        <LogPanel />
      </div>
    </div>
  )
}
