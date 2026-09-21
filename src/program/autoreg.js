// Autoregulation signal from the T1 AMRAP (the "+" rep-out on the last back-off).
//
// Rules (from the J&T 2.0 mesocycle guidance):
//   Meso A (wk1-3): AMRAP total reps >= 12          -> suggest a TM bump
//   Meso C (wk7-9): AMRAP >= 5 reps over target     -> suggest a TM bump
//   Meso B (wk4-6): last 3 AMRAPs never beat target -> suggest a TM reduction
//   Meso D:         no signal
// Bump/reduce size: +/-10 lb on lower-body days, +/-5 lb on upper-body days.
// Adjusts the training max via tmAdjust (the true 1RM only moves on a retest).
// (T2a is straight sets — no rep-out — so it gets no autoreg signal.)

import { DAYS, T1 } from './exercises.js'
import { metaForWeek, T1_WEEKS } from './progression.js'
import { tmForLift } from './generate.js'

// Reps on the AMRAP = the last logged set with reps entered (the rep-out set,
// including any extra "+" sets the lifter added).
function lastAmrapReps(node) {
  const sets = node?.sets ?? []
  for (let i = sets.length - 1; i >= 0; i--) {
    const r = Number(sets[i]?.reps)
    if (r > 0) return r
  }
  return null
}

const stepFor = (dayIndex) => (DAYS[dayIndex].dayType === 'lower' ? 10 : 5)

// Did the last 3 AMRAP-bearing sessions for this slot all fail to beat target?
// Rolling window over weeks (may reach back into the previous mesocycle).
function stalled(week, dayIndex, logs, getTargetForWeek, getNode) {
  const misses = []
  for (let w = week; w >= 1 && misses.length < 3; w--) {
    const target = getTargetForWeek(w)
    if (target == null) continue
    const actual = lastAmrapReps(getNode(w))
    if (actual == null) continue
    misses.push(actual <= target)
  }
  return misses.length === 3 && misses.every(Boolean)
}

function build(kind, type, base, extra) {
  return { kind, type, delta: type === 'bump' ? base.step : -base.step, ...base, ...extra }
}

export function t1Signal(week, dayIndex, profile, logs) {
  const meso = metaForWeek(week).meso
  if (meso === 'D') return null
  const w = T1_WEEKS[week]
  if (!w.backoff) return null // test week — no AMRAP
  const lift = DAYS[dayIndex].t1
  const target = w.backoff.reps
  const actual = lastAmrapReps(logs?.[`${week}-${dayIndex}`]?.t1)
  if (actual == null) return null

  const step = stepFor(dayIndex)
  const current = tmForLift(profile, lift)
  const base = { lift, label: `${T1[lift].name} TM`, target, actual, step, current }

  if (meso === 'A' && actual >= 12) {
    return build('t1', 'bump', base, { next: (current ?? 0) + step, reason: `${actual}-rep AMRAP (12+) — the weight is light.` })
  }
  if (meso === 'C' && actual - target >= 5) {
    return build('t1', 'bump', base, { next: (current ?? 0) + step, reason: `${actual} reps, +${actual - target} over target.` })
  }
  if (meso === 'B') {
    const getTarget = (wk) => T1_WEEKS[wk].backoff?.reps ?? null
    const getNode = (wk) => logs?.[`${wk}-${dayIndex}`]?.t1
    if (stalled(week, dayIndex, logs, getTarget, getNode)) {
      return build('t1', 'reduce', base, { next: (current ?? 0) - step, reason: 'No reps past target for 3 sessions — ease the load.' })
    }
  }
  return null
}

// NOTE: there is deliberately no T2a autoreg signal. T2a is straight sets (no
// rep-out), so an AMRAP-based signal doesn't apply — its progression is the %
// scheme plus updating the working max between cycles.
