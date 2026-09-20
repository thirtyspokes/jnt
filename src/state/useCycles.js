import { useCallback, useEffect, useState } from 'react'

// Archived (completed) 12-week cycles. The active cycle stays in the profile +
// logs stores; a cycle moves here when the lifter starts the next one.
const KEY = 'jnt.cycles.v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useCycles() {
  const [cycles, setCycles] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(cycles))
    } catch {
      /* storage unavailable */
    }
  }, [cycles])

  const archive = useCallback((record) => setCycles((prev) => [...prev, record]), [])
  const clearAll = useCallback(() => setCycles([]), [])

  return [cycles, { archive, clearAll }]
}
