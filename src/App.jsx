import { useEffect, useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import UserSelector from './components/auth/UserSelector'
import ReservationsPage from './pages/ReservationsPage'
import ReceptionPage from './pages/ReceptionPage'
import CheckoutPage from './pages/CheckoutPage'
import HousekeepingPage from './pages/HousekeepingPage'
import RoomsPage from './pages/RoomsPage'
import AvailabilityPage from './pages/AvailabilityPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import MinibarPage from './pages/MinibarPage'
import AboutPage from './pages/AboutPage'
import { useHotelState } from './hooks/useHotelState'
import { ROOM_STATUSES } from './constants/rooms'
import { canAccessModule, getAccessibleModules } from './utils/roles'
import { loadSession, saveSession } from './utils/storage'
import { countCheckoutAlerts } from './utils/alerts'

export default function App() {
  const [session, setSession] = useState(() => loadSession())
  const [activeModule, setActiveModule] = useState('reservations')
  const {
    rooms,
    reservations,
    users,
    minibarProducts,
    loading,
    checkIn,
    checkOut,
    markAsClean,
    toggleMaintenance,
    addReservation,
    confirmReservation,
    cancelReservation,
    startReservation,
    addRoom,
    updateRoomDetails,
    deleteRoom,
    addPayment,
    addUser,
    updateUser,
    addMinibarProduct,
    updateMinibarProduct,
    addMinibarCharge,
  } = useHotelState()

  // Revalida la sesión guardada contra la lista real de usuarios activos al
  // montar (y de paso, en cada refresh posterior — es una comparación
  // barata): si el usuario fue desactivado entre sesiones, se limpia la
  // sesión y se fuerza a elegir usuario de nuevo en vez de dejarlo operando
  // con una cuenta que un Administrador ya dio de baja.
  useEffect(() => {
    if (loading) return
    if (!session) return
    const stillActive = users.some((u) => u.id === session.userId && u.active)
    if (!stillActive) {
      setSession(null)
      saveSession(null)
    }
  }, [loading, users, session])

  function handleLogin(user) {
    const nextSession = { userId: user.id, fullName: user.fullName, username: user.username, role: user.role }
    setSession(nextSession)
    saveSession(nextSession)
    if (!canAccessModule(nextSession.role, activeModule)) {
      setActiveModule(getAccessibleModules(nextSession.role)[0])
    }
  }

  function handleLogout() {
    setSession(null)
    saveSession(null)
  }

  // Sin sesión (primera visita, logout, o sesión invalidada arriba): pantalla
  // de selección de usuario antes que cualquier otra cosa, en vez del layout
  // normal.
  if (!session) {
    return <UserSelector users={users} loading={loading} onLogin={handleLogin} />
  }

  // Login simulado (sin JWT/sesión de servidor): estas llamadas agregan
  // userId/version/actingRole tomados de la sesión local antes de pegarle a
  // la API — así los componentes hijos (ReceptionPage, CheckoutPage,
  // UsersPage, etc.) no necesitan saber nada de sesión, solo siguen llamando
  // a las mismas props que ya tenían.
  function handleCheckIn(roomId, guest, billing) {
    return checkIn(roomId, guest, billing, { userId: session.userId })
  }

  function handleCheckOut(roomId, options = {}) {
    const room = rooms.find((r) => r.id === roomId)
    return checkOut(roomId, { ...options, userId: session.userId, version: room?.version })
  }

  function handleAddReservation(payload) {
    return addReservation({ ...payload, userId: session.userId })
  }

  function handleAddPayment(payload) {
    const room = rooms.find((r) => r.id === payload.roomId)
    return addPayment({ ...payload, userId: session.userId, version: room?.version })
  }

  function handleAddUser(payload) {
    return addUser({ ...payload, actingRole: session.role })
  }

  function handleUpdateUser(userId, patch) {
    return updateUser(userId, { ...patch, actingRole: session.role })
  }

  function handleAddMinibarProduct(payload) {
    return addMinibarProduct({ ...payload, actingRole: session.role })
  }

  function handleUpdateMinibarProduct(productId, patch) {
    return updateMinibarProduct(productId, { ...patch, actingRole: session.role })
  }

  function handleAddMinibarCharge(payload) {
    return addMinibarCharge({ ...payload, userId: session.userId })
  }

  const stats = {
    clean: rooms.filter((r) => r.status === ROOM_STATUSES.CLEAN).length,
    occupied: rooms.filter((r) => r.status === ROOM_STATUSES.OCCUPIED).length,
    dirty: rooms.filter((r) => r.status === ROOM_STATUSES.DIRTY).length,
    maintenance: rooms.filter((r) => r.status === ROOM_STATUSES.MAINTENANCE).length,
  }
  const alertCount = countCheckoutAlerts(rooms)

  const canViewActiveModule = canAccessModule(session.role, activeModule)

  return (
    <AppLayout
      activeModule={activeModule}
      onNavigate={setActiveModule}
      stats={stats}
      alertCount={alertCount}
      session={session}
      onLogout={handleLogout}
    >
      {loading && (
        <div className="rounded-lg border border-ink-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-ink-500">Cargando datos desde la API…</p>
        </div>
      )}
      {!loading && !canViewActiveModule && (
        <div className="rounded-lg border border-dashed border-ink-300 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-ink-500">Este módulo no está disponible para el rol seleccionado.</p>
        </div>
      )}
      {!loading && canViewActiveModule && activeModule === 'reservations' && (
        <ReservationsPage
          rooms={rooms}
          reservations={reservations}
          onAddReservation={handleAddReservation}
          onConfirmReservation={confirmReservation}
          onCancelReservation={cancelReservation}
        />
      )}
      {!loading && canViewActiveModule && activeModule === 'reception' && (
        <ReceptionPage
          rooms={rooms}
          reservations={reservations}
          onCheckIn={handleCheckIn}
          onAddPayment={handleAddPayment}
          onConvertReservation={startReservation}
        />
      )}
      {!loading && canViewActiveModule && activeModule === 'checkout' && (
        <CheckoutPage
          rooms={rooms}
          onCheckOut={handleCheckOut}
          onAddPayment={handleAddPayment}
          onAddMinibarCharge={handleAddMinibarCharge}
        />
      )}
      {!loading && canViewActiveModule && activeModule === 'housekeeping' && (
        <HousekeepingPage
          rooms={rooms}
          onMarkAsClean={markAsClean}
          onToggleMaintenance={toggleMaintenance}
        />
      )}
      {!loading && canViewActiveModule && activeModule === 'rooms' && (
        <RoomsPage
          rooms={rooms}
          reservations={reservations}
          onAddRoom={addRoom}
          onUpdateRoom={updateRoomDetails}
          onDeleteRoom={deleteRoom}
        />
      )}
      {!loading && canViewActiveModule && activeModule === 'availability' && (
        <AvailabilityPage rooms={rooms} reservations={reservations} />
      )}
      {!loading && canViewActiveModule && activeModule === 'reports' && <ReportsPage rooms={rooms} />}
      {!loading && canViewActiveModule && activeModule === 'users' && (
        <UsersPage users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} />
      )}
      {!loading && canViewActiveModule && activeModule === 'minibar' && (
        <MinibarPage
          products={minibarProducts}
          onAddProduct={handleAddMinibarProduct}
          onUpdateProduct={handleUpdateMinibarProduct}
        />
      )}
      {!loading && canViewActiveModule && activeModule === 'about' && <AboutPage />}
    </AppLayout>
  )
}
