import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool } from './db.js'
import { validateRoom } from '../src/utils/rooms.js'
import { validatePayment, calculateBalanceDue, PAYMENT_TYPES } from '../src/utils/payments.js'
import { validateDocumentId, validatePhone } from '../src/utils/validation.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://127.0.0.1:5173'

app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())

function mapRoom(row) {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    defaultRate: row.default_rate !== null ? Number(row.default_rate) : null,
    capacity: row.capacity !== null ? Number(row.capacity) : null,
    guest: row.guest_name
      ? { fullName: row.guest_name, documentId: row.guest_document, phone: row.guest_phone }
      : null,
    billing:
      row.total !== null
        ? {
            baseRate: row.base_rate !== null ? Number(row.base_rate) : null,
            discount: row.discount !== null ? Number(row.discount) : null,
            total: Number(row.total),
            checkInDate: row.check_in_date,
            checkOutDate: row.check_out_date,
          }
        : null,
  }
}

function mapReservation(row) {
  return {
    id: row.id,
    roomId: row.room_id,
    roomNumber: row.room_number,
    guestName: row.guest_name,
    guestDocument: row.guest_document,
    guestPhone: row.guest_phone,
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    status: row.status,
    createdAt: row.created_at,
  }
}

function mapPayment(row) {
  return {
    id: row.id,
    roomId: row.room_id,
    stayId: row.stay_id,
    type: row.type,
    amount: Number(row.amount),
    method: row.method,
    note: row.note,
    createdAt: row.created_at,
  }
}

function mapHistoryEntry(row) {
  return {
    id: row.id,
    type: row.type,
    roomId: row.room_id,
    roomNumber: row.room_number,
    guestName: row.guest_name,
    guestDocument: row.guest_document,
    nights: row.nights !== null ? Number(row.nights) : null,
    total: row.total !== null ? Number(row.total) : null,
    note: row.note,
    at: row.created_at,
  }
}

// ---------------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------------

app.get('/api/rooms', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rooms ORDER BY id')
    res.json(rows.map(mapRoom))
  } catch (err) {
    next(err)
  }
})

