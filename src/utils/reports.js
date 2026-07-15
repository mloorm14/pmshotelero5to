export function filterHistory(entries, { startDate, endDate, roomNumber } = {}) {
  return entries.filter((entry) => {
    const entryDate = entry.at ? String(entry.at).slice(0, 10) : null

    if (startDate && entryDate && entryDate < startDate) return false
    if (endDate && entryDate && entryDate > endDate) return false
    if (roomNumber && String(entry.roomNumber) !== String(roomNumber)) return false

    return true
  })
}

export function calculateTotalBilled(entries) {
  return entries
    .filter((entry) => entry.type === 'Check-in')
    .reduce((sum, entry) => sum + (Number(entry.total) || 0), 0)
}
