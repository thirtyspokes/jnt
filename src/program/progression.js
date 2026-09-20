// Jacked & Tan 2.0 week-by-week progression.
//
// 12 weeks = two 6-week blocks; each block = two 3-week mesocycles.
// Intensity climbs and rep targets fall within each meso, then reset higher.
//
// WHAT HAS A KNOWN WEIGHT, AND WHAT DOESN'T:
//   * T1 top set  -> autoregulated "work up to an <n>RM" (found on the day).
//   * T1 back-off -> Block 1: a % of TRAINING MAX (known weight).
//                    Block 2: a % of THAT DAY'S RM (known only after the top set).
//   * T2a         -> a % progression (of the T2 lift's own working max, if entered).
//   * T2 (MRS) / T3 -> "work up to an <n>RM, then 3 max-rep sets" (found on the day).
//
// SOURCE: T1, T2a, and the MRS rep-max targets below are all taken from Cody
// LeFever's J&T 2.0 blog, verified against its explicit weekly prescriptions.
// For T2 block 2 (wk7–10) the blog's weekly-detail values are used (its summary
// table gives a slightly different set).

export const BLOCKS = {
  1: { weeks: [1, 2, 3, 4, 5, 6] },
  2: { weeks: [7, 8, 9, 10, 11, 12] },
}

export const MESOS = {
  A: { block: 1, weeks: [1, 2, 3] },
  B: { block: 1, weeks: [4, 5, 6] },
  C: { block: 2, weeks: [7, 8, 9] },
  D: { block: 2, weeks: [10, 11, 12] },
}

export function metaForWeek(week) {
  if (week <= 3) return { block: 1, meso: 'A', mesoName: 'Block 1 · Meso A (volume)' }
  if (week <= 6) return { block: 1, meso: 'B', mesoName: 'Block 1 · Meso B (intensity)' }
  if (week <= 9) return { block: 2, meso: 'C', mesoName: 'Block 2 · Meso C (volume)' }
  return { block: 2, meso: 'D', mesoName: 'Block 2 · Meso D (peak)' }
}

// ---- T1: top-set RM target + back-off scheme, per week ----
// backoff.base: 'TM'  -> pct of training max (concrete weight shown)
//               'RM'  -> pct of the day's top-set RM (shown as guidance)
//               null  -> no back-off (test week)
export const T1_WEEKS = {
  1:  { topRM: 10, backoff: { base: 'TM', pct: 0.70,  reps: 6, sets: 3, setsPlus: true } },
  2:  { topRM: 8,  backoff: { base: 'TM', pct: 0.75,  reps: 5, sets: 3, setsPlus: true } },
  3:  { topRM: 6,  backoff: { base: 'TM', pct: 0.80,  reps: 4, sets: 3, setsPlus: true } },
  4:  { topRM: 4,  backoff: { base: 'TM', pct: 0.825, reps: 3, sets: 3, setsPlus: true } },
  5:  { topRM: 2,  backoff: { base: 'TM', pct: 0.85,  reps: 2, sets: 4, setsPlus: true } },
  6:  { topRM: 1,  backoff: null, test: true },
  7:  { topRM: 6,  backoff: { base: 'RM', pct: 0.85,  reps: 3, sets: 5, setsPlus: true } },
  8:  { topRM: 4,  backoff: { base: 'RM', pct: 0.85,  reps: 2, sets: 5, setsPlus: true } },
  9:  { topRM: 2,  backoff: { base: 'RM', pct: 0.85,  reps: 1, sets: 5, setsPlus: true } },
  10: { topRM: 5,  backoff: { base: 'RM', pct: 0.90,  reps: 2, sets: 3, setsPlus: true } },
  11: { topRM: 3,  backoff: { base: 'RM', pct: 0.90,  reps: 1, sets: 3, setsPlus: true } },
  12: { topRM: 1,  backoff: null, test: true },
}

// ---- T2a: percentage progression (of the T2 lift's working max) ----
// null = no T2a that week.
export const T2A_WEEKS = {
  1:  { pct: 0.50, reps: 10, sets: 4 },
  2:  { pct: 0.60, reps: 8,  sets: 4 },
  3:  { pct: 0.70, reps: 6,  sets: 4 },
  4:  { pct: 0.75, reps: 4,  sets: 5 },
  5:  { pct: 0.80, reps: 2,  sets: 7 },
  6:  null,
  7:  { pct: 0.70, reps: 6,  sets: 5 },
  8:  { pct: 0.75, reps: 5,  sets: 5 },
  9:  { pct: 0.80, reps: 4,  sets: 5 },
  10: { pct: 0.825, reps: 3, sets: 6 },
  11: { pct: 0.85, reps: 2,  sets: 7 },
  12: null,
}

// ---- MRS (max-rep-set) top-set RM targets, per week ----
// Applies to secondary T2 slots and to all T3 work. After hitting the target
// RM, perform 3 additional max-rep sets (30-60s rest, 1-2 reps in reserve).
// null = drop this tier that week (recovery / peak weeks).
export const T2_MRS_WEEKS = {
  1: 15, 2: 12, 3: 10,
  4: 8,  5: 6,  6: null,   // Wk6: T2 removed
  7: 15, 8: 12, 9: 10,
  10: 6, 11: null, 12: null, // Wk11: T2b/c removed; Wk12: peak/rest
}

export const T3_MRS_WEEKS = {
  1: 20, 2: 18, 3: 16,
  4: 14, 5: 12, 6: 10,
  7: null, 8: 18, 9: 16,     // Wk7: T3 removed
  10: 14, 11: 12, 12: null,  // Wk12: rest after the 1RM
}

export const MRS_SETS = 3 // additional max-rep sets after the top RM

// Rest between sets, in seconds, by tier. Adjust here.
export const REST_SECONDS = {
  T1: 180,  // 3:00 — main lift
  T2a: 120, // 2:00 — secondary percentage work
  T2: 60,   // 1:00 — secondary max-rep-set work (program: 30–60s)
  T3: 60,   // 1:00 — accessory max-rep-set work (program: 30–60s)
}
