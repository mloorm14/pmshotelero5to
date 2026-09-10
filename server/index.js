import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool } from './db.js'
import { validateRoom } from '../src/utils/rooms.js'
import { validatePayment, calculateBalanceDue, PAYMENT_TYPES } from '../src/utils/payments.js'
import { validateDocumentId, validatePhone } from '../src/utils/validation.js'
import { hasDateOverlap } from '../src/utils/reservations.js'

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
    version: row.version,
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
    createdBy: row.created_by ?? null,
    // Null si el usuario fue desactivado/eliminado (LEFT JOIN sin match) o si
    // la reserva es de antes de esta funcionalidad — el frontend lo muestra
    // como "Usuario no disponible" en vez de romperse.
    createdByName: row.created_by_name ?? null,
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
    registeredBy: row.registered_by ?? null,
    registeredByName: row.registered_by_name ?? null,
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
    performedByName: row.performed_by_name ?? null,
    // Solo viene poblado en entradas 'Check-out' (ver GET /api/history) —
    // cuánto de ese total corresponde a minibar, para que Reportes pueda
    // mostrarlo como línea aparte sin recalcularlo del lado del cliente.
    minibarTotal: row.minibar_total !== null && row.minibar_total !== undefined ? Number(row.minibar_total) : null,
    at: row.created_at,
  }
}

function mapUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username,
    role: row.role,
    active: row.active,
    createdAt: row.created_at,
  }
}

function mapMinibarProduct(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    active: row.active,
    createdAt: row.created_at,
  }
}

function mapMinibarCharge(row) {
  return {
    id: row.id,
    stayId: row.stay_id,
    roomId: row.room_id,
    productId: row.product_id,
    productName: row.product_name,
    unitPrice: Number(row.unit_price),
    quantity: Number(row.quantity),
    subtotal: Number(row.subtotal),
    registeredBy: row.registered_by ?? null,
    registeredByName: row.registered_by_name ?? null,
    createdAt: row.created_at,
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
      `SELECT r.*, rm.number AS room_number, u.full_name AS created_by_name
         FROM reservations r
         JOIN rooms rm ON rm.id = r.room_id
         LEFT JOIN users u ON u.id = r.created_by
        ORDER BY r.created_at DESC`,
    )
    res.json(rows.map(mapReservation))
  } catch (err) {
    next(err)
  }
})

