// Estimated 1RM from a work set, via the Epley formula.
//   1RM = w * (1 + reps/30)   (reps > 1), or just w for a single.
// Returns null when inputs are missing/invalid.

import { roundNearest } from './rounding.js'

export function estimated1RM(weight, reps) {
  const w = Number(weight)
  const r = Number(reps)
  if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(r) || r <= 0) return null
  const raw = r <= 1 ? w : w * (1 + r / 30)
  return { raw, rounded: roundNearest(raw) }
}

// Inverse Epley: the weight that should be an `reps`-rep max for a given 1RM.
// w = 1RM / (1 + reps/30). Rounded to the nearest 5 lb. Returns null on bad input.
export function weightForReps(oneRM, reps) {
  const w = Number(oneRM)
  const r = Number(reps)
  if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(r) || r <= 0) return null
  const raw = r <= 1 ? w : w / (1 + r / 30)
  return roundNearest(raw)
}
