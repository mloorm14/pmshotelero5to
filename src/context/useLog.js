import { useContext } from 'react'
import { LogContext } from './logContext'

export function useLog() {
  const ctx = useContext(LogContext)
  if (!ctx) throw new Error('useLog debe usarse dentro de un LogProvider')
  return ctx
}
