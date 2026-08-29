import { useCallback, useEffect, useRef, useState } from 'react'

// Mensaje de confirmación/error visible en la UI principal (no solo en el
// LogPanel) tras una acción, que se auto-oculta pasado `durationMs`.
// Heurística de Nielsen #1 (visibilidad del estado del sistema).
export function useTransientMessage(durationMs = 4000) {
  const [message, setMessage] = useState(null)
  const timeoutRef = useRef(null)

  const showMessage = useCallback(
    (text, type = 'success') => {
      setMessage({ text, type })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setMessage(null), durationMs)
    },
    [durationMs],
  )

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  return [message, showMessage]
}
