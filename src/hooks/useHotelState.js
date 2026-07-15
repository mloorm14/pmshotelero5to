import { useEffect, useState } from 'react'
import { INITIAL_ROOMS, ROOM_STATUSES } from '../constants/rooms'
import { RESERVATION_STATUSES } from '../constants/reservations'
import { loadState, saveState } from '../utils/storage'

function createInitialState() {
  return {
    rooms: INITIAL_ROOMS,
    checkInHistory: [],
    checkOutHistory: [],
    reservations: [],
  }
}

function normalizeState(saved) {
  if (!saved?.rooms) return createInitialState()

  const rooms = INITIAL_ROOMS.map((template) => {
    const savedRoom = saved.rooms.find((r) => r.id === template.id)
    if (!savedRoom) return { ...template }
    return {
      ...template,
      ...savedRoom,
      guest: savedRoom.guest ?? null,
      billing: savedRoom.billing ?? null,
    }
  })

  return {
    rooms,
    checkInHistory: saved.checkInHistory ?? [],
    checkOutHistory: saved.checkOutHistory ?? [],
    reservations: saved.reservations ?? [],
  }
}

export function useHotelState() {
  const [state, setState] = useState(() => {
    const saved = loadState()
    return saved ? normalizeState(saved) : createInitialState()
  })

  useEffect(() => {
    saveState(state)
  }, [state])

  function checkIn(roomId, guest, billing) {
    setState((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              status: ROOM_STATUSES.OCCUPIED,
              guest,
              billing,
            }
          : room,
      ),
      checkInHistory: [
        {
          id: Date.now(),
          roomId,
          roomNumber: prev.rooms.find((r) => r.id === roomId)?.number,
          guest,
          billing,
          at: new Date().toISOString(),
        },
        ...prev.checkInHistory,
      ],
    }))
  }

  function checkOut(roomId) {
    setState((prev) => {
      const room = prev.rooms.find((r) => r.id === roomId)
      return {
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === roomId
            ? { ...r, status: ROOM_STATUSES.DIRTY, guest: null, billing: null }
            : r,
        ),
        checkOutHistory: [
          {
            id: Date.now(),
            roomId,
            roomNumber: room?.number,
            guest: room?.guest,
            billing: room?.billing,
            at: new Date().toISOString(),
          },
          ...prev.checkOutHistory,
        ],
      }
    })
  }

  function addReservation({ roomId, guestName, checkInDate, checkOutDate }) {
    setState((prev) => {
      const room = prev.rooms.find((r) => r.id === roomId)
      const reservation = {
        id: Date.now(),
        roomId,
        roomNumber: room?.number,
        guestName: guestName.trim(),
        checkInDate,
        checkOutDate,
        status: RESERVATION_STATUSES.PENDING,
        checkedIn: false,
        createdAt: new Date().toISOString(),
      }
      return { ...prev, reservations: [reservation, ...prev.reservations] }
    })
  }

  function confirmReservation(reservationId) {
    setState((prev) => ({
      ...prev,
      reservations: prev.reservations.map((r) =>
        r.id === reservationId ? { ...r, status: RESERVATION_STATUSES.CONFIRMED } : r,
      ),
    }))
  }

  function cancelReservation(reservationId) {
    setState((prev) => ({
      ...prev,
      reservations: prev.reservations.map((r) =>
        r.id === reservationId ? { ...r, status: RESERVATION_STATUSES.CANCELLED } : r,
      ),
    }))
  }

  function markReservationCheckedIn(reservationId) {
    setState((prev) => ({
      ...prev,
      reservations: prev.reservations.map((r) =>
        r.id === reservationId ? { ...r, checkedIn: true } : r,
      ),
    }))
  }

  function markAsClean(roomId) {
    setState((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) =>
        room.id === roomId ? { ...room, status: ROOM_STATUSES.CLEAN } : room,
      ),
    }))
  }

  function toggleMaintenance(roomId) {
    setState((prev) => ({
      ...prev,
      rooms: prev.rooms.map((room) => {
        if (room.id !== roomId) return room
        if (room.status === ROOM_STATUSES.MAINTENANCE) {
          return { ...room, status: ROOM_STATUSES.CLEAN }
        }
        return { ...room, status: ROOM_STATUSES.MAINTENANCE, guest: null, billing: null }
      }),
    }))
  }

  return {
    rooms: state.rooms,
    checkInHistory: state.checkInHistory,
    checkOutHistory: state.checkOutHistory,
    reservations: state.reservations,
    checkIn,
    checkOut,
    markAsClean,
    toggleMaintenance,
    addReservation,
    confirmReservation,
    cancelReservation,
    markReservationCheckedIn,
  }
}