app.put('/api/rooms/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, guest, billing, number, capacity, defaultRate } = req.body
    const sets = []
    const values = []
    let i = 1

    if (number !== undefined || capacity !== undefined || defaultRate !== undefined) {
      const parsedCapacity = Number.parseInt(capacity, 10)
      const parsedRate = Number.parseFloat(defaultRate)
      const existingRoomsResult = await pool.query('SELECT id, number FROM rooms')
      const { valid, errors } = validateRoom(
        { number, capacity: parsedCapacity, defaultRate: parsedRate },
        existingRoomsResult.rows,
        Number(id),
      )
      if (!valid) return res.status(400).json({ error: Object.values(errors)[0] })

      sets.push(`number = $${i++}`)
      values.push(number.trim())
      sets.push(`default_rate = $${i++}`)
      values.push(parsedRate)
      sets.push(`capacity = $${i++}`)
      values.push(parsedCapacity)
    }
    if (status !== undefined) {
      sets.push(`status = $${i++}`)
      values.push(status)
    }
    if (guest !== undefined) {
      sets.push(`guest_name = $${i++}`)
      values.push(guest?.fullName ?? null)
      sets.push(`guest_document = $${i++}`)
      values.push(guest?.documentId ?? null)
      sets.push(`guest_phone = $${i++}`)
      values.push(guest?.phone ?? null)
    }
    if (billing !== undefined) {
      sets.push(`base_rate = $${i++}`)
      values.push(billing?.baseRate ?? null)
      sets.push(`discount = $${i++}`)
      values.push(billing?.discount ?? null)
      sets.push(`total = $${i++}`)
      values.push(billing?.total ?? null)
      sets.push(`check_in_date = $${i++}`)
      values.push(billing?.checkInDate ?? null)
      sets.push(`check_out_date = $${i++}`)
      values.push(billing?.checkOutDate ?? null)
    }

    if (sets.length === 0) return res.status(400).json({ error: 'Nada para actualizar' })

    values.push(id)
    const { rows } = await pool.query(
      `UPDATE rooms SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Habitación no encontrada' })
    res.json(mapRoom(rows[0]))
  } catch (err) {
    next(err)
  }
})

app.post('/api/rooms', async (req, res, next) => {
  try {
    const { number, capacity, defaultRate } = req.body
    const parsedCapacity = Number.parseInt(capacity, 10)
    const parsedRate = Number.parseFloat(defaultRate)

    const existingRoomsResult = await pool.query('SELECT id, number FROM rooms')
    const { valid, errors } = validateRoom(
      { number, capacity: parsedCapacity, defaultRate: parsedRate },
      existingRoomsResult.rows,
    )
    if (!valid) return res.status(400).json({ error: Object.values(errors)[0] })

    const { rows } = await pool.query(
      `INSERT INTO rooms (number, status, default_rate, capacity)
       VALUES ($1, 'Limpia', $2, $3) RETURNING *`,
      [number.trim(), parsedRate, parsedCapacity],
    )
    res.status(201).json(mapRoom(rows[0]))
  } catch (err) {
    next(err)
  }
})

app.delete('/api/rooms/:id', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { id } = req.params
    await client.query('BEGIN')

    const roomResult = await client.query('SELECT * FROM rooms WHERE id = $1 FOR UPDATE', [id])
    const room = roomResult.rows[0]
    if (!room) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Habitación no encontrada' })
    }
    if (room.status === 'Ocupada') {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'No se puede eliminar: la habitación está Ocupada' })
    }

    const activeReservations = await client.query(
      `SELECT 1 FROM reservations WHERE room_id = $1 AND status IN ('Pendiente', 'Confirmada') LIMIT 1`,
      [id],
    )
    if (activeReservations.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'No se puede eliminar: tiene reservas activas' })
    }

    // Cubre el caso en que una habitación Ocupada con anticipos registrados
    // fue enviada a mantenimiento (o marcada Sucia) sin pasar por checkout:
    // la estadía nunca se cerró, así que el anticipo sigue "vivo" aunque el
    // estado actual de la habitación ya no sea "Ocupada".
    const unresolvedPayments = await client.query(
      `SELECT 1 FROM payments p
         JOIN check_in_history cih ON cih.id = p.stay_id
        WHERE p.room_id = $1
          AND NOT EXISTS (
            SELECT 1 FROM check_out_history coh
             WHERE coh.room_id = p.room_id AND coh.created_at > cih.created_at
          )
        LIMIT 1`,
      [id],
    )
    if (unresolvedPayments.rows.length > 0) {
      await client.query('ROLLBACK')
      return res
        .status(409)
        .json({ error: 'No se puede eliminar: tiene anticipos registrados en una estadía sin cerrar' })
    }

    await client.query('DELETE FROM rooms WHERE id = $1', [id])
    await client.query('COMMIT')
    res.status(204).send()
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
})

// ---------------------------------------------------------------------------
// Reservations
// ---------------------------------------------------------------------------

app.get('/api/reservations', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, rm.number AS room_number
         FROM reservations r
         JOIN rooms rm ON rm.id = r.room_id
        ORDER BY r.created_at DESC`,
    )
    res.json(rows.map(mapReservation))
  } catch (err) {
    next(err)
  }
})

