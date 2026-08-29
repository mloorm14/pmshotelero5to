import { useState } from 'react'
import { ROOM_STATUSES } from '../constants/rooms'
import { RESERVATION_STATUSES } from '../constants/reservations'
import { hasDateOverlap } from '../utils/reservations'
import { toDateOnly, addDaysISO, getTodayISO } from '../utils/dates'

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function pad(value) {
  return String(value).padStart(2, '0')
}

function isoOf(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

// Grilla mensual hecha a mano (sin dependencias nuevas): celdas vacías para
// completar la primera semana + un dia ISO por cada dia del mes.
function buildMonthGrid(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(isoOf(year, month, day))
  return cells
}

export default function AvailabilityPage({ rooms, reservations }) {
  const today = new Date()
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? null)
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)

  const room = rooms.find((r) => r.id === Number(roomId)) ?? null

  // La estadia en curso (habitacion Ocupada) no es una fila de `reservations`,
  // así que se modela como una reserva Confirmada "sintética" y se reutiliza
  // `hasDateOverlap` (misma regla que Reservas) para decidir qué días bloquear.
  const effectiveReservations =
    room?.status === ROOM_STATUSES.OCCUPIED && room.billing?.checkOutDate
      ? [
          ...reservations,
          {
            id: -1,
            roomId: room.id,
            guestName: room.guest?.fullName ?? 'Huésped actual',
            status: RESERVATION_STATUSES.CONFIRMED,
            checkInDate: room.billing.checkInDate,
            checkOutDate: room.billing.checkOutDate,
          },
        ]
      : reservations

  const cells = buildMonthGrid(year, month)

  function isDayBlocked(dayISO) {
    if (!room || !dayISO) return false
    return hasDateOverlap(effectiveReservations, room.id, dayISO, addDaysISO(dayISO, 1))
  }

  function findOccupant(dayISO) {
    if (!room || !dayISO) return null
    const day = toDateOnly(dayISO)
    return effectiveReservations.find((reservation) => {
      if (reservation.roomId !== room.id) return false
      if (reservation.status === RESERVATION_STATUSES.CANCELLED) return false
      const start = toDateOnly(reservation.checkInDate)
      const end = toDateOnly(reservation.checkOutDate)
      return day >= start && day < end
    })
  }

  function goToPrevMonth() {
    setSelectedDay(null)
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function goToNextMonth() {
    setSelectedDay(null)
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const selectedOccupant = selectedDay ? findOccupant(selectedDay) : null

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[2fr_1fr]">
      <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-ink-900">Disponibilidad</h3>
            <p className="text-sm text-ink-500">Días bloqueados por reservas activas o la estadía en curso</p>
          </div>
          <select
            value={roomId ?? ''}
            onChange={(e) => {
              setRoomId(Number(e.target.value))
              setSelectedDay(null)
            }}
            className="rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Hab. {r.number}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goToPrevMonth}
            aria-label="Mes anterior"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-ink-300 text-ink-600 transition-colors hover:border-wine-600 hover:text-wine-700"
          >
            <svg className="h-4 w-4" aria-hidden="true">
              <use href="/icons.svg#icon-chevron-left" />
            </svg>
          </button>
          <p className="text-sm font-semibold text-ink-900">
            {MONTH_LABELS[month]} {year}
          </p>
          <button
            type="button"
            onClick={goToNextMonth}
            aria-label="Mes siguiente"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-ink-300 text-ink-600 transition-colors hover:border-wine-600 hover:text-wine-700"
          >
            <svg className="h-4 w-4" aria-hidden="true">
              <use href="/icons.svg#icon-chevron-right" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wider text-ink-400">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((dayISO, idx) => {
            if (!dayISO) return <div key={`blank-${idx}`} />

            const blocked = isDayBlocked(dayISO)
            const isToday = dayISO === getTodayISO()
            const isSelected = selectedDay === dayISO
            const dayNumber = Number(dayISO.slice(-2))

            return (
              <button
                key={dayISO}
                type="button"
                onClick={() => setSelectedDay(blocked ? dayISO : null)}
                disabled={!blocked}
                className={`flex h-12 flex-col items-center justify-center rounded-md border text-sm transition-colors ${
                  blocked
                    ? 'cursor-pointer border-wine-300 bg-wine-100 text-wine-800 hover:bg-wine-200'
                    : 'cursor-default border-ink-200 bg-emerald-50 text-ink-700'
                } ${isSelected ? 'ring-2 ring-wine-600 ring-offset-1 ring-offset-white' : ''} ${
                  isToday ? 'font-bold' : ''
                }`}
              >
                {dayNumber}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-ink-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-wine-500" /> Bloqueado
          </span>
        </div>
      </section>

      <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink-900">Detalle del día</h3>
          {selectedDay && (
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              aria-label="Limpiar selección"
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            >
              <svg className="h-4 w-4" aria-hidden="true">
                <use href="/icons.svg#icon-close" />
              </svg>
            </button>
          )}
        </div>
        {!selectedDay && (
          <p className="text-sm text-ink-500">Seleccione un día bloqueado en el calendario para ver quién lo ocupa.</p>
        )}
        {selectedDay && selectedOccupant && (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Día</dt>
              <dd className="font-medium text-ink-800">{selectedDay}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Huésped</dt>
              <dd className="font-medium text-ink-800">{selectedOccupant.guestName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Estadía</dt>
              <dd className="text-ink-700">
                {selectedOccupant.checkInDate} → {selectedOccupant.checkOutDate}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Origen</dt>
              <dd className="text-ink-700">
                {selectedOccupant.id === -1 ? 'Check-in en curso' : `Reserva ${selectedOccupant.status}`}
              </dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  )
}
