import { useEffect, useRef, useState } from 'react'
import { useLog } from '../../context/useLog'

function formatTime(date) {
  return date.toLocaleTimeString('es-EC', { hour12: false })
}

export default function LogPanel() {
  const { logs, clearLogs } = useLog()
  const [collapsed, setCollapsed] = useState(true)
  const endRef = useRef(null)

  useEffect(() => {
    if (!collapsed) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [logs, collapsed])

  return (
    <div className="border-t border-wine-900/40 bg-ink-900 font-mono text-ink-100">
      <div className="flex items-center justify-between border-b border-wine-900/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-wine-500" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            Panel de eventos <span className="text-ink-600">({logs.length})</span>
          </h4>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={clearLogs}
            className="text-xs text-ink-500 transition-colors hover:text-ink-200"
          >
            limpiar
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-xs text-ink-500 transition-colors hover:text-ink-200"
          >
            {collapsed ? 'expandir ▲' : 'colapsar ▼'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="h-40 overflow-y-auto px-4 py-2 text-xs leading-relaxed">
          {logs.length === 0 ? (
            <p className="text-ink-600">Sin eventos todavía. Las acciones del sistema aparecerán aquí.</p>
          ) : (
            logs.map((log) => (
              <p key={log.id} className={log.type === 'error' ? 'text-wine-400' : 'text-emerald-400'}>
                <span className="text-ink-600">[{formatTime(log.at)}]</span>{' '}
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
