const MODULES = [
  {
    name: 'Reservas',
    reads: ['rooms'],
    writes: ['reservations'],
    note: 'Crea reservas sobre una habitación existente y valida solapamiento de fechas contra otras reservas activas. Documento/teléfono del huésped son opcionales; si se cargan, quedan disponibles para precargar (de solo lectura) el check-in.',
  },
  {
    name: 'Recepción (Check-in)',
    reads: ['rooms', 'reservations'],
    writes: ['rooms', 'check_in_history', 'reservations'],
    note: 'Solo permite check-in si la habitación está "Limpia". Puede precargarse desde una reserva Confirmada (la marca "En curso" vía reservations.status — no existe un booleano checked_in separado). Si la reserva traía documento/teléfono, esos campos quedan de solo lectura en el check-in.',
  },
  {
    name: 'Caja (Check-out)',
    reads: ['rooms', 'payments'],
    writes: ['rooms', 'check_out_history', 'reservations', 'payments'],
    note: 'Solo permite check-out si la habitación está "Ocupada" y el saldo (con signo) de la estadía es $0, salvo checkout forzado (walk-out): registra el saldo pendiente en payments y exige un motivo. Cierra a "Finalizada" la reserva "En curso" vinculada, si existe.',
  },
  {
    name: 'Ama de Llaves',
    reads: ['rooms'],
    writes: ['rooms'],
    note: 'Cambia el estado de la habitación (Sucia → Limpia, o hacia/desde Mantenimiento).',
  },
  {
    name: 'Pagos (anticipo/devolución/cobro final)',
    reads: ['rooms', 'check_in_history', 'payments'],
    writes: ['payments'],
    note: 'Solo admite pagos mientras la habitación está "Ocupada"; ancla cada pago a la última fila de check_in_history de esa habitación (la estadía activa).',
  },
  {
    name: 'Habitaciones (CRUD)',
    reads: ['rooms', 'reservations', 'payments'],
    writes: ['rooms'],
    note: 'Alta, edición de tarifa/capacidad/número y baja. La baja se rechaza si la habitación está "Ocupada", tiene reservas activas o anticipos de una estadía sin cerrar.',
  },
  {
    name: 'Disponibilidad',
    reads: ['rooms', 'reservations'],
    writes: [],
    note: 'Vista de solo lectura: calendario por habitación que reutiliza hasDateOverlap para marcar días bloqueados por reservas activas o la estadía en curso.',
  },
  {
    name: 'Alertas de check-out',
    reads: ['rooms'],
    writes: [],
    note: 'Deriva de rooms.check_out_date sin tabla propia; clasifica cada habitación Ocupada en vencida/hoy/próxima (24-48h)/normal.',
  },
  {
    name: 'Reportes / Auditoría',
    reads: ['check_in_history', 'check_out_history', 'payments'],
    writes: [],
    note: 'Vista de solo lectura: combina ambos historiales con los pagos "Saldo pendiente por cobrar" de checkouts forzados (mostrados aparte, sin sumarse al total facturado). Refleja cualquier movimiento en cuanto se refresca la vista.',
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
      'Cambiar el rol a Recepcionista → Ama de Llaves, Habitaciones y Reportes deben desaparecer de la navegación y no ser accesibles.',
  },
  {
    title: 'Anticipo cubre el saldo en el check-out',
    chain: 'Recepción > Pagos > Caja',
    description:
      'Registrar un anticipo durante el check-in → en Caja el saldo a cobrar debe mostrar total − anticipo, no el total completo.',
  },
  {
    title: 'Devolución no puede exceder los anticipos',
    chain: 'Pagos > Caja',
    description:
      'Con anticipos registrados por $X, intentar una devolución mayor a $X → la API responde 409 y no se registra el pago.',
  },
  {
    title: 'Baja de habitación bloqueada por estadía sin cerrar',
    chain: 'Ama de Llaves > Pagos > Habitaciones',
    description:
      'Hacer check-in con anticipo, enviar la habitación a Mantenimiento sin pasar por Caja (estadía sin cerrar) → intentar eliminarla desde Habitaciones debe rechazarse (409).',
  },
  {
    title: 'Calendario de disponibilidad refleja reservas y estadía en curso',
    chain: 'Reservas > Disponibilidad > Recepción',
    description:
      'Crear una reserva confirmada → sus fechas aparecen bloqueadas en Disponibilidad; al hacer check-in de esa habitación, los días de la estadía en curso también quedan bloqueados.',
  },
  {
    title: 'Checkout bloqueado con saldo pendiente sin forzar',
    chain: 'Recepción > Pagos > Caja > API',
    description:
      'Check-in con anticipo parcial → intentar "Procesar Check-out" sin cobrar el saldo → el botón está deshabilitado en la UI y POST /api/checkout responde 409 si se llama directo sin forced:true.',
  },
  {
    title: 'Checkout forzado no infla el total facturado',
    chain: 'Caja > Reportes',
    description:
      'Mismo escenario anterior, usar "Salida sin pago completo" con motivo → la reserva queda Finalizada y la habitación Sucia; en Reportes el monto aparece en "Pendiente de cobro", no sumado al total facturado.',
  },
]

function Tag({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-ink-300 bg-ink-100 px-2 py-0.5 text-xs font-mono text-ink-700">
      {children}
    </span>
  )
}

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-base font-semibold text-ink-900">Arquitectura</h3>
        <p className="mb-4 text-sm text-ink-500">
          React (frontend) se comunica por HTTP con una API REST en Express, que persiste todo en PostgreSQL.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-ink-200 bg-ink-100 p-4 text-xs leading-relaxed text-ink-700">
{`┌──────────────┐        fetch (JSON)        ┌──────────────┐        SQL parametrizado        ┌──────────────┐
│   React      │  ───────────────────────▶  │  Express API │  ───────────────────────────▶   │  PostgreSQL  │
│  (Vite, :5173)│  ◀───────────────────────  │   (:3001)    │  ◀───────────────────────────   │   (:5432)    │
└──────────────┘                             └──────────────┘                                  └──────────────┘`}
        </pre>
      </section>

      <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-ink-900">Mapa de subsistemas</h3>
        <p className="mb-4 text-sm text-ink-500">
          Dependencias de cada módulo respecto a las tablas de la base de datos, útil para diseñar pruebas de integración.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-xs uppercase tracking-wider text-ink-500">
                <th className="py-2 pr-4">Módulo</th>
                <th className="py-2 pr-4">Lee de</th>
                <th className="py-2 pr-4">Escribe en</th>
                <th className="py-2 pr-4">Nota</th>
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod) => (
                <tr key={mod.name} className="border-b border-ink-100 align-top">
                  <td className="py-3 pr-4 font-semibold text-ink-900">{mod.name}</td>
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
                        <span className="text-xs text-ink-500">—</span>
                      ) : (
                        mod.writes.map((t) => <Tag key={t}>{t}</Tag>)
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-sm text-ink-500">{mod.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-ink-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-semibold text-ink-900">Cadenas de prueba de integración sugeridas</h3>
        <p className="mb-4 text-sm text-ink-500">
          Formato Subsistema/s: A &gt; B &gt; C, como referencia para documentar los casos de prueba de la materia.
        </p>
        <div className="space-y-4">
          {INTEGRATION_CHAINS.map((item) => (
            <div key={item.title} className="rounded-lg border border-ink-200 bg-ink-50 p-4">
              <p className="text-sm font-semibold text-ink-900">{item.title}</p>
              <p className="mt-1 font-mono text-xs text-wine-700">Subsistema/s: {item.chain}</p>
              <p className="mt-2 text-sm text-ink-500">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
