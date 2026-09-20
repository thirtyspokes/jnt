// Exercise catalog, drawn from the Jacked & Tan 2.0 tier recommendations.
//
// Tiers:
//   T1  - main barbell lift. FIXED to the four competition-style lifts.
//   T2  - secondary compound (heavy, incl. machines/cables) + back work.
//   T3  - accessory / bodybuilding isolation and rehab work.
//
// `group` is used to offer sensible options per day:
//   lower        - squat/deadlift-pattern lower body
//   upperPress   - horizontal/vertical pressing
//   back         - rows / pulldowns / pull-ups (a "T2" per the article)
//   arms/delts/  - isolation groups for T3
//   pecs/quads/hams/misc

// ---- T1: fixed main lifts, one per training day ----
export const T1 = {
  squat:    { id: 'squat',    name: 'Back Squat',      pattern: 'lower' },
  bench:    { id: 'bench',    name: 'Bench Press',     pattern: 'upperPress' },
  deadlift: { id: 'deadlift', name: 'Deadlift',        pattern: 'lower' },
  ohp:      { id: 'ohp',      name: 'Overhead Press',  pattern: 'upperPress' },
}

// The 4-day upper/lower template. Day 3 lower differs from Day 1; Day 4 press
// differs from Day 2 (per the article's "must be different" rule).
export const DAYS = [
  { index: 0, label: 'Day 1 — Lower', t1: 'squat',    dayType: 'lower' },
  { index: 1, label: 'Day 2 — Upper', t1: 'bench',    dayType: 'upper' },
  { index: 2, label: 'Day 3 — Lower', t1: 'deadlift', dayType: 'lower' },
  { index: 3, label: 'Day 4 — Upper', t1: 'ohp',      dayType: 'upper' },
]

// ---- T2 options ----
export const T2_OPTIONS = [
  // lower
  { id: 'front_squat',   name: 'Front Squat',            group: 'lower', dayType: 'lower' },
  { id: 'high_bar_squat',name: 'High-Bar Squat',         group: 'lower', dayType: 'lower' },
  { id: 'hack_squat',    name: 'Hack Squat (machine)',   group: 'lower', dayType: 'lower' },
  { id: 'leg_press',     name: 'Leg Press',              group: 'lower', dayType: 'lower' },
  { id: 'lunge',         name: 'Walking Lunge',          group: 'lower', dayType: 'lower' },
  { id: 'sldl',          name: 'Stiff-Legged Deadlift',  group: 'lower', dayType: 'lower' },
  { id: 'deficit_dl',    name: 'Deficit Deadlift',       group: 'lower', dayType: 'lower' },
  // upper pressing
  { id: 'cg_bench',      name: 'Close-Grip Bench',       group: 'upperPress', dayType: 'upper' },
  { id: 'spoto_bench',   name: 'Spoto Bench',            group: 'upperPress', dayType: 'upper' },
  { id: 'incline_bench', name: 'Incline Bench',          group: 'upperPress', dayType: 'upper' },
  { id: 'legsup_bench',  name: 'Legs-Up Bench',          group: 'upperPress', dayType: 'upper' },
  { id: 'db_bench',      name: 'Dumbbell Bench',         group: 'upperPress', dayType: 'upper' },
  { id: 'dip',           name: 'Weighted Dip',           group: 'upperPress', dayType: 'upper' },
  { id: 'push_press',    name: 'Push Press',             group: 'upperPress', dayType: 'upper' },
  // back — usable on either day type
  { id: 'bb_row',        name: 'Barbell Row',            group: 'back', dayType: 'any' },
  { id: 'pendlay_row',   name: 'Pendlay Row',            group: 'back', dayType: 'any' },
  { id: 'db_row',        name: 'Dumbbell Row',           group: 'back', dayType: 'any' },
  { id: 'pullup',        name: 'Weighted Pull-Up',       group: 'back', dayType: 'any' },
  { id: 'lat_pulldown',  name: 'Lat Pulldown',           group: 'back', dayType: 'any' },
  { id: 'cable_row',     name: 'Seated Cable Row',       group: 'back', dayType: 'any' },
  { id: 'tbar_row',      name: 'T-Bar Row',              group: 'back', dayType: 'any' },
]