app.post('/api/reservations', async (req, res, next) => {
  try {
    const { roomId, guestName, checkInDate, checkOutDate, guestDocument, guestPhone } = req.body
    if (!roomId || !guestName || !checkInDate || !checkOutDate) {
      return res.status(400).json({ error: 'Datos de reserva incompletos' })
    }

    // Documento/teléfono son opcionales en una reserva; si se envían, deben
    // tener un formato válido (mismas reglas que el check-in) — mismo patrón
    // "validar en UI y en la API" que el resto del proyecto.
    const trimmedDocument = guestDocument ? guestDocument.trim() : ''
    const trimmedPhone = guestPhone ? guestPhone.trim() : ''
    if (trimmedDocument !== '') {
      const documentValidation = validateDocumentId(trimmedDocument)
      if (!documentValidation.valid) return res.status(400).json({ error: documentValidation.error })
    }
    if (trimmedPhone !== '') {
      const phoneValidation = validatePhone(trimmedPhone)
      if (!phoneValidation.valid) return res.status(400).json({ error: phoneValidation.error })
    }

    const { rows } = await pool.query(
      `INSERT INTO reservations (room_id, guest_name, guest_document, guest_phone, check_in_date, check_out_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [roomId, guestName.trim(), trimmedDocument || null, trimmedPhone || null, checkInDate, checkOutDate],
    )
    const roomResult = await pool.query('SELECT number FROM rooms WHERE id = $1', [roomId])
    res.status(201).json(mapReservation({ ...rows[0], room_number: roomResult.rows[0]?.number }))
  } catch (err) {
    next(err)
  }
})

app.put('/api/reservations/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const sets = []
    const values = []
    let i = 1

    if (status !== undefined) {
      // Espejo del bloqueo de UI (el botón "Cancelar" no se muestra para En
      // curso/Finalizada): una estadía ya iniciada o cerrada no se cancela,
      // sin importar si la petición viene de la UI o de un llamado directo.
      if (status === 'Cancelada') {
        const currentResult = await pool.query('SELECT status FROM reservations WHERE id = $1', [id])
        if (!currentResult.rows[0]) return res.status(404).json({ error: 'Reserva no encontrada' })
        if (['En curso', 'Finalizada'].includes(currentResult.rows[0].status)) {
          return res
            .status(409)
            .json({ error: `No se puede cancelar: la reserva ya está "${currentResult.rows[0].status}"` })
        }
      }
      sets.push(`status = $${i++}`)
      values.push(status)
    }
    if (sets.length === 0) return res.status(400).json({ error: 'Nada para actualizar' })

    values.push(id)
    const { rows } = await pool.query(
      `UPDATE reservations SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Reserva no encontrada' })

    const roomResult = await pool.query('SELECT number FROM rooms WHERE id = $1', [rows[0].room_id])
    res.json(mapReservation({ ...rows[0], room_number: roomResult.rows[0]?.number }))
  } catch (err) {
    next(err)
  }
})

// ---------------------------------------------------------------------------
// Check-in / Check-out
// ---------------------------------------------------------------------------

app.post('/api/checkin', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { roomId, guest, billing } = req.body
    if (!roomId || !guest || !billing) {
      client.release()
      return res.status(400).json({ error: 'Datos de check-in incompletos' })
    }

    await client.query('BEGIN')

    const roomResult = await client.query('SELECT * FROM rooms WHERE id = $1 FOR UPDATE', [roomId])
    const room = roomResult.rows[0]
    if (!room) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Habitación no encontrada' })
    }
    if (room.status !== 'Limpia') {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: `Check-in bloqueado: habitación "${room.status}"` })
    }

    const updated = await client.query(
      `UPDATE rooms SET status = 'Ocupada', guest_name = $1, guest_document = $2, guest_phone = $3,
        check_in_date = $4, check_out_date = $5, base_rate = $6, discount = $7, total = $8
       WHERE id = $9 RETURNING *`,
      [
        guest.fullName,
        guest.documentId,
        guest.phone,
        billing.checkInDate,
        billing.checkOutDate,
        billing.baseRate,
        billing.discount,
        billing.total,
        roomId,
      ],
    )

    await client.query(
      `INSERT INTO check_in_history (room_id, room_number, guest_name, guest_document, guest_phone, nights, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [roomId, room.number, guest.fullName, guest.documentId, guest.phone, billing.nights, billing.total],
    )

    await client.query('COMMIT')
    res.status(201).json(mapRoom(updated.rows[0]))
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
})

app.post('/api/checkout', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { roomId, forced, note } = req.body
    if (!roomId) {
      client.release()
      return res.status(400).json({ error: 'roomId es requerido' })
    }

    await client.query('BEGIN')

    const roomResult = await client.query('SELECT * FROM rooms WHERE id = $1 FOR UPDATE', [roomId])
    const room = roomResult.rows[0]
    if (!room) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Habitación no encontrada' })
    }
    if (room.status !== 'Ocupada') {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: `Check-out bloqueado: habitación "${room.status}"` })
    }

    // La API no confía en que la UI ya cobró/devolvió el saldo: mismo
    // criterio que el bloqueo de cancelación de reservas. Un checkout normal
    // exige saldo === 0; el flag `forced` (walk-out) es la única salida
    // explícita, y deja constancia del motivo en `payments`.
    const stayId = await findActiveStayId(client, roomId)
    const existingPaymentsResult = stayId
      ? await client.query('SELECT type, amount FROM payments WHERE stay_id = $1', [stayId])
      : { rows: [] }
    const existingPayments = existingPaymentsResult.rows.map((row) => ({
      type: row.type,
      amount: Number(row.amount),
    }))
    const balance = calculateBalanceDue(room.total, existingPayments)

    if (balance !== 0) {
      if (!forced) {
        await client.query('ROLLBACK')
        return res.status(409).json({
          error: `Checkout bloqueado: queda un saldo ${balance > 0 ? 'por cobrar' : 'por devolver'} de $${Math.abs(balance).toFixed(2)}`,
        })
      }
      if (!note || typeof note !== 'string' || note.trim() === '') {
        await client.query('ROLLBACK')
        return res.status(400).json({ error: 'El motivo es obligatorio para un checkout forzado' })
      }
      if (balance > 0) {
        await client.query(
          `INSERT INTO payments (room_id, stay_id, type, amount, method, note)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [roomId, stayId, PAYMENT_TYPES.UNCOLLECTED_BALANCE, balance, 'No aplica', note.trim()],
        )
      }
    }

    await client.query(
      `INSERT INTO check_out_history (room_id, room_number, guest_name, total)
       VALUES ($1, $2, $3, $4)`,
      [roomId, room.number, room.guest_name, room.total],
    )

    // Si esta estadía vino de una reserva (marcada 'En curso' al hacer
    // check-in vía ReservationConversionPanel), la cierra como 'Finalizada'.
    // Solo puede haber una reserva 'En curso' por habitación a la vez, así
    // que no hace falta más contexto que room_id para ubicarla. No falla si
    // no existe (check-in sin reserva, ej. un walk-in).
    await client.query(
      `UPDATE reservations SET status = 'Finalizada' WHERE room_id = $1 AND status = 'En curso'`,
      [roomId],
    )

    const updated = await client.query(
      `UPDATE rooms SET status = 'Sucia', guest_name = NULL, guest_document = NULL, guest_phone = NULL,
        check_in_date = NULL, check_out_date = NULL, base_rate = NULL, discount = NULL, total = NULL
       WHERE id = $1 RETURNING *`,
      [roomId],
    )

    await client.query('COMMIT')
    res.status(201).json(mapRoom(updated.rows[0]))
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
})

