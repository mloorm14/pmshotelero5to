import { pool } from '../db.js'

// Reparación puntual para datos anteriores al fix de checkout bloqueado (ver
// README, sección "Checkout forzado"): antes de ese fix, un checkout podía
// liberar la habitación (status <> 'Ocupada') sin cerrar la reserva "En
// curso" vinculada, dejándola atascada para siempre sin aparecer en ningún
// módulo utilizable. Este script localiza esas reservas huérfanas — "En
// curso" pero con la habitación ya liberada, señal inequívoca de que el
// checkout pasó por fuera del flujo correcto — y las cierra como
// "Finalizada" (el estado al que debieron haber llegado). No debería volver
// a hacer falta: el fix actual bloquea el escenario que las produce. No
// resetea ni toca ningún otro dato (a diferencia de `npm run migrate`).
async function run() {
  const { rows } = await pool.query(
    `UPDATE reservations r
        SET status = 'Finalizada'
       FROM rooms rm
      WHERE r.room_id = rm.id
        AND r.status = 'En curso'
        AND rm.status <> 'Ocupada'
      RETURNING r.id, r.room_id, rm.number AS room_number, rm.status AS room_status, r.guest_name`,
  )

  if (rows.length === 0) {
    console.log('No se encontraron reservas huérfanas ("En curso" con habitación ya liberada). Nada que reparar.')
  } else {
    console.log(`Reparadas ${rows.length} reserva(s) huérfana(s):`)
    for (const row of rows) {
      console.log(
        `  - Reserva #${row.id} — Hab. ${row.room_number} (estado de la habitación: "${row.room_status}") — huésped: ${row.guest_name} → "Finalizada"`,
      )
    }
    console.log(
      '\nLimitación conocida: este script NO reconstruye ni registra un pago "Saldo pendiente por cobrar" ' +
        'retroactivo para estas estadías — no hay forma segura de inferir cuánto se dejó de cobrar en su momento ' +
        '(el checkout incompleto no dejó ese rastro). Si ese dato hace falta para auditoría, debe reconstruirse ' +
        'manualmente caso por caso a partir de check_in_history/payments.',
    )
  }

  await pool.end()
}

run().catch((err) => {
  console.error('Error ejecutando la reparación:', err.message)
  process.exit(1)
})