// ---- T3 options ----
export const T3_OPTIONS = [
  // pecs
  { id: 'cable_fly',     name: 'Cable Fly',              group: 'pecs', dayType: 'upper' },
  { id: 'db_fly',        name: 'Dumbbell Fly',           group: 'pecs', dayType: 'upper' },
  { id: 'pushup',        name: 'Push-Up',                group: 'pecs', dayType: 'upper' },
  // delts
  { id: 'lateral_raise', name: 'Lateral Raise',          group: 'delts', dayType: 'any' },
  { id: 'rear_delt_fly', name: 'Rear-Delt Fly',          group: 'delts', dayType: 'any' },
  { id: 'front_raise',   name: 'Front Raise',            group: 'delts', dayType: 'any' },
  { id: 'face_pull',     name: 'Face Pull',              group: 'delts', dayType: 'any' },
  // triceps
  { id: 'tri_pushdown',  name: 'Cable Triceps Pushdown', group: 'triceps', dayType: 'upper' },
  { id: 'oh_tri_ext',    name: 'Overhead Triceps Ext.',  group: 'triceps', dayType: 'upper' },
  { id: 'skullcrusher',  name: 'Skullcrusher',           group: 'triceps', dayType: 'upper' },
  // biceps
  { id: 'ez_curl',       name: 'EZ-Bar Curl',            group: 'biceps', dayType: 'any' },
  { id: 'db_hammer_curl',name: 'DB Hammer Curl',         group: 'biceps', dayType: 'any' },
  { id: 'incline_curl',  name: 'Incline DB Curl',        group: 'biceps', dayType: 'any' },
  // back isolation
  { id: 'vgrip_pulldown',name: 'V-Grip Pulldown',        group: 'backiso', dayType: 'any' },
  { id: 'straightarm',   name: 'Straight-Arm Pulldown',  group: 'backiso', dayType: 'any' },
  { id: 'bw_pullup',     name: 'Bodyweight Pull-Up',     group: 'backiso', dayType: 'any' },
  // quads / hams / calves
  { id: 'leg_ext',       name: 'Leg Extension',          group: 'quads', dayType: 'lower' },
  { id: 'leg_curl',      name: 'Leg Curl',               group: 'hams', dayType: 'lower' },
  { id: 'ghr',           name: 'Glute-Ham Raise',        group: 'hams', dayType: 'lower' },
  { id: 'calf_raise',    name: 'Calf Raise',             group: 'calves', dayType: 'lower' },
]

const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]))
export const T2_BY_ID = byId(T2_OPTIONS)
export const T3_BY_ID = byId(T3_OPTIONS)

// Name resolvers. `custom` is the lifter's own T2/T3 list (from their profile),
// each entry shaped like the built-ins: { id, name, dayType, custom: true }.
export function t2Name(id, custom = []) {
  return T2_BY_ID[id]?.name ?? custom.find((e) => e.id === id)?.name ?? id
}
export function t3Name(id, custom = []) {
  return T3_BY_ID[id]?.name ?? custom.find((e) => e.id === id)?.name ?? id
}

// Options appropriate for a given day type (upper/lower), built-ins plus the
// lifter's custom exercises. 'any' is always allowed.
export function t2For(dayType, custom = []) {
  return [...T2_OPTIONS, ...custom].filter((e) => e.dayType === dayType || e.dayType === 'any')
}
export function t3For(dayType, custom = []) {
  return [...T3_OPTIONS, ...custom].filter((e) => e.dayType === dayType || e.dayType === 'any')
}

// Create a stable id for a user-defined exercise.
export function makeCustomId(tier) {
  return `${tier}_c_${Math.random().toString(36).slice(2, 8)}`
}

// Sensible per-day default selections (used on first run).
export const DEFAULT_SELECTIONS = {
  0: { t2: ['front_squat', 'bb_row'],   t3: ['leg_ext', 'leg_curl', 'lateral_raise'] },
  1: { t2: ['incline_bench', 'lat_pulldown'], t3: ['tri_pushdown', 'ez_curl', 'cable_fly'] },
  2: { t2: ['leg_press', 'pullup'],     t3: ['leg_curl', 'leg_ext', 'rear_delt_fly'] },
  3: { t2: ['cg_bench', 'bb_row'],      t3: ['lateral_raise', 'db_hammer_curl', 'tri_pushdown'] },
}
