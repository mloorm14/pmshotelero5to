import { useEffect, useRef, useState } from 'react'
import { useLog } from '../../context/LogContext'

function formatTime(date) {
  return date.toLocaleTimeString('es-EC', { hour12: false })
}

export default function LogPanel() {
  const { logs, clearLogs } = useLog()
  const [collapsed, setCollapsed] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (!collapsed) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [logs, collapsed])

  return (
    <div className="border-t border-red-900/40 bg-zinc-900 font-mono text-zinc-100">
      <div className="flex items-center justify-between border-b border-red-900/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Panel de eventos <span className="text-zinc-600">({logs.length})</span>
          </h4>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={clearLogs}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-200"
          >
            limpiar
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-200"
          >
            {collapsed ? 'expandir ▲' : 'colapsar ▼'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="h-40 overflow-y-auto px-4 py-2 text-xs leading-relaxed">
          {logs.length === 0 ? (
            <p className="text-zinc-600">Sin eventos todavía. Las acciones del sistema aparecerán aquí.</p>
          ) : (
            logs.map((log) => (
              <p key={log.id} className={log.type === 'error' ? 'text-red-400' : 'text-emerald-400'}>
                <span className="text-zinc-600">[{formatTime(log.at)}]</span>{' '}
                {log.type === 'error' ? '✗' : '✓'} {log.message}
              </p>
            ))
          )}
          <div ref={endRef} />
        </div>
      )}
    </div>
  )
}
