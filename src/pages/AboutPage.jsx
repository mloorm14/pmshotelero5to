const MODULES = [
  {
    name: 'Reservas',
    reads: ['rooms'],
    writes: ['reservations'],
    note: 'Crea reservas sobre una habitación existente y valida solapamiento de fechas contra otras reservas activas.',
  },
  {
    name: 'Recepción (Check-in)',
    reads: ['rooms', 'reservations'],
    writes: ['rooms', 'check_in_history', 'reservations'],
    note: 'Solo permite check-in si la habitación está "Limpia". Puede precargarse desde una reserva Confirmada (marca reservations.checked_in = true).',
  },
  {
    name: 'Caja (Check-out)',
    reads: ['rooms'],
    writes: ['rooms', 'check_out_history'],
    note: 'Solo permite check-out si la habitación está "Ocupada".',
  },
  {
    name: 'Ama de Llaves',
    reads: ['rooms'],
    writes: ['rooms'],
    note: 'Cambia el estado de la habitación (Sucia → Limpia, o hacia/desde Mantenimiento).',
  },
  {
    name: 'Reportes / Auditoría',
    reads: ['check_in_history', 'check_out_history'],
    writes: [],
    note: 'Vista de solo lectura: combina y filtra ambos historiales. Refleja cualquier check-in/check-out en cuanto se refresca la vista.',
  },
]

const INTEGRATION_CHAINS = [
  {
    title: 'Ciclo de vida completo de una habitación',
    chain: 'Reservas > Recepción > Caja > Reportes',
    description:
      'Crear reserva → confirmar → convertir a check-in → procesar check-out → verificar que ambos movimientos aparecen en Reportes con el total correcto.',
  },
  {
    title: 'Bloqueo de check-in por estado de habitación',
    chain: 'Ama de Llaves > Recepción',
    description:
      'Enviar una habitación a Mantenimiento u observarla Sucia → intentar check-in sobre esa habitación → debe rechazarse (UI y API) y quedar registrado en el panel de logs.',
  },
  {
    title: 'Solapamiento de reservas',
    chain: 'Reservas > Reservas',
    description:
      'Crear una reserva para una habitación y rango de fechas → intentar crear otra reserva que se solape en fechas para la misma habitación → debe rechazarse.',
  },
  {
    title: 'Visibilidad por rol',
    chain: 'Selector de rol > Sidebar > (todos los módulos)',
    description:
      'Cambiar el rol a Recepcionista → Ama de Llaves y Reportes deben desaparecer de la navegación y no ser accesibles.',
  },
]

function Tag({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-xs font-mono text-zinc-700">
      {children}
    </span>
  )
}

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-base font-semibold text-zinc-900">Arquitectura</h3>
        <p className="mb-4 text-sm text-zinc-600">
          React (frontend) se comunica por HTTP con una API REST en Express, que persiste todo en PostgreSQL.
        </p>
        <pre className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-100 p-4 text-xs leading-relaxed text-zinc-700">
{`┌──────────────┐        fetch (JSON)        ┌──────────────┐        SQL parametrizado        ┌──────────────┐
│   React      │  ───────────────────────▶  │  Express API │  ───────────────────────────▶   │  PostgreSQL  │
│  (Vite, :5173)│  ◀───────────────────────  │   (:3001)    │  ◀───────────────────────────   │   (:5432)    │
└──────────────┘                             └──────────────┘                                  └──────────────┘`}
        </pre>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-zinc-900">Mapa de subsistemas</h3>
        <p className="mb-4 text-sm text-zinc-600">
          Dependencias de cada módulo respecto a las tablas de la base de datos, útil para diseñar pruebas de integración.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-600">
                <th className="py-2 pr-4">Módulo</th>
                <th className="py-2 pr-4">Lee de</th>
                <th className="py-2 pr-4">Escribe en</th>
                <th className="py-2 pr-4">Nota</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod) => (
                <tr key={mod.name} className="border-b border-zinc-100 align-top">
                  <td className="py-3 pr-4 font-semibold text-zinc-900">{mod.name}</td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1.5">
                      {mod.reads.map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1.5">
                      {mod.writes.length === 0 ? (
                        <span className="text-xs text-zinc-600">—</span>
                      ) : (
                        mod.writes.map((t) => <Tag key={t}>{t}</Tag>)
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-zinc-600">{mod.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-zinc-900">Cadenas de prueba de integración sugeridas</h3>
        <p className="mb-4 text-sm text-zinc-600">
          Formato Subsistema/s: A &gt; B &gt; C, como referencia para documentar los casos de prueba de la materia.
        </p>
        <div className="space-y-4">
          {INTEGRATION_CHAINS.map((item) => (
            <div key={item.title} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
              <p className="mt-1 font-mono text-xs text-red-700">Subsistema/s: {item.chain}</p>
              <p className="mt-2 text-sm text-zinc-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