app.post('/api/reservations', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { roomId, guestName, checkInDate, checkOutDate, guestDocument, guestPhone, userId } = req.body
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

    await client.query('BEGIN')

    // Se bloquea la fila de rooms (mismo patrón que /api/checkin y
    // /api/checkout) para serializar creaciones concurrentes sobre la misma
    // habitación: sin este lock, dos requests simultáneos podrían leer "sin
    // solapamiento" antes de que cualquiera de los dos inserte su reserva.
    const roomResult = await client.query('SELECT * FROM rooms WHERE id = $1 FOR UPDATE', [roomId])
    const room = roomResult.rows[0]
    if (!room) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Habitación no encontrada' })
    }

    const existingResult = await client.query(
      `SELECT id, room_id, check_in_date, check_out_date, status FROM reservations WHERE room_id = $1`,
      [roomId],
    )
    const existingReservations = existingResult.rows.map((row) => ({
      id: row.id,
      roomId: row.room_id,
      checkInDate: row.check_in_date,
      checkOutDate: row.check_out_date,
      status: row.status,
    }))
    if (hasDateOverlap(existingReservations, roomId, checkInDate, checkOutDate)) {
      await client.query('ROLLBACK')
      return res
        .status(409)
        .json({ error: 'La habitación ya tiene una reserva confirmada en fechas que se cruzan con las indicadas.' })
    }

    // userId es opcional (no debe romper un caller que todavía no lo mande);
    // si no viene, created_by queda NULL.
    const { rows } = await client.query(
      `INSERT INTO reservations (room_id, guest_name, guest_document, guest_phone, check_in_date, check_out_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [roomId, guestName.trim(), trimmedDocument || null, trimmedPhone || null, checkInDate, checkOutDate, userId ?? null],
    )
    const userResult = userId ? await client.query('SELECT full_name FROM users WHERE id = $1', [userId]) : { rows: [] }

    await client.query('COMMIT')
    res.status(201).json(
      mapReservation({
        ...rows[0],
        room_number: room.number,
        created_by_name: userResult.rows[0]?.full_name,
      }),
    )
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
})

// TODO: version — reservations.version existe en el schema pero este prompt
// no aplica bloqueo optimista aquí (el riesgo de choque en transiciones de
// estado es menor que en checkout/pagos, que sí mueven dinero). Agregar el
// mismo patrón de POST /api/checkout si hace falta más adelante.
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
    const userResult = rows[0].created_by
      ? await pool.query('SELECT full_name FROM users WHERE id = $1', [rows[0].created_by])
      : { rows: [] }
    res.json(
      mapReservation({
        ...rows[0],
        room_number: roomResult.rows[0]?.number,
        created_by_name: userResult.rows[0]?.full_name,
      }),
    )
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
    const { roomId, guest, billing, userId } = req.body
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
      `INSERT INTO check_in_history (room_id, room_number, guest_name, guest_document, guest_phone, nights, total, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [roomId, room.number, guest.fullName, guest.documentId, guest.phone, billing.nights, billing.total, userId ?? null],
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
    const { roomId, forced, note, userId, version } = req.body
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

    // Bloqueo optimista: version es opcional a propósito (mismo criterio que
    // userId) para no romper otros flujos que todavía no lo manden. Si viene,
    // se compara contra la version actual bajo FOR UPDATE — si no coincide,
    // otro usuario modificó esta habitación desde que el cliente la leyó.
    if (version !== undefined && Number(version) !== room.version) {
      await client.query('ROLLBACK')
      return res.status(409).json({
        error: 'Esta habitación fue modificada por otro usuario. Recarga la información e intenta de nuevo.',
      })
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

    // El minibar es un cargo, no un pago: aumenta el monto a saldar en vez
    // de reducirlo. effectiveTotal (no room.total) es la base real del
    // saldo desde aquí en adelante — si no se sumara, el checkout podría
    // cerrarse sin cobrar lo que el huésped consumió.
    const minibarResult = stayId
      ? await client.query('SELECT COALESCE(SUM(subtotal), 0) AS total FROM minibar_charges WHERE stay_id = $1', [
          stayId,
        ])
      : { rows: [{ total: 0 }] }
    const minibarTotal = Number(minibarResult.rows[0].total)
    const effectiveTotal = Number(room.total) + minibarTotal
    const balance = calculateBalanceDue(effectiveTotal, existingPayments)

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
          `INSERT INTO payments (room_id, stay_id, type, amount, method, note, registered_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [roomId, stayId, PAYMENT_TYPES.UNCOLLECTED_BALANCE, balance, 'No aplica', note.trim(), userId ?? null],
        )
      }
    }

    // total guarda effectiveTotal (no room.total): el historial debe
    // reflejar lo que realmente se cobró, minibar incluido. stay_id queda
    // registrado para que GET /api/history pueda sumar minibar_charges de
    // esta estadía específica sin adivinar cuál fue.
    await client.query(
      `INSERT INTO check_out_history (room_id, room_number, guest_name, total, stay_id, performed_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [roomId, room.number, room.guest_name, effectiveTotal, stayId, userId ?? null],
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
        check_in_date = NULL, check_out_date = NULL, base_rate = NULL, discount = NULL, total = NULL,
        version = version + 1
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

    const { rows } = await pool.query(
      `SELECT p.*, u.full_name AS registered_by_name
         FROM payments p
         LEFT JOIN users u ON u.id = p.registered_by
        WHERE p.stay_id = $1
        ORDER BY p.created_at ASC`,
      [stayId],
    )
    res.json(rows.map(mapPayment))
  } catch (err) {
    next(err)
  }
})

app.post('/api/payments', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { roomId, type, amount, method, userId, version } = req.body
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

    // Bloqueo optimista: mismo criterio que POST /api/checkout — version es
    // opcional, y si viene y no coincide con la fila bajo FOR UPDATE, otro
    // usuario ya tocó esta habitación (ej. otro pago o un checkout) desde que
    // el cliente la leyó.
    if (version !== undefined && Number(version) !== room.version) {
      await client.query('ROLLBACK')
      return res.status(409).json({
        error: 'Esta habitación fue modificada por otro usuario. Recarga la información e intenta de nuevo.',
      })
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

    // Mismo effectiveTotal que POST /api/checkout: un 'Cobro final' no debe
    // poder exceder el saldo pendiente real, que incluye el minibar ya
    // cargado a esta estadía.
    const minibarResult = await client.query(
      'SELECT COALESCE(SUM(subtotal), 0) AS total FROM minibar_charges WHERE stay_id = $1',
      [stayId],
    )
    const minibarTotal = Number(minibarResult.rows[0].total)
    const effectiveTotal = Number(room.total) + minibarTotal

    const validation = validatePayment({ type, amount, total: effectiveTotal, existingPayments })
    if (!validation.valid) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: validation.error })
    }

    const inserted = await client.query(
      `INSERT INTO payments (room_id, stay_id, type, amount, method, registered_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [roomId, stayId, type, amount, method || 'Efectivo', userId ?? null],
    )

    // A diferencia de checkout, este endpoint no tenía un UPDATE rooms
    // propio — se agrega solo para avanzar version, así el bloqueo optimista
    // también detecta dos pagos concurrentes sobre la misma estadía (la
    // razón de ser de aplicarlo aquí, no solo en checkout).
    await client.query('UPDATE rooms SET version = version + 1 WHERE id = $1', [roomId])

    const userResult = userId ? await client.query('SELECT full_name FROM users WHERE id = $1', [userId]) : { rows: [] }

    await client.query('COMMIT')
    res.status(201).json(mapPayment({ ...inserted.rows[0], registered_by_name: userResult.rows[0]?.full_name }))
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

    // Las 3 ramas se envuelven en una subconsulta cada una, exponiendo un set
    // de columnas fijo y sin ambigüedad, antes de aplicarles el mismo `where`
    // (varias de las tablas involucradas comparten nombres de columna entre
    // sí y con `users` — ej. `created_at` existe en las 3 tablas de historial
    // Y en `users` — referenciarlas sin calificar rompería con "column
    // reference is ambiguous" apenas se agrega el LEFT JOIN a users).
    const { rows } = await pool.query(
      `SELECT id, room_id, room_number, guest_name, guest_document, nights, total, created_at, note, performed_by_name, minibar_total, type FROM (
         SELECT cih.id, cih.room_id, cih.room_number, cih.guest_name, cih.guest_document, cih.nights, cih.total,
                cih.created_at, NULL::text AS note, u.full_name AS performed_by_name, NULL::numeric AS minibar_total,
                'Check-in' AS type
           FROM check_in_history cih
           LEFT JOIN users u ON u.id = cih.performed_by
       ) checkin_entries ${where}
       UNION ALL
       SELECT id, room_id, room_number, guest_name, guest_document, nights, total, created_at, note, performed_by_name, minibar_total, type FROM (
         SELECT coh.id, coh.room_id, coh.room_number, coh.guest_name, NULL::varchar AS guest_document,
                NULL::integer AS nights, coh.total, coh.created_at, NULL::text AS note,
                u.full_name AS performed_by_name,
                (SELECT COALESCE(SUM(mc.subtotal), 0) FROM minibar_charges mc WHERE mc.stay_id = coh.stay_id) AS minibar_total,
                'Check-out' AS type
           FROM check_out_history coh
           LEFT JOIN users u ON u.id = coh.performed_by
       ) checkout_entries ${where}
       UNION ALL
       SELECT id, room_id, room_number, guest_name, guest_document, nights, total, created_at, note, performed_by_name, minibar_total, type FROM (
         SELECT p.id, p.room_id, cih.room_number, cih.guest_name, cih.guest_document,
                NULL::integer AS nights, p.amount AS total, p.created_at, p.note,
                u.full_name AS performed_by_name, NULL::numeric AS minibar_total, 'Pendiente de cobro' AS type
           FROM payments p
           JOIN check_in_history cih ON cih.id = p.stay_id
           LEFT JOIN users u ON u.id = p.registered_by
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

// ---------------------------------------------------------------------------
// Users (login simulado + CRUD de usuarios)
// ---------------------------------------------------------------------------

const USER_ROLES = ['Recepcionista', 'Administrador']

// No hay autenticación real (login simulado: se elige un usuario de una
// lista, sin contraseña/hash/JWT), así que el backend no tiene sesión
// propia. El control de que solo un Administrador gestione usuarios se hace
// con este campo, que el frontend manda en cada request junto con el rol de
// quien está "logueado" ahí. Es deliberadamente simple — no es seguridad
// real, es solo consistencia con que el login tampoco lo es — y es una
// limitación conocida, no un descuido.
function requireAdmin(req, res, resource = 'usuarios') {
  if (req.body.actingRole !== 'Administrador') {
    res.status(403).json({ error: `Solo un Administrador puede gestionar ${resource}` })
    return false
  }
  return true
}

app.get('/api/users', async (req, res, next) => {
  try {
    const { active } = req.query
    const { rows } = await pool.query(
      active === 'true' ? 'SELECT * FROM users WHERE active = true ORDER BY full_name' : 'SELECT * FROM users ORDER BY full_name',
    )
    res.json(rows.map(mapUser))
  } catch (err) {
    next(err)
  }
})

app.post('/api/users', async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) return

    const { fullName, username, role } = req.body
    const trimmedName = (fullName ?? '').trim()
    const trimmedUsername = (username ?? '').trim()
    if (trimmedName === '' || trimmedUsername === '') {
      return res.status(400).json({ error: 'Nombre y usuario son obligatorios' })
    }
    if (!USER_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' })
    }

    const { rows } = await pool.query(
      `INSERT INTO users (full_name, username, role) VALUES ($1, $2, $3) RETURNING *`,
      [trimmedName, trimmedUsername, role],
    )
    res.status(201).json(mapUser(rows[0]))
  } catch (err) {
    // 23505 = unique_violation (constraint UNIQUE de username) — se traduce
    // a un 400 con mensaje claro en vez de dejar pasar el 500 genérico.
    if (err.code === '23505') return res.status(400).json({ error: 'Ese nombre de usuario ya existe' })
    next(err)
  }
})

