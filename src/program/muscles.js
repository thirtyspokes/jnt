// Muscle-group volume model.
//
// Maps every exercise to the muscle groups it trains, then sums *working sets*
// per week (reusing the progression tables so counts match buildDay). A set
// credits primary movers 1.0 and secondary movers 0.5.

import { DAYS, DAY5, mergedCustom } from './exercises.js'
import { T1_WEEKS, T2A_WEEKS, T2_MRS_WEEKS, T3_MRS_WEEKS, MRS_SETS, fifthDayActive } from './progression.js'

// The 12 tracked groups, in the head-to-toe order used by the table.
export const MUSCLE_GROUPS = [
  { key: 'chest', label: 'Chest' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'traps', label: 'Traps' },
  { key: 'lats', label: 'Lats' },
  { key: 'biceps', label: 'Biceps' },
  { key: 'triceps', label: 'Triceps' },
  { key: 'forearms', label: 'Forearms' },
  { key: 'abs', label: 'Abs' },
  { key: 'glutes', label: 'Glutes' },
  { key: 'quads', label: 'Quads' },
  { key: 'hamstrings', label: 'Hamstrings' },
  { key: 'calves', label: 'Calves' },
]

const GROUP_KEYS = new Set(MUSCLE_GROUPS.map((g) => g.key))

