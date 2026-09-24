// Turns a lifter profile + (week, day) into a concrete session plan.
// Every exercise is expanded into an ordered list of *planned sets* so the UI
// can render a per-set logging table.

import { DAYS, DAY5, T1, t2Name, t3Name, exerciseName, dayByIndex } from './exercises.js'
import {
  metaForWeek,
  T1_WEEKS,
  T2A_WEEKS,
  T2_MRS_WEEKS,
  T3_MRS_WEEKS,
  MRS_SETS,
  fifthDayActive,
  fifthDayTarget,
} from './progression.js'
import { roundUp, roundNearest } from './rounding.js'

// The lifter's chosen day order (stable ids). Robust to old profiles and keeps
// the 5th day (id 4) present iff it's enabled.
export function dayOrderFor(profile) {
  let order = Array.isArray(profile?.dayOrder) ? profile.dayOrder.filter((i) => i >= 0 && i <= 4) : []
  for (const i of [0, 1, 2, 3]) if (!order.includes(i)) order.push(i) // ensure the 4 core days
  const on = !!profile?.fifthDay?.enabled
  if (on && !order.includes(4)) order.push(4)
  if (!on) order = order.filter((i) => i !== 4)
  return order
}

// The training days that exist in a given week, in the lifter's order (the
// accessory 5th day appears only when enabled and active that week).
export function daysInWeek(week, profile) {
  const fifthOn = profile?.fifthDay?.enabled && fifthDayActive(week)
  return dayOrderFor(profile)
    .filter((i) => i !== DAY5.index || fifthOn)
    .map(dayByIndex)
}

const typeLabel = (day) =>
  day.accessory ? 'Weakpoints' : day.dayType === 'lower' ? 'Lower' : 'Upper'

// Positional label for a day within its week, e.g. "Day 2 — Lower".
export function dayLabel(week, dayIndex, profile) {
  const pos = daysInWeek(week, profile).findIndex((d) => d.index === dayIndex)
  return `Day ${pos + 1} — ${typeLabel(dayByIndex(dayIndex))}`
}

// Training max for a T1 lift, from the entered true 1RM.
export function trainingMax(oneRM, tmPct) {
  if (!oneRM) return null
  return roundNearest(oneRM * tmPct) // displayed & used at 5-lb resolution
}

// Effective TM for a lift = derived TM + the autoregulation offset (tmAdjust).
// The true 1RM only changes on a retest; autoreg nudges stack on top here.
export function tmForLift(profile, liftId) {
  const base = trainingMax(profile.oneRM?.[liftId], profile.tmPct)
  if (base == null) return null
  return base + (profile.tmAdjust?.[liftId] || 0)
}

const pct = (p) => `${Math.round(p * 100)}%`
const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

// A PlannedSet: { kind, label, weight|null, repsTarget|null, repsLabel, detail }
// kinds: 'top' | 'backoff' | 'work' | 'mrs'

function mrsExercise(tier, name, rmTarget) {
  const sets = [
    {
      kind: 'top',
      label: 'Top set',
      weight: null,
      repsTarget: rmTarget,
      repsLabel: `${rmTarget}RM`,
      detail: 'Work up · 1–2 reps in reserve',
    },
  ]
  for (let k = 0; k < MRS_SETS; k++) {
    sets.push({
      kind: 'mrs',
      label: `Max-rep ${k + 1}`,
      weight: null,
      repsTarget: null,
      repsLabel: 'max',
      detail: 'Same weight · 30–60s rest',
    })
  }
  return { tier, name, sets, mrs: true, plus: false }
}