// username no es editable una vez creado (para no romper la trazabilidad de
// quién hizo qué si alguien cambia de nombre de usuario) — solo se aceptan
// fullName/role/active.
app.put('/api/users/:id', async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) return

    const { id } = req.params
    const { fullName, role, active } = req.body
    const sets = []
    const values = []
    let i = 1

    if (fullName !== undefined) {
      const trimmedName = fullName.trim()
      if (trimmedName === '') return res.status(400).json({ error: 'El nombre no puede estar vacío' })
      sets.push(`full_name = $${i++}`)
      values.push(trimmedName)
    }
    if (role !== undefined) {
      if (!USER_ROLES.includes(role)) return res.status(400).json({ error: 'Rol inválido' })
      sets.push(`role = $${i++}`)
      values.push(role)
    }
    if (active !== undefined) {
      sets.push(`active = $${i++}`)
      values.push(Boolean(active))
    }

    if (sets.length === 0) return res.status(400).json({ error: 'Nada para actualizar' })

    values.push(id)
    const { rows } = await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, values)
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(mapUser(rows[0]))
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Ese nombre de usuario ya existe' })
    next(err)
  }
})

// No hay DELETE /api/users/:id a propósito: eliminar un usuario rompería la
// trazabilidad histórica (created_by/performed_by/registered_by quedarían
// apuntando a un id inexistente en vez de simplemente NULL vía ON DELETE SET
// NULL). Dar de baja es PUT /api/users/:id con { active: false }.

