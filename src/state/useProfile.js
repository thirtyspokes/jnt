import { useEffect, useState } from 'react'
import { DEFAULT_SELECTIONS } from '../program/exercises.js'

const KEY = 'jnt.profile.v1'

export const DEFAULT_PROFILE = {
  tmPct: 0.9, // Training max = 90% of true 1RM
  oneRM: { squat: '', bench: '', deadlift: '', ohp: '' },
  tmAdjust: { squat: 0, bench: 0, deadlift: 0, ohp: 0 }, // autoreg offsets on top of the derived TM
  t2Max: {}, // optional working maxes for T2a lifts, keyed by exercise id
  t2Count: 2,
  t3Count: 3,
  custom: { t2: [], t3: [] }, // lifter-defined exercises
  selections: DEFAULT_SELECTIONS,
  dayOrder: [0, 1, 2, 3], // display/session order of days (stable ids 0-3, +4 when 5th on)
  cycleStartedAt: null, // when the active cycle began (set on "start next cycle")
  cycleStartMaxes: null, // snapshot of the 1RMs this cycle started from (baseline for gains)
  // Optional accessory-focused 5th day (off by default).
  fifthDay: { enabled: false, count: 4, lifts: ['bb_row', 'lat_pulldown', 'ez_curl', 'calf_raise'] },
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PROFILE
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_PROFILE, ...parsed }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function useProfile() {
  const [profile, setProfile] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(profile))
    } catch {
      /* storage unavailable (private window, etc.) — run in-memory */
    }
  }, [profile])

  return [profile, setProfile]
}

// A profile whose numeric maxes are coerced to numbers for calculation.
export function numericProfile(profile) {
  const num = (v) => {
    const n = parseFloat(v)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  return {
    ...profile,
    oneRM: Object.fromEntries(
      Object.entries(profile.oneRM).map(([k, v]) => [k, num(v)]),
    ),
    t2Max: Object.fromEntries(
      Object.entries(profile.t2Max || {}).map(([k, v]) => [k, num(v)]),
    ),
  }
}

export function hasAllMaxes(profile) {
  return ['squat', 'bench', 'deadlift', 'ohp'].every((k) => {
    const n = parseFloat(profile.oneRM[k])
    return Number.isFinite(n) && n > 0
  })
}
