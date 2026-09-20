// Cycle-level stats, derived from a cycle's logs so any past cycle stays
// comparable. Works identically on the active cycle and archived ones.

import { DAYS } from './exercises.js'
import { estimated1RM } from './estimate.js'

const T1_LIFTS = ['squat', 'bench', 'deadlift', 'ohp']
const dayOf = (key) => DAYS.find((d) => d.t1 === key).index
const TEST_WEEKS = [12, 6] // latest test first

// The lifter's tested 1RM for a lift from a cycle's logs: the final (Week 12)
// 1RM test, falling back to Week 6. Returns a rounded number or null.
export function testedMax(key, logs) {
  const dayIndex = dayOf(key)
  for (const w of TEST_WEEKS) {
    const s = logs?.[`${w}-${dayIndex}`]?.t1?.sets?.[0]
    const e = s && estimated1RM(s.weight, s.reps)
    if (e) return e.rounded
  }
  return null
}

// Best estimated 1RM for a lift across every logged top set in a cycle.
export function bestEstimate(key, logs) {
  const dayIndex = dayOf(key)
  let best = 0
  for (let w = 1; w <= 12; w++) {
    const s = logs?.[`${w}-${dayIndex}`]?.t1?.sets?.[0]
    const e = s && estimated1RM(s.weight, s.reps)
    if (e && e.rounded > best) best = e.rounded
  }
  return best || null
}

// Total logged volume (Σ weight×reps over every set of every session).
export function cycleVolume(logs) {
  let total = 0
  for (const session of Object.values(logs ?? {})) {
    for (const node of [session.t1, ...(session.t2 ?? []), ...(session.t3 ?? [])]) {
      for (const s of node?.sets ?? []) {
        const w = Number(s.weight)
        const r = Number(s.reps)
        if (w > 0 && r > 0) total += w * r
      }
    }
  }
  return total
}

export function sessionsCompleted(logs) {
  return Object.values(logs ?? {}).filter((s) => s.completedAt).length
}

// A comparable summary of a cycle (from its logs).
export function cycleStats(logs) {
  return {
    lifts: T1_LIFTS.map((key) => ({ key, tested: testedMax(key, logs), best: bestEstimate(key, logs) })),
    volume: cycleVolume(logs),
    sessions: sessionsCompleted(logs),
  }
}
