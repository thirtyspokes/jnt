import { useEffect, useState } from 'react'
import { DEFAULT_SELECTIONS } from '../program/exercises.js'

const KEY = 'jnt.profile.v1'

export const DEFAULT_PROFILE = {
  tmPct: 0.9, // Training max = 90% of true 1RM
  oneRM: { squat: '', bench: '', deadlift: '', ohp: '' },
  t2Max: {}, // optional working maxes for T2a lifts, keyed by exercise id
  t2Count: 2,
  t3Count: 3,
  custom: { t2: [], t3: [] }, // lifter-defined exercises
  selections: DEFAULT_SELECTIONS,
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