function buildT1(week, day, profile, log) {
  const lift = T1[day.t1]
  const oneRM = profile.oneRM?.[day.t1] ?? null
  const tm = tmForLift(profile, day.t1)
  const w = T1_WEEKS[week]

  const sets = [
    {
      kind: 'top',
      label: 'Top set',
      weight: null,
      repsTarget: w.topRM,
      repsLabel: `${w.topRM}RM`,
      detail: w.test ? 'Test — new 1RM attempt' : 'Work up · leave 1–2 in the tank',
    },
  ]

  if (w.backoff) {
    const b = w.backoff
    let weight = null
    let detail
    if (b.base === 'TM') {
      weight = tm != null ? roundUp(tm * b.pct) : null
      detail = `${pct(b.pct)} of TM`
    } else {
      // % of that day's top-set RM — concrete once the top set is logged.
      const topWeight = num(log?.t1?.sets?.[0]?.weight)
      weight = topWeight != null ? roundUp(topWeight * b.pct) : null
      detail =
        topWeight != null
          ? `${pct(b.pct)} of today's ${w.topRM}RM (${topWeight})`
          : `${pct(b.pct)} of today's ${w.topRM}RM`
    }
    for (let i = 0; i < b.sets; i++) {
      const last = i === b.sets - 1
      sets.push({
        kind: 'backoff',
        label: `Back-off ${i + 1}`,
        weight,
        repsTarget: b.reps,
        repsLabel: last ? `${b.reps}+` : `${b.reps}`,
        amrap: last, // last back-off is the rep-out — don't prefill its reps
        detail: last ? `${detail} · rep-out` : detail,
      })
    }
    return { tier: 'T1', key: lift.id, name: lift.name, oneRM, tm, test: !!w.test, sets, plus: !!b.setsPlus }
  }

  return { tier: 'T1', key: lift.id, name: lift.name, oneRM, tm, test: !!w.test, sets, plus: false }
}

function buildT2(week, day, profile) {
  const ids = profile.selections?.[day.index]?.t2 ?? []
  const custom = profile.custom?.t2 ?? []
  const t2a = T2A_WEEKS[week]
  const mrsTarget = T2_MRS_WEEKS[week]
  const out = []

  ids.forEach((id, i) => {
    // First T2 slot follows the T2a percentage progression; the rest are MRS.
    if (i === 0 && t2a) {
      const max = profile.t2Max?.[id] ?? null
      const weight = max != null ? roundUp(max * t2a.pct) : null
      const sets = []
      for (let s = 0; s < t2a.sets; s++) {
        // T2a is straight sets — no AMRAP/rep-out on the last set.
        sets.push({
          kind: 'work',
          label: `Set ${s + 1}`,
          weight,
          repsTarget: t2a.reps,
          repsLabel: `${t2a.reps}`,
          detail: `${pct(t2a.pct)} × ${t2a.reps}`,
        })
      }
      out.push({
        tier: 'T2a',
        name: t2Name(id, custom),
        sets,
        plus: false,
        note: max == null ? 'Add a working max for this lift to see the weight.' : null,
      })
    } else if (mrsTarget) {
      out.push(mrsExercise('T2', t2Name(id, custom), mrsTarget))
    }
    // else: this tier is dropped this week (recovery/peak) — slot omitted.
  })
  return out
}

function buildT3(week, day, profile) {
  const ids = profile.selections?.[day.index]?.t3 ?? []
  const custom = profile.custom?.t3 ?? []
  const target = T3_MRS_WEEKS[week]
  if (!target) return []
  return ids.map((id) => mrsExercise('T3', t3Name(id, custom), target))
}

// The accessory day: no T1/T2, every lift run as max-rep-set work on the T3
// schedule. Lifts live in profile.fifthDay.lifts and log into the t3 slots.
function buildAccessory(week, profile) {
  const target = fifthDayTarget(week)
  if (!target) return []
  const custom = profile.custom ?? { t2: [], t3: [] }
  return (profile.fifthDay?.lifts ?? []).map((id) =>
    mrsExercise('T3', exerciseName(id, custom), target),
  )
}

export function buildDay(week, dayIndex, profile, log) {
  const day = dayByIndex(dayIndex)
  const meta = metaForWeek(week)
  const label = dayLabel(week, dayIndex, profile)
  if (day.accessory) {
    return {
      week,
      dayIndex,
      dayLabel: label,
      dayType: day.dayType,
      accessory: true,
      ...meta,
      t1: null,
      t2: [],
      t3: buildAccessory(week, profile),
    }
  }
  return {
    week,
    dayIndex,
    dayLabel: label,
    dayType: day.dayType,
    ...meta,
    t1: buildT1(week, day, profile, log),
    t2: buildT2(week, day, profile),
    t3: buildT3(week, day, profile),
  }
}

// A compact one-line summary of a day for the week overview grid.
export function daySummary(week, dayIndex, profile) {
  const d = buildDay(week, dayIndex, profile)
  if (d.accessory) {
    return {
      dayLabel: d.dayLabel,
      accessory: true,
      t1Name: 'Weakpoints',
      topRM: null,
      test: false,
      t2Count: 0,
      t3Count: d.t3.length,
    }
  }
  return {
    dayLabel: d.dayLabel,
    t1Name: d.t1.name,
    topRM: d.t1.sets[0].repsTarget,
    test: d.t1.test,
    t2Count: d.t2.length,
    t3Count: d.t3.length,
  }
}