// ---------------------------------------------------------------------------
// Minibar / extras (catálogo + cargos por estadía)
// ---------------------------------------------------------------------------

app.get('/api/minibar/products', async (req, res, next) => {
  try {
    const { active } = req.query
    const { rows } = await pool.query(
      active === 'true'
        ? 'SELECT * FROM minibar_products WHERE active = true ORDER BY name'
        : 'SELECT * FROM minibar_products ORDER BY name',
    )
    res.json(rows.map(mapMinibarProduct))
  } catch (err) {
    next(err)
  }
})

app.post('/api/minibar/products', async (req, res, next) => {
  try {
    if (!requireAdmin(req, res, 'productos de minibar')) return

    const { name, price } = req.body
    const trimmedName = (name ?? '').trim()
    const parsedPrice = Number.parseFloat(price)
    if (trimmedName === '') return res.status(400).json({ error: 'El nombre es obligatorio' })
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor a cero' })
    }

    const { rows } = await pool.query(`INSERT INTO minibar_products (name, price) VALUES ($1, $2) RETURNING *`, [
      trimmedName,
      parsedPrice,
    ])
    res.status(201).json(mapMinibarProduct(rows[0]))
  } catch (err) {
    // 23505 = unique_violation (constraint UNIQUE de name).
    if (err.code === '23505') return res.status(400).json({ error: 'Ese producto ya existe' })
    next(err)
  }
})

