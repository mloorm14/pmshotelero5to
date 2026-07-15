import { useCallback, useEffect, useState } from 'react'
import { ROOM_STATUSES } from '../constants/rooms'
import { RESERVATION_STATUSES } from '../constants/reservations'
import { api } from '../utils/api'
import { useLog } from '../context/LogContext'

export function useHotelState() {
  const { addLog } = useLog()
  const [rooms, setRooms] = useState([])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [roomsData, reservationsData] = await Promise.all([api.getRooms(), api.getReservations()])
      setRooms(roomsData)
      setReservations(reservationsData)
    } catch (err) {
      addLog(`Error de conexión con la API: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [addLog])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function checkIn(roomId, guest, billing) {
    const room = rooms.find((r) => r.id === roomId)
    try {
      await api.checkIn({ roomId, guest, billing })
      addLog(`Check-in exitoso: ${guest.fullName} en habitación ${room?.number ?? roomId}`, 'success')
      await refresh()
      return true
    } catch (err) {
      addLog(`Check-in bloqueado: ${err.message}`, 'error')
      return false
    }
  }

  async function checkOut(roomId) {
    const room = rooms.find((r) => r.id === roomId)
    try {
      await api.checkOut({ roomId })
      addLog(`Check-out exitoso: habitación ${room?.number ?? roomId}`, 'success')
      await refresh()
      return true
    } catch (err) {
      addLog(`Check-out bloqueado: ${err.message}`, 'error')
      return false
    }
  }

  async function addReservation({ roomId, guestName, checkInDate, checkOutDate }) {
    const room = rooms.find((r) => r.id === roomId)
    try {
      await api.addReservation({ roomId, guestName, checkInDate, checkOutDate })
      addLog(`Reserva creada: ${guestName} — habitación ${room?.number ?? roomId}`, 'success')
      await refresh()
      return true
    } catch (err) {
      addLog(`Error al crear la reserva: ${err.message}`, 'error')
      return false
    }
  }

  async function confirmReservation(reservationId) {
    try {
      await api.updateReservation(reservationId, { status: RESERVATION_STATUSES.CONFIRMED })
      addLog('Reserva confirmada', 'success')
      await refresh()
    } catch (err) {
      addLog(`Error al confirmar la reserva: ${err.message}`, 'error')
    }
  }

  async function cancelReservation(reservationId) {
    try {
      await api.updateReservation(reservationId, { status: RESERVATION_STATUSES.CANCELLED })
      addLog('Reserva cancelada', 'success')
      await refresh()
    } catch (err) {
      addLog(`Error al cancelar la reserva: ${err.message}`, 'error')
    }
  }

  async function markReservationCheckedIn(reservationId) {
    try {
      await api.updateReservation(reservationId, { checkedIn: true })
      await refresh()
    } catch (err) {
      addLog(`Error al vincular la reserva con el check-in: ${err.message}`, 'error')
    }
  }

  async function markAsClean(roomId) {
    const room = rooms.find((r) => r.id === roomId)
    try {
      await api.updateRoom(roomId, { status: ROOM_STATUSES.CLEAN })
      addLog(`Habitación ${room?.number ?? roomId} marcada como limpia`, 'success')
      await refresh()
    } catch (err) {
      addLog(`Error al actualizar la habitación: ${err.message}`, 'error')
    }
  }

  async function toggleMaintenance(roomId) {
    const room = rooms.find((r) => r.id === roomId)
    const goingIntoMaintenance = room?.status !== ROOM_STATUSES.MAINTENANCE

    try {
      if (goingIntoMaintenance) {
        await api.updateRoom(roomId, { status: ROOM_STATUSES.MAINTENANCE, guest: null, billing: null })
        addLog(`Habitación ${room?.number ?? roomId} enviada a mantenimiento`, 'success')
      } else {
        await api.updateRoom(roomId, { status: ROOM_STATUSES.CLEAN })
        addLog(`Habitación ${room?.number ?? roomId} finalizó mantenimiento`, 'success')
      }
      await refresh()
    } catch (err) {
      addLog(`Error al actualizar la habitación: ${err.message}`, 'error')
    }
  }

  return {
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
    refresh,
  }
}
