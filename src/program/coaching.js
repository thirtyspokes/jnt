// Progression coaching for the T1 top set ("work up to an <n>RM").
//
// Two cases:
//  - No prior history at this rep-max: estimate a weight from the training max
//    (inverse Epley — the same family as the NASM 1RM calculator). 1RM test
//    weeks estimate off the true 1RM instead, since the top set IS a max.
//  - Prior history at this rep-max: show the last result and suggest a small
//    bump — +10 lb lower body / +5 lb upper (the article's "add 10/5 lbs"
//    convention) when the target was hit, or a repeat if it was missed.

import { DAYS, t2Name } from './exercises.js'
import { T1_WEEKS, T2A_WEEKS } from './progression.js'
import { tmForLift } from './generate.js'
import { weightForReps } from './estimate.js'
import { roundNearest } from './rounding.js'

const LOWER = new Set(['squat', 'deadlift'])

export function suggestT1(week, dayIndex, profile, logs) {
  const lift = DAYS[dayIndex].t1
  const targetRM = T1_WEEKS[week].topRM
  const oneRM = profile.oneRM?.[lift] ?? null
  const tm = tmForLift(profile, lift)
  const increment = LOWER.has(lift) ? 10 : 5

  // Prior sessions (other weeks) with the same target RM and a logged top set.
  const history = []
  for (let w = 1; w <= 12; w++) {
    if (w === week || T1_WEEKS[w].topRM !== targetRM) continue
    const s = logs?.[`${w}-${dayIndex}`]?.t1?.sets?.[0]
    if (s && Number(s.weight) > 0 && Number(s.reps) > 0) {
      history.push({ week: w, weight: Number(s.weight), reps: Number(s.reps) })
    }
  }
  history.sort((a, b) => b.week - a.week) // most recent in program order
  const prev = history[0] || null

  if (prev) {
    const hit = prev.reps >= targetRM
    return {
      lift,
      targetRM,
      mode: 'history',
      prev,
      hit,
      increment,
      suggested: hit ? prev.weight + increment : prev.weight,
    }
  }

  // No history: 1RM weeks estimate off the true 1RM, others off the TM.
  const isTest = targetRM === 1
  const basis = isTest ? oneRM : tm
  return {
    lift,
    targetRM,
    mode: isTest ? 'test' : 'calc',
    prev: null,
    increment,
    tm,
    suggested: weightForReps(basis, targetRM),
  }
}

// The weight used on the most recent prior logged instance of a T3 slot on this
// day. Returns { week, weight } or null (e.g., the first week).
export function previousT3Weight(week, dayIndex, slot, logs) {
  for (let w = week - 1; w >= 1; w--) {
    const sets = logs?.[`${w}-${dayIndex}`]?.t3?.[slot]?.sets ?? []
    for (const s of sets) {
      const wt = Number(s.weight)
      if (wt > 0) return { week: w, weight: wt }
    }
  }
  return null
}

// The last logged working set (weight + reps) in a node.
function lastLoggedSet(node) {
  const sets = node?.sets ?? []
  for (let i = sets.length - 1; i >= 0; i--) {
    const w = Number(sets[i]?.weight)
    const r = Number(sets[i]?.reps)
    if (w > 0 && r > 0) return { weight: w, reps: r }
  }
  return null
}

// Progressive-overload coaching for a T2a lift that has NO working max: since
// there's no computed weight, look at the previous logged instance of this day
// and, if it beat the rep target, suggest going heavier this session.
export function t2aOverloadTip(week, dayIndex, profile, logs) {
  if (!T2A_WEEKS[week]) return null // no T2a this week
  const id = profile.selections?.[dayIndex]?.t2?.[0]
  if (!id) return null
  if (Number(profile.t2Max?.[id]) > 0) return null // has a working max -> autoreg path handles it

  for (let w = week - 1; w >= 1; w--) {
    if (!T2A_WEEKS[w]) continue
    const last = lastLoggedSet(logs?.[`${w}-${dayIndex}`]?.t2?.[0])
    if (!last) continue
    const target = T2A_WEEKS[w].reps
    const exceeded = last.reps > target
    const step = DAYS[dayIndex].dayType === 'lower' ? 10 : 5
    return {
      exName: t2Name(id, profile.custom?.t2 ?? []),
      prevWeek: w,
      prevWeight: last.weight,
      prevReps: last.reps,
      prevTarget: target,
      exceeded,
      step,
      suggested: exceeded ? roundNearest(last.weight + step) : last.weight,
    }
  }
  return null
}