// No hay DELETE /api/minibar/products/:id a propósito, mismo criterio que
// usuarios: eliminar rompería la referencia desde minibar_charges en cargos
// ya históricos (aunque product_id sea SET NULL, product_name desnormalizado
// sobrevive de todas formas). Dar de baja es { active: false }.
app.put('/api/minibar/products/:id', async (req, res, next) => {
  try {
    if (!requireAdmin(req, res, 'productos de minibar')) return

    const { id } = req.params
    const { name, price, active } = req.body
    const sets = []
    const values = []
    let i = 1

    if (name !== undefined) {
      const trimmedName = name.trim()
      if (trimmedName === '') return res.status(400).json({ error: 'El nombre no puede estar vacío' })
      sets.push(`name = $${i++}`)
      values.push(trimmedName)
    }
    if (price !== undefined) {
      const parsedPrice = Number.parseFloat(price)
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ error: 'El precio debe ser mayor a cero' })
      }
      sets.push(`price = $${i++}`)
      values.push(parsedPrice)
    }
    if (active !== undefined) {
      sets.push(`active = $${i++}`)
      values.push(Boolean(active))
    }

    if (sets.length === 0) return res.status(400).json({ error: 'Nada para actualizar' })

    values.push(id)
    const { rows } = await pool.query(
      `UPDATE minibar_products SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' })
    res.json(mapMinibarProduct(rows[0]))
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Ese producto ya existe' })
    next(err)
  }
})

app.get('/api/minibar/charges', async (req, res, next) => {
  try {
    const { roomId } = req.query
    if (!roomId) return res.status(400).json({ error: 'roomId es requerido' })

    const roomResult = await pool.query('SELECT status FROM rooms WHERE id = $1', [roomId])
    if (!roomResult.rows[0]) return res.status(404).json({ error: 'Habitación no encontrada' })
    if (roomResult.rows[0].status !== 'Ocupada') return res.json([])

    const stayId = await findActiveStayId(pool, roomId)
    if (!stayId) return res.json([])

    const { rows } = await pool.query(
      `SELECT mc.*, u.full_name AS registered_by_name
         FROM minibar_charges mc
         LEFT JOIN users u ON u.id = mc.registered_by
        WHERE mc.stay_id = $1
        ORDER BY mc.created_at ASC`,
      [stayId],
    )
    res.json(rows.map(mapMinibarCharge))
  } catch (err) {
    next(err)
  }
})

// Registra un cargo (no un pago) de minibar consumido en la estadía activa
// de una habitación. Se registra solo al momento del checkout: no hay
// pantalla separada para cargar minibar a mitad de la estadía.
app.post('/api/minibar/charges', async (req, res, next) => {
  const client = await pool.connect()
  try {
    const { roomId, productId, quantity, userId } = req.body
    if (!roomId || !productId || quantity === undefined) {
      client.release()
      return res.status(400).json({ error: 'Datos de cargo de minibar incompletos' })
    }
    const parsedQuantity = Number.parseInt(quantity, 10)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      client.release()
      return res.status(400).json({ error: 'La cantidad debe ser un entero mayor a cero' })
    }

    await client.query('BEGIN')

    // FOR UPDATE aunque este endpoint no escriba en rooms: serializa contra
    // un checkout o pago concurrente sobre la misma habitación, igual que
    // POST /api/payments.
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
        .json({ error: `No se puede cargar minibar: habitación "${room.status}" sin estadía activa` })
    }

    const stayId = await findActiveStayId(client, roomId)
    if (!stayId) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'No se encontró una estadía activa para esta habitación' })
    }

    const productResult = await client.query('SELECT * FROM minibar_products WHERE id = $1', [productId])
    const product = productResult.rows[0]
    if (!product) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Producto de minibar no encontrado' })
    }
    // Un producto desactivado no debe poder cargarse aunque el id siga
    // siendo válido (ej. alguien tiene el selector abierto desde antes de
    // que un Administrador lo desactivara).
    if (!product.active) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'Ese producto de minibar está desactivado' })
    }

    const unitPrice = Number(product.price)
    const subtotal = unitPrice * parsedQuantity

    const inserted = await client.query(
      `INSERT INTO minibar_charges (stay_id, room_id, product_id, product_name, unit_price, quantity, subtotal, registered_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [stayId, roomId, product.id, product.name, unitPrice, parsedQuantity, subtotal, userId ?? null],
    )

    const userResult = userId ? await client.query('SELECT full_name FROM users WHERE id = $1', [userId]) : { rows: [] }

    await client.query('COMMIT')
    res.status(201).json(mapMinibarCharge({ ...inserted.rows[0], registered_by_name: userResult.rows[0]?.full_name }))
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
})

// No hay DELETE de un cargo individual — fuera de alcance. Si un cargo se
// registró mal, es un caso de corrección manual en BD por ahora.

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
