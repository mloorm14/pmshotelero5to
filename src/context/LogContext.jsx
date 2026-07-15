import { createContext, useCallback, useContext, useState } from 'react'

const LogContext = createContext(null)

let logIdCounter = 0

export function LogProvider({ children }) {
  const [logs, setLogs] = useState([])

  const addLog = useCallback((message, type = 'success') => {
    logIdCounter += 1
    const entry = { id: logIdCounter, message, type, at: new Date() }
    setLogs((prev) => [...prev, entry])
    return entry
  }, [])

  const clearLogs = useCallback(() => setLogs([]), [])

  return <LogContext.Provider value={{ logs, addLog, clearLogs }}>{children}</LogContext.Provider>
}

export function useLog() {
  const ctx = useContext(LogContext)
  if (!ctx) throw new Error('useLog debe usarse dentro de un LogProvider')
  return ctx
}
