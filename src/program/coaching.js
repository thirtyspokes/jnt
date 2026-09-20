// Progression coaching for the T1 top set ("work up to an <n>RM").
//
// Two cases:
//  - No prior history at this rep-max: estimate a weight from the training max
//    (inverse Epley — the same family as the NASM 1RM calculator). 1RM test
//    weeks estimate off the true 1RM instead, since the top set IS a max.
//  - Prior history at this rep-max: show the last result and suggest a small
//    bump — +10 lb lower body / +5 lb upper (the article's "add 10/5 lbs"
//    convention) when the target was hit, or a repeat if it was missed.

import { DAYS } from './exercises.js'
import { T1_WEEKS } from './progression.js'
import { trainingMax } from './generate.js'
import { weightForReps } from './estimate.js'

const LOWER = new Set(['squat', 'deadlift'])

export function suggestT1(week, dayIndex, profile, logs) {
  const lift = DAYS[dayIndex].t1
  const targetRM = T1_WEEKS[week].topRM
  const oneRM = profile.oneRM?.[lift] ?? null
  const tm = trainingMax(oneRM, profile.tmPct)
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