// ---------------------------------------------------------------------------
// Payments (anticipos y devoluciones)
// ---------------------------------------------------------------------------

async function findActiveStayId(client, roomId) {
  const stayResult = await client.query(
    'SELECT id FROM check_in_history WHERE room_id = $1 ORDER BY created_at DESC LIMIT 1',
    [roomId],
  )
  return stayResult.rows[0]?.id ?? null
}

app.get('/api/payments', async (req, res, next) => {
  try {
    const { roomId } = req.query
    if (!roomId) return res.status(400).json({ error: 'roomId es requerido' })

    const roomResult = await pool.query('SELECT status FROM rooms WHERE id = $1', [roomId])
    if (!roomResult.rows[0]) return res.status(404).json({ error: 'Habitación no encontrada' })
    if (roomResult.rows[0].status !== 'Ocupada') return res.json([])

    const stayId = await findActiveStayId(pool, roomId)
    if (!stayId) return res.json([])

    const { rows } = await pool.query('SELECT * FROM payments WHERE stay_id = $1 ORDER BY created_at ASC', [
      stayId,
    ])
    res.json(rows.map(mapPayment))
  } catch (err) {
    next(err)
  }
})

app.post('/api/payments', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { roomId, type, amount, method } = req.body
    if (!roomId || !type || amount === undefined) {
      client.release()
      return res.status(400).json({ error: 'Datos de pago incompletos' })
    }

    await client.query('BEGIN')

    const roomResult = await client.query('SELECT * FROM rooms WHERE id = $1 FOR UPDATE', [roomId])
    const room = roomResult.rows[0]
    if (!room) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Habitación no encontrada' })
    }
    if (room.status !== 'Ocupada') {
      await client.query('ROLLBACK')
      return res
        .status(409)
        .json({ error: `No se puede registrar el pago: habitación "${room.status}" sin estadía activa` })
    }

    const stayId = await findActiveStayId(client, roomId)
    if (!stayId) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'No se encontró una estadía activa para esta habitación' })
    }

    const existingPaymentsResult = await client.query('SELECT type, amount FROM payments WHERE stay_id = $1', [
      stayId,
    ])
    const existingPayments = existingPaymentsResult.rows.map((row) => ({
      type: row.type,
      amount: Number(row.amount),
    }))

    const validation = validatePayment({ type, amount, total: room.total, existingPayments })
    if (!validation.valid) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: validation.error })
    }

    const inserted = await client.query(
      `INSERT INTO payments (room_id, stay_id, type, amount, method)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [roomId, stayId, type, amount, method || 'Efectivo'],
    )

    await client.query('COMMIT')
    res.status(201).json(mapPayment(inserted.rows[0]))
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
})

// ---------------------------------------------------------------------------
// History (Reportes / Auditoria)
// ---------------------------------------------------------------------------

app.get('/api/history', async (req, res, next) => {
  try {
    const { startDate, endDate, roomNumber } = req.query
    const conditions = []
    const values = []
    let i = 1

    if (startDate) {
      conditions.push(`created_at::date >= $${i++}`)
      values.push(startDate)
    }
    if (endDate) {
      conditions.push(`created_at::date <= $${i++}`)
      values.push(endDate)
    }
    if (roomNumber) {
      conditions.push(`room_number = $${i++}`)
      values.push(roomNumber)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    // Tercera rama: pagos 'Saldo pendiente por cobrar' de un checkout
    // forzado (walk-out), unidos a check_in_history para poder mostrar el
    // documento del huésped (Bug 3) y localizarlo. Se envuelve en una
    // subconsulta para exponer columnas sin ambigüedad antes de aplicarle el
    // mismo `where` (payments y check_in_history comparten `created_at`).
    const { rows } = await pool.query(
      `SELECT id, room_id, room_number, guest_name, guest_document, nights, total, created_at, NULL::text AS note, 'Check-in' AS type
         FROM check_in_history ${where}
       UNION ALL
       SELECT id, room_id, room_number, guest_name, NULL::varchar AS guest_document, NULL::integer AS nights, total, created_at, NULL::text AS note, 'Check-out' AS type
         FROM check_out_history ${where}
       UNION ALL
       SELECT id, room_id, room_number, guest_name, guest_document, nights, total, created_at, note, type FROM (
         SELECT p.id, p.room_id, cih.room_number, cih.guest_name, cih.guest_document,
                NULL::integer AS nights, p.amount AS total, p.created_at, p.note,
                'Pendiente de cobro' AS type
           FROM payments p
           JOIN check_in_history cih ON cih.id = p.stay_id
          WHERE p.type = 'Saldo pendiente por cobrar'
       ) pending_entries ${where}
       ORDER BY created_at DESC`,
      values,
    )
    res.json(rows.map(mapHistoryEntry))
  } catch (err) {
    next(err)
  }
})

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Error interno del servidor' })
})

app.listen(PORT, () => {
  console.log(`PMS Hotelero API escuchando en http://localhost:${PORT}`)
})
