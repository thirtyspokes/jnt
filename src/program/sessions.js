// Sequential session numbering across the program (1 .. 48).

import { DAYS } from './exercises.js'

export const WEEKS = 12
export const TOTAL_SESSIONS = WEEKS * DAYS.length // 48

// 1-based session number for a (week, dayIndex): W1D1 = 1, W1D4 = 4, W2D1 = 5…
export const sessionNumber = (week, dayIndex) => (week - 1) * DAYS.length + dayIndex + 1

// The next session to train: the first (in order) that isn't marked complete.
// Returns { week, dayIndex } or null when the whole program is done.
export function nextSession(logs) {
  for (let week = 1; week <= WEEKS; week++) {
    for (const d of DAYS) {
      if (!logs?.[`${week}-${d.index}`]?.completedAt) return { week, dayIndex: d.index }
    }
  }
  return null
}