// exerciseId -> { primary: [...], secondary: [...] }
// Cross-checked against ExRx.net target/synergist classifications. Forearms are
// credited grip-inclusively: secondary on all pulls + deadlifts + curls, and
// primary on the hammer curl (a brachioradialis lift).
export const EXERCISE_MUSCLES = {
  // ---- T1 ----
  squat: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'abs'] },
  bench: { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  deadlift: { primary: ['hamstrings', 'glutes'], secondary: ['traps', 'lats', 'abs', 'quads', 'forearms'] },
  ohp: { primary: ['shoulders'], secondary: ['triceps', 'traps'] },

  // ---- T2: lower ----
  front_squat: { primary: ['quads'], secondary: ['glutes', 'abs'] },
  high_bar_squat: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  hack_squat: { primary: ['quads'], secondary: ['glutes'] },
  leg_press: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  lunge: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  sldl: { primary: ['hamstrings'], secondary: ['glutes', 'forearms'] },
  deficit_dl: { primary: ['hamstrings', 'glutes'], secondary: ['traps', 'lats', 'quads', 'forearms'] },

  // ---- T2: upper press ----
  cg_bench: { primary: ['chest', 'triceps'], secondary: ['shoulders'] },
  spoto_bench: { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  incline_bench: { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  legsup_bench: { primary: ['chest'], secondary: ['triceps', 'shoulders'] },
  db_bench: { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  dip: { primary: ['chest', 'triceps'], secondary: ['shoulders'] },
  push_press: { primary: ['shoulders'], secondary: ['triceps', 'traps', 'quads'] },

  // ---- T2: back ----
  bb_row: { primary: ['lats'], secondary: ['traps', 'biceps', 'forearms'] },
  pendlay_row: { primary: ['lats'], secondary: ['traps', 'biceps', 'forearms'] },
  db_row: { primary: ['lats'], secondary: ['biceps', 'traps', 'forearms'] },
  pullup: { primary: ['lats'], secondary: ['biceps', 'forearms'] },
  lat_pulldown: { primary: ['lats'], secondary: ['biceps', 'forearms'] },
  cable_row: { primary: ['lats'], secondary: ['traps', 'biceps', 'forearms'] },
  tbar_row: { primary: ['lats'], secondary: ['traps', 'biceps', 'forearms'] },

  // ---- T3 ----
  cable_fly: { primary: ['chest'], secondary: [] },
  db_fly: { primary: ['chest'], secondary: [] },
  pushup: { primary: ['chest'], secondary: ['triceps', 'shoulders'] },
  lateral_raise: { primary: ['shoulders'], secondary: [] },
  rear_delt_fly: { primary: ['shoulders'], secondary: ['traps'] },
  front_raise: { primary: ['shoulders'], secondary: [] },
  face_pull: { primary: ['shoulders'], secondary: ['traps'] },
  tri_pushdown: { primary: ['triceps'], secondary: [] },
  oh_tri_ext: { primary: ['triceps'], secondary: [] },
  skullcrusher: { primary: ['triceps'], secondary: [] },
  ez_curl: { primary: ['biceps'], secondary: ['forearms'] },
  db_hammer_curl: { primary: ['forearms'], secondary: ['biceps'] },
  incline_curl: { primary: ['biceps'], secondary: ['forearms'] },
  vgrip_pulldown: { primary: ['lats'], secondary: ['biceps', 'forearms'] },
  straightarm: { primary: ['lats'], secondary: ['forearms'] },
  bw_pullup: { primary: ['lats'], secondary: ['biceps', 'forearms'] },
  leg_ext: { primary: ['quads'], secondary: [] },
  leg_curl: { primary: ['hamstrings'], secondary: [] },
  ghr: { primary: ['hamstrings'], secondary: ['glutes'] },
  calf_raise: { primary: ['calves'], secondary: [] },
}

// Resolve a (possibly custom) exercise to its muscle mapping. Custom exercises
// carry `primary`/`secondary` tags (older ones used `muscles` = all primary).
export function musclesFor(id, custom = []) {
  if (EXERCISE_MUSCLES[id]) return EXERCISE_MUSCLES[id]
  const c = custom.find((e) => e.id === id)
  if (c) return { primary: c.primary ?? c.muscles ?? [], secondary: c.secondary ?? [] }
  return { primary: [], secondary: [] }
}

// Working-set count for a T1 lift on a given week (top set + back-off sets).
function t1Sets(week) {
  const w = T1_WEEKS[week]
  return 1 + (w.backoff ? w.backoff.sets : 0)
}

const emptyVolume = () => Object.fromEntries(MUSCLE_GROUPS.map((g) => [g.key, 0]))

// Add `sets` worth of an exercise's muscle credit into a volume map.
function addVolume(vol, id, sets, custom) {
  if (!sets) return
  const m = musclesFor(id, custom)
  m.primary.forEach((k) => { if (GROUP_KEYS.has(k)) vol[k] += sets })
  m.secondary.forEach((k) => { if (GROUP_KEYS.has(k)) vol[k] += sets * 0.5 })
}

// Planned sets per week for each muscle group, given the lifter's selections.
export function weeklyVolume(week, profile) {
  const vol = emptyVolume()
  const customT2 = profile.custom?.t2 ?? []
  const customT3 = profile.custom?.t3 ?? []
  const t2a = T2A_WEEKS[week]
  const mrsT2 = T2_MRS_WEEKS[week]
  const mrsT3 = T3_MRS_WEEKS[week]

  DAYS.forEach((day) => {
    addVolume(vol, day.t1, t1Sets(week), [])

    const t2ids = profile.selections?.[day.index]?.t2 ?? []
    t2ids.forEach((id, i) => {
      const sets = i === 0 && t2a ? t2a.sets : mrsT2 ? 1 + MRS_SETS : 0
      addVolume(vol, id, sets, customT2)
    })

    if (mrsT3) {
      const t3ids = profile.selections?.[day.index]?.t3 ?? []
      t3ids.forEach((id) => addVolume(vol, id, 1 + MRS_SETS, customT3))
    }
  })

  // Accessory 5th day (all max-rep-set work).
  if (profile.fifthDay?.enabled && fifthDayActive(week)) {
    const custom = mergedCustom(profile.custom)
    ;(profile.fifthDay.lifts ?? []).forEach((id) => addVolume(vol, id, 1 + MRS_SETS, custom))
  }

  return vol
}

// Actual sets logged for one day -> muscle volume. Counts only sets that have
// both a weight and reps entered.
export function loggedDayVolume(dayIndex, profile, session) {
  const vol = emptyVolume()
  if (!session) return vol
  // Count a set toward muscle volume when reps are logged and a weight is entered
  // (0 is valid — bodyweight moves still count as a set).
  const doneSets = (node) =>
    (node?.sets ?? []).filter(
      (s) => Number(s.reps) > 0 && s.weight !== '' && s.weight != null && Number(s.weight) >= 0,
    ).length

  // Accessory 5th day: lifts come from fifthDay.lifts, logged into t3 slots.
  if (dayIndex === DAY5.index) {
    const custom = mergedCustom(profile.custom)
    ;(profile.fifthDay?.lifts ?? []).forEach((id, i) =>
      addVolume(vol, id, doneSets(session.t3?.[i]), custom),
    )
    return vol
  }

  const day = DAYS[dayIndex]
  const customT2 = profile.custom?.t2 ?? []
  const customT3 = profile.custom?.t3 ?? []

  addVolume(vol, day.t1, doneSets(session.t1), [])
  ;(profile.selections?.[dayIndex]?.t2 ?? []).forEach((id, i) =>
    addVolume(vol, id, doneSets(session.t2?.[i]), customT2),
  )
  ;(profile.selections?.[dayIndex]?.t3 ?? []).forEach((id, i) =>
    addVolume(vol, id, doneSets(session.t3?.[i]), customT3),
  )
  return vol
}
