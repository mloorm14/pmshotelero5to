export function filterHistory(entries, { startDate, endDate, roomNumber } = {}) {
  return entries.filter((entry) => {
    const entryDate = entry.at ? String(entry.at).slice(0, 10) : null

    if (startDate && entryDate && entryDate < startDate) return false
    if (endDate && entryDate && entryDate > endDate) return false
    if (roomNumber && String(entry.roomNumber) !== String(roomNumber)) return false

    return true
  })
}

// Filtra por 'Check-in' a propósito, no por 'Check-out' (decisión tomada al
// agregar minibar, que sí quedó reflejado en check_out_history.total): con
// 'Check-out' una estadía en curso (checked-in pero sin checkout todavío)
// dejaría de contar como facturada hasta cerrarse, y este número alimenta el
// panel principal de Reportes, que hoy funciona como proyección de ingresos
// en curso, no solo auditoría de lo ya cerrado. Cambiar el filtro sería una
// regresión de comportamiento no pedida por este cambio — el minibar de
// estadías cerradas se muestra aparte en calculateMinibarRevenue.
export function calculateTotalBilled(entries) {
  return entries
    .filter((entry) => entry.type === 'Check-in')
    .reduce((sum, entry) => sum + (Number(entry.total) || 0), 0)
}

// Suma aparte de calculateTotalBilled (no mezclada en el total principal):
// minibarTotal solo viene poblado en entradas 'Check-out' (ver
// GET /api/history), así que esto solo cuenta minibar de estadías ya
// cerradas — no hay forma de saber cuánto minibar lleva una estadía en
// curso sin consultar /api/minibar/charges habitación por habitación.
export function calculateMinibarRevenue(entries) {
  return entries
    .filter((entry) => entry.type === 'Check-out')
    .reduce((sum, entry) => sum + (Number(entry.minibarTotal) || 0), 0)
}

// Suma aparte de calculateTotalBilled a propósito: son saldos que un huésped
// se llevó sin pagar en un checkout forzado ('Pendiente de cobro' — ver
// PAYMENT_TYPES.UNCOLLECTED_BALANCE), no dinero efectivamente cobrado. Si se
// sumaran al total facturado, Reportes mostraría ingresos que nunca entraron.
export function calculateTotalPending(entries) {
  return entries
    .filter((entry) => entry.type === 'Pendiente de cobro')
    .reduce((sum, entry) => sum + (Number(entry.total) || 0), 0)
}
