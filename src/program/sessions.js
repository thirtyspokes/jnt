// Session numbering across the program. Numbers are chronological over the days
// that actually exist each week, so enabling the accessory 5th day adds numbered
// sessions (total 48 -> 57) with no gaps; core-only stays 1..48.

import { daysInWeek } from './generate.js'

export const WEEKS = 12

// Total sessions in the program for this profile (48 core, +1 per active 5th day).
export function totalSessions(profile) {
  let n = 0
  for (let w = 1; w <= WEEKS; w++) n += daysInWeek(w, profile).length
  return n
}

// 1-based chronological number of a (week, dayIndex), respecting day order.
export function sessionNumber(week, dayIndex, profile) {
  let before = 0
  for (let w = 1; w < week; w++) before += daysInWeek(w, profile).length
  const pos = daysInWeek(week, profile).findIndex((d) => d.index === dayIndex)
  return before + pos + 1
}

// The next session to train: the first (in order, including an active accessory
// day) that isn't marked complete. Returns { week, dayIndex } or null when done.
export function nextSession(logs, profile) {
  for (let week = 1; week <= WEEKS; week++) {
    for (const d of daysInWeek(week, profile)) {
      if (!logs?.[`${week}-${d.index}`]?.completedAt) return { week, dayIndex: d.index }
    }
  }
  return null
}
