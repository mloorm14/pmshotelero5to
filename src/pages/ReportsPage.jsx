import { useMemo, useState } from 'react'
import { combineHistory, filterHistory, calculateTotalBilled } from '../utils/reports'

export default function ReportsPage({ rooms, checkInHistory, checkOutHistory }) {
  const [filters, setFilters] = useState({ startDate: '', endDate: '', roomNumber: '' })

  const allEntries = useMemo(() => combineHistory(checkInHistory, checkOutHistory), [checkInHistory, checkOutHistory])
  const filteredEntries = useMemo(() => filterHistory(allEntries, filters), [allEntries, filters])
  const totalBilled = useMemo(() => calculateTotalBilled(filteredEntries), [filteredEntries])

  function handleFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-900">Filtros</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="startDate" className="mb-1.5 block text-sm font-medium text-slate-700">
              Desde
            </label>
            <input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="mb-1.5 block text-sm font-medium text-slate-700">
              Hasta
            </label>
            <input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label htmlFor="roomNumber" className="mb-1.5 block text-sm font-medium text-slate-700">
              Habitación
            </label>
            <select
              id="roomNumber"
              value={filters.roomNumber}
              onChange={(e) => handleFilterChange('roomNumber', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
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

      <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-indigo-700">Total facturado en el rango filtrado</p>
        <p className="mt-1 text-3xl font-bold text-indigo-900">${totalBilled.toFixed(2)}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-900">Historial de Check-in / Check-out</h3>
        {filteredEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">No hay movimientos para los filtros seleccionados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Habitación</th>
                  <th className="py-2 pr-4">Huésped</th>
                  <th className="py-2 pr-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={`${entry.type}-${entry.id}`} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 text-slate-600">{new Date(entry.at).toLocaleString()}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          entry.type === 'Check-in'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-slate-800">{entry.roomNumber}</td>
                    <td className="py-2.5 pr-4 text-slate-700">{entry.guest?.fullName ?? '—'}</td>
                    <td className="py-2.5 pr-4 font-semibold text-indigo-700">
                      {entry.billing ? `$${Number(entry.billing.total).toFixed(2)}` : '—'}
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
