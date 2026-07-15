import { useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import ReceptionPage from './pages/ReceptionPage'
import CheckoutPage from './pages/CheckoutPage'
import HousekeepingPage from './pages/HousekeepingPage'
import { useHotelState } from './hooks/useHotelState'
import { ROOM_STATUSES } from './constants/rooms'

export default function App() {
  const [activeModule, setActiveModule] = useState('reception')
  const { rooms, checkIn, checkOut, markAsClean, toggleMaintenance } = useHotelState()

  const stats = {
    clean: rooms.filter((r) => r.status === ROOM_STATUSES.CLEAN).length,
    occupied: rooms.filter((r) => r.status === ROOM_STATUSES.OCCUPIED).length,
    dirty: rooms.filter((r) => r.status === ROOM_STATUSES.DIRTY).length,
    maintenance: rooms.filter((r) => r.status === ROOM_STATUSES.MAINTENANCE).length,
  }

  return (
    <AppLayout activeModule={activeModule} onNavigate={setActiveModule} stats={stats}>
      {activeModule === 'reception' && (
        <ReceptionPage rooms={rooms} onCheckIn={checkIn} />
      )}
      {activeModule === 'checkout' && (
        <CheckoutPage rooms={rooms} onCheckOut={checkOut} />
      )}
      {activeModule === 'housekeeping' && (
        <HousekeepingPage
          rooms={rooms}
          onMarkAsClean={markAsClean}
          onToggleMaintenance={toggleMaintenance}
        />
      )}
    </AppLayout>
  )
}
