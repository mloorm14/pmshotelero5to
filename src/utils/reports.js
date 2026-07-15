export function combineHistory(checkInHistory = [], checkOutHistory = []) {
  const checkIns = checkInHistory.map((entry) => ({ ...entry, type: 'Check-in' }))
  const checkOuts = checkOutHistory.map((entry) => ({ ...entry, type: 'Check-out' }))
  return [...checkIns, ...checkOuts].sort((a, b) => new Date(b.at) - new Date(a.at))
}

export function filterHistory(entries, { startDate, endDate, roomNumber } = {}) {
  return entries.filter((entry) => {
    const entryDate = entry.at ? entry.at.slice(0, 10) : null

    if (startDate && entryDate && entryDate < startDate) return false
    if (endDate && entryDate && entryDate > endDate) return false
    if (roomNumber && String(entry.roomNumber) !== String(roomNumber)) return false

    return true
  })
}

export function calculateTotalBilled(entries) {
  return entries
    .filter((entry) => entry.type === 'Check-in' && entry.billing)
    .reduce((sum, entry) => sum + (Number(entry.billing.total) || 0), 0)
}
