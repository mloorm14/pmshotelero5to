import { useCallback, useEffect, useState } from 'react'
import { ROOM_STATUSES } from '../constants/rooms'
import { RESERVATION_STATUSES } from '../constants/reservations'
import { api } from '../utils/api'
import { useLog } from '../context/useLog'

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
      return { ok: true }
    } catch (err) {
      addLog(`Check-in bloqueado: ${err.message}`, 'error')
      return { ok: false, error: err.message }
    }
  }

  async function checkOut(roomId, { forced, note } = {}) {
    const room = rooms.find((r) => r.id === roomId)
    try {
      await api.checkOut({ roomId, forced, note })
      addLog(
        forced
          ? `Check-out forzado (saldo pendiente): habitación ${room?.number ?? roomId}`
          : `Check-out exitoso: habitación ${room?.number ?? roomId}`,
        'success',
      )
      await refresh()
      return { ok: true }
    } catch (err) {
      addLog(`Check-out bloqueado: ${err.message}`, 'error')
      return { ok: false, error: err.message }
    }
  }

  async function addReservation({ roomId, guestName, checkInDate, checkOutDate, guestDocument, guestPhone }) {
    const room = rooms.find((r) => r.id === roomId)
    try {
      await api.addReservation({ roomId, guestName, checkInDate, checkOutDate, guestDocument, guestPhone })
      addLog(`Reserva creada: ${guestName} — habitación ${room?.number ?? roomId}`, 'success')
      await refresh()
      return { ok: true }
    } catch (err) {
      addLog(`Error al crear la reserva: ${err.message}`, 'error')
      return { ok: false, error: err.message }
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

  // Vincula una reserva Confirmada con el check-in que la usa (la marca 'En
  // curso'). El cierre a 'Finalizada' ocurre del lado del servidor, dentro
  // de la transacción de POST /api/checkout.
  async function startReservation(reservationId) {
    try {
      await api.updateReservation(reservationId, { status: RESERVATION_STATUSES.IN_PROGRESS })
      await refresh()
    } catch (err) {
      addLog(`Error al vincular la reserva con el check-in: ${err.message}`, 'error')
    }
  }

  async function addRoom({ number, capacity, defaultRate }) {
    try {
      await api.addRoom({ number, capacity, defaultRate })
      addLog(`Habitación ${number} creada`, 'success')
      await refresh()
      return { ok: true }
    } catch (err) {
      addLog(`Error al crear la habitación: ${err.message}`, 'error')
      return { ok: false, error: err.message }
    }
  }

  async function updateRoomDetails(roomId, { number, capacity, defaultRate }) {
    try {
      await api.updateRoom(roomId, { number, capacity, defaultRate })
      addLog(`Habitación ${number} actualizada`, 'success')
      await refresh()
      return { ok: true }
    } catch (err) {
      addLog(`Error al actualizar la habitación: ${err.message}`, 'error')
      return { ok: false, error: err.message }
    }
  }

  async function deleteRoom(roomId) {
    const room = rooms.find((r) => r.id === roomId)
    try {
      await api.deleteRoom(roomId)
      addLog(`Habitación ${room?.number ?? roomId} eliminada`, 'success')
      await refresh()
      return { ok: true }
    } catch (err) {
      addLog(`Error al eliminar la habitación: ${err.message}`, 'error')
      return { ok: false, error: err.message }
    }
  }

  async function addPayment({ roomId, type, amount, method }) {
    const room = rooms.find((r) => r.id === roomId)
    try {
      await api.addPayment({ roomId, type, amount, method })
      addLog(`${type} de $${Number(amount).toFixed(2)} registrado — habitación ${room?.number ?? roomId}`, 'success')
      await refresh()
      return { ok: true }
    } catch (err) {
      addLog(`Pago rechazado: ${err.message}`, 'error')
      return { ok: false, error: err.message }
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
    startReservation,
    addRoom,
    updateRoomDetails,
    deleteRoom,
    addPayment,
    refresh,
  }
}
