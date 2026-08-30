import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../utils/api'
import { useLog } from '../context/useLog'
import { filterHistory, calculateTotalBilled, calculateTotalPending } from '../utils/reports'

const ENTRY_TYPE_BADGE = {
  'Check-in': 'border-emerald-200 bg-emerald-100 text-emerald-800',
  'Check-out': 'border-amber-200 bg-amber-100 text-amber-800',
  'Pendiente de cobro': 'border-wine-200 bg-wine-100 text-wine-800',
}

export default function ReportsPage({ rooms }) {
  const { addLog } = useLog()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ startDate: '', endDate: '', roomNumber: '' })

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getHistory()
      setEntries(data)
    } catch (err) {
      addLog(`Error al cargar el historial de Reportes: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [addLog])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const filteredEntries = useMemo(() => filterHistory(entries, filters), [entries, filters])
  const totalBilled = useMemo(() => calculateTotalBilled(filteredEntries), [filteredEntries])
  const totalPending = useMemo(() => calculateTotalPending(filteredEntries), [filteredEntries])

  function handleFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink-900">Filtros</h3>
          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="rounded-md border border-ink-300 px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-wine-600 hover:text-wine-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Actualizando…' : 'Refrescar desde la base de datos'}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="startDate" className="mb-1.5 block text-sm font-medium text-ink-700">
              Desde
            </label>
            <input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full rounded-md border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="mb-1.5 block text-sm font-medium text-ink-700">
              Hasta
            </label>
            <input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full rounded-md border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
            />
          </div>
          <div>
            <label htmlFor="roomNumber" className="mb-1.5 block text-sm font-medium text-ink-700">
              Habitación
            </label>
            <select
              id="roomNumber"
              value={filters.roomNumber}
              onChange={(e) => handleFilterChange('roomNumber', e.target.value)}
              className="w-full rounded-md border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-500/30"
            >
              <option value="">Todas</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.number}>
                  Hab. {room.number}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-wine-200 bg-wine-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-wine-800">Total facturado en el rango filtrado</p>
          <p className="mt-1 text-3xl font-bold text-wine-800">${totalBilled.toFixed(2)}</p>
        </section>
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-amber-800">Pendiente de cobro (checkouts forzados)</p>
          <p className="mt-1 text-3xl font-bold text-amber-800">${totalPending.toFixed(2)}</p>
          <p className="mt-1 text-xs text-amber-700/80">
            No incluido en el total facturado — huéspedes que se retiraron sin saldar (ver "Motivo" en la tabla).
          </p>
        </section>
      </div>

      <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-ink-900">Historial de Check-in / Check-out</h3>
        {filteredEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-ink-300 bg-ink-50 p-8 text-center">
            <p className="text-sm text-ink-500">No hay movimientos para los filtros seleccionados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-xs uppercase tracking-wider text-ink-500">
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Habitación</th>
                  <th className="py-2 pr-4">Huésped</th>
                  <th className="py-2 pr-4">Documento</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Motivo</th>
                  <th className="py-2 pr-4">Registrado por</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={`${entry.type}-${entry.id}`} className="border-b border-ink-100">
                    <td className="py-2.5 pr-4 text-ink-500">{new Date(entry.at).toLocaleString()}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ENTRY_TYPE_BADGE[entry.type] ?? 'border-ink-200 bg-ink-100 text-ink-700'}`}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-ink-800">{entry.roomNumber}</td>
                    <td className="py-2.5 pr-4 text-ink-700">{entry.guestName ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-ink-700">{entry.guestDocument ?? '—'}</td>
                    <td className="py-2.5 pr-4 font-semibold text-wine-700">
                      {entry.total !== null ? `$${Number(entry.total).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-500">{entry.note ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-ink-500">{entry.performedByName ?? 'No disponible'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
