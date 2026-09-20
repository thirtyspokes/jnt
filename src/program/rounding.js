// Weight rounding.
//
// Requirement: the smallest plate is 2.5 lb, loaded symmetrically. A 2.5 plate
// on EACH side changes the bar by 5 lb, so every settable weight is a multiple
// of 5. Prescribed weights are rounded UP so the lifter is never under the
// intended load.

export const INCREMENT = 5 // lb; smallest whole-bar change with a 2.5/side plate

export function roundUp(weight, inc = INCREMENT) {
  return Math.ceil(weight / inc) * inc
}

export function roundNearest(weight, inc = INCREMENT) {
  return Math.round(weight / inc) * inc
}
