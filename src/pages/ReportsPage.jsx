import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../utils/api'
import { useLog } from '../context/LogContext'
import { filterHistory, calculateTotalBilled } from '../utils/reports'

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

  function handleFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-100">Filtros</h3>
          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-red-700 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Actualizando…' : 'Refrescar desde la base de datos'}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="startDate" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Desde
            </label>
            <input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Hasta
            </label>
            <input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
          </div>
          <div>
            <label htmlFor="roomNumber" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Habitación
            </label>
            <select
              id="roomNumber"
              value={filters.roomNumber}
              onChange={(e) => handleFilterChange('roomNumber', e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
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

      <section className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6 shadow-sm">
        <p className="text-sm font-medium text-red-300">Total facturado en el rango filtrado</p>
        <p className="mt-1 text-3xl font-bold text-red-200">${totalBilled.toFixed(2)}</p>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-zinc-100">Historial de Check-in / Check-out</h3>
        {filteredEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-8 text-center">
            <p className="text-sm text-zinc-500">No hay movimientos para los filtros seleccionados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Habitación</th>
                  <th className="py-2 pr-4">Huésped</th>
                  <th className="py-2 pr-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={`${entry.type}-${entry.id}`} className="border-b border-zinc-800/60">
                    <td className="py-2.5 pr-4 text-zinc-400">{new Date(entry.at).toLocaleString()}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          entry.type === 'Check-in'
                            ? 'border-emerald-800 bg-emerald-950 text-emerald-300'
                            : 'border-amber-800 bg-amber-950 text-amber-300'
                        }`}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-zinc-200">{entry.roomNumber}</td>
                    <td className="py-2.5 pr-4 text-zinc-300">{entry.guestName ?? '—'}</td>
                    <td className="py-2.5 pr-4 font-semibold text-red-300">
                      {entry.total !== null ? `$${Number(entry.total).toFixed(2)}` : '—'}
                    </td>
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
