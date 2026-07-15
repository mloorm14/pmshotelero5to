import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool } from './db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: CORS_ORIGIN }))
app.use(express.json())

function mapRoom(row) {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
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
    checkInDate: row.check_in_date,
    checkOutDate: row.check_out_date,
    status: row.status,
    checkedIn: row.checked_in,
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
    nights: row.nights !== null ? Number(row.nights) : null,
    total: row.total !== null ? Number(row.total) : null,
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
    const { status, guest, billing } = req.body
    const sets = []
    const values = []
    let i = 1

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
    const { roomId, guestName, checkInDate, checkOutDate } = req.body
    if (!roomId || !guestName || !checkInDate || !checkOutDate) {
      return res.status(400).json({ error: 'Datos de reserva incompletos' })
    }

    const { rows } = await pool.query(
      `INSERT INTO reservations (room_id, guest_name, check_in_date, check_out_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [roomId, guestName.trim(), checkInDate, checkOutDate],
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
    const { status, checkedIn } = req.body
    const sets = []
    const values = []
    let i = 1

    if (status !== undefined) {
      sets.push(`status = $${i++}`)
      values.push(status)
    }
    if (checkedIn !== undefined) {
      sets.push(`checked_in = $${i++}`)
      values.push(checkedIn)
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
    const { roomId } = req.body
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

    await client.query(
      `INSERT INTO check_out_history (room_id, room_number, guest_name, total)
       VALUES ($1, $2, $3, $4)`,
      [roomId, room.number, room.guest_name, room.total],
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

    const { rows } = await pool.query(
      `SELECT id, room_id, room_number, guest_name, nights, total, created_at, 'Check-in' AS type
         FROM check_in_history ${where}
       UNION ALL
       SELECT id, room_id, room_number, guest_name, NULL::integer AS nights, total, created_at, 'Check-out' AS type
         FROM check_out_history ${where}
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
