import { useEffect, useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import ReservationsPage from './pages/ReservationsPage'
import ReceptionPage from './pages/ReceptionPage'
import CheckoutPage from './pages/CheckoutPage'
import HousekeepingPage from './pages/HousekeepingPage'
import ReportsPage from './pages/ReportsPage'
import AboutPage from './pages/AboutPage'
import { useHotelState } from './hooks/useHotelState'
import { ROOM_STATUSES } from './constants/rooms'
import { ROLES } from './constants/roles'
import { canAccessModule, getAccessibleModules } from './utils/roles'
import { loadRole, saveRole } from './utils/storage'

export default function App() {
  const [role, setRole] = useState(() => loadRole() ?? ROLES.RECEPTIONIST)
  const [activeModule, setActiveModule] = useState('reservations')
  const {
    rooms,
    reservations,
    loading,
    checkIn,
    checkOut,
    markAsClean,
    toggleMaintenance,
    addReservation,
    confirmReservation,
    cancelReservation,
    markReservationCheckedIn,
  } = useHotelState()

  useEffect(() => {
    saveRole(role)
  }, [role])

  function handleRoleChange(nextRole) {
    setRole(nextRole)
    if (!canAccessModule(nextRole, activeModule)) {
      setActiveModule(getAccessibleModules(nextRole)[0])
    }
  }

  const stats = {
    clean: rooms.filter((r) => r.status === ROOM_STATUSES.CLEAN).length,
    occupied: rooms.filter((r) => r.status === ROOM_STATUSES.OCCUPIED).length,
    dirty: rooms.filter((r) => r.status === ROOM_STATUSES.DIRTY).length,
    maintenance: rooms.filter((r) => r.status === ROOM_STATUSES.MAINTENANCE).length,
  }

  const canViewActiveModule = canAccessModule(role, activeModule)

  return (
    <AppLayout activeModule={activeModule} onNavigate={setActiveModule} stats={stats} role={role} onRoleChange={handleRoleChange}>
      {loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-500">Cargando datos desde la API…</p>
        </div>
      )}
      {!loading && !canViewActiveModule && (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 p-12 text-center shadow-sm">
          <p className="text-sm text-zinc-500">Este módulo no está disponible para el rol seleccionado.</p>
        </div>
      )}
      {!loading && canViewActiveModule && activeModule === 'reservations' && (
        <ReservationsPage
          rooms={rooms}
          reservations={reservations}
          onAddReservation={addReservation}
          onConfirmReservation={confirmReservation}
          onCancelReservation={cancelReservation}
        />
      )}
      {!loading && canViewActiveModule && activeModule === 'reception' && (
        <ReceptionPage
          rooms={rooms}
          reservations={reservations}
          onCheckIn={checkIn}
          onConvertReservation={markReservationCheckedIn}
        />
      )}
      {!loading && canViewActiveModule && activeModule === 'checkout' && (
        <CheckoutPage rooms={rooms} onCheckOut={checkOut} />
      )}
      {!loading && canViewActiveModule && activeModule === 'housekeeping' && (
        <HousekeepingPage
          rooms={rooms}
          onMarkAsClean={markAsClean}
          onToggleMaintenance={toggleMaintenance}
        />
      )}
      {!loading && canViewActiveModule && activeModule === 'reports' && <ReportsPage rooms={rooms} />}
      {!loading && canViewActiveModule && activeModule === 'about' && <AboutPage />}
    </AppLayout>
  )
}
