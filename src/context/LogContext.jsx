import { useCallback, useState } from 'react'
import { LogContext } from './logContext'

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
