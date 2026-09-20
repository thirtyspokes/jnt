import { useCallback, useEffect, useState } from 'react'

const KEY = 'jnt.logs.v1'

// logs["<week>-<dayIndex>"] = {
//   completedAt: string|null, note: string,
//   t1: { name, sets: [ {weight, reps}, ... ] },
//   t2: [ { name, sets: [...] }, ... ],   // by slot
//   t3: [ { name, sets: [...] }, ... ],
// }

const sessionKey = (week, day) => `${week}-${day}`

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const emptySession = () => ({ completedAt: null, note: '', t1: null, t2: [], t3: [] })
const emptyNode = (name) => ({ name: name ?? '', sets: [] })
const emptySet = () => ({ weight: '', reps: '' })

// Locate (creating as needed) the exercise node for a ref within a session.
// ref = { tier: 't1' } | { tier: 't2'|'t3', slot: number }
function ensureNode(session, ref, name) {
  if (ref.tier === 't1') {
    if (!session.t1) session.t1 = emptyNode(name)
    if (name) session.t1.name = name
    return session.t1
  }
  const arr = session[ref.tier]
  while (arr.length <= ref.slot) arr.push(null)
  if (!arr[ref.slot]) arr[ref.slot] = emptyNode(name)
  if (name) arr[ref.slot].name = name
  return arr[ref.slot]
}

function ensureSet(node, setIdx) {
  while (node.sets.length <= setIdx) node.sets.push(emptySet())
  return node.sets[setIdx]
}

export function useLogs() {
  const [logs, setLogs] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(logs))
    } catch {
      /* storage unavailable — run in-memory */
    }
  }, [logs])

  // Immutable update of one session by a mutator over a cloned copy.
  const mutate = useCallback((week, day, fn) => {
    setLogs((prev) => {
      const key = sessionKey(week, day)
      const session = prev[key] ? structuredClone(prev[key]) : emptySession()
      fn(session)
      return { ...prev, [key]: session }
    })
  }, [])

  const api = {
    getSession: (week, day) => logs[sessionKey(week, day)] || null,

    setActualSet: (week, day, ref, setIdx, patch, name) =>
      mutate(week, day, (s) => {
        const node = ensureNode(s, ref, name)
        const set = ensureSet(node, setIdx)
        Object.assign(set, patch)
      }),

    addSet: (week, day, ref, name) =>
      mutate(week, day, (s) => {
        const node = ensureNode(s, ref, name)
        node.sets.push(emptySet())
      }),

    removeSet: (week, day, ref, setIdx) =>
      mutate(week, day, (s) => {
        const node = ensureNode(s, ref)
        if (node.sets.length > setIdx) node.sets.splice(setIdx, 1)
      }),

    setNote: (week, day, note) => mutate(week, day, (s) => { s.note = note }),

    setComplete: (week, day, done) =>
      mutate(week, day, (s) => { s.completedAt = done ? new Date().toISOString() : null }),

    // Record that an autoreg signal was actioned so it stops showing.
    setSignal: (week, day, key, status) =>
      mutate(week, day, (s) => { s.signals = { ...(s.signals || {}), [key]: status } }),

    clearAll: () => setLogs({}),
  }

  return [logs, api]
}

export function isComplete(logs, week, day) {
  return !!logs[sessionKey(week, day)]?.completedAt
}

// Numeric view of a session's node for calculations.
export function numTop(node) {
  const s = node?.sets?.[0]
  if (!s) return null
  const w = Number(s.weight)
  const r = Number(s.reps)
  if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(r) || r <= 0) return null
  return { weight: w, reps: r }
}
