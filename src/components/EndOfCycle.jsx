import { T1 } from '../program/exercises.js'
import { testedMax, bestEstimate } from '../program/cycles.js'

const LIFTS = ['squat', 'bench', 'deadlift', 'ohp']

export default function EndOfCycle({ profile, logs, cycleNumber, onStartNextCycle }) {
  const baseline = profile.cycleStartMaxes ?? {}
  const rows = LIFTS.map((key) => {
    const now = testedMax(key, logs) ?? bestEstimate(key, logs)
    const startRaw = Number(baseline[key])
    const start = startRaw > 0 ? startRaw : null
    const delta = now != null && start != null ? now - start : null
    return { key, name: T1[key].name, start, now, delta }
  })
  const totalGain = rows.reduce((s, r) => s + (r.delta > 0 ? r.delta : 0), 0)
  const first = cycleNumber === 1

  return (
    <div className="eoc">
      <div className="eoc-hero">
        <span className="eoc-emoji" aria-hidden="true">🏁</span>
        <div>
          <h2>Cycle {cycleNumber} complete</h2>
          <p className="modal-sub">
            {first ? 'Progress from your starting maxes' : `Progress since cycle ${cycleNumber - 1}`}
          </p>
        </div>
      </div>

      <div className="eoc-lifts">
        {rows.map((r) => (
          <div className="eoc-lift" key={r.key}>
            <span className="eoc-name">{r.name}</span>
            <span className="eoc-nums">
              {r.start ?? '—'} → <strong>{r.now ?? '—'}</strong> lb
            </span>
            <span className={`eoc-delta ${r.delta > 0 ? 'up' : r.delta < 0 ? 'down' : ''}`}>
              {r.delta != null ? (r.delta > 0 ? `+${r.delta}` : `${r.delta}`) : '—'}
            </span>
          </div>
        ))}
      </div>

      {totalGain > 0 && <p className="eoc-total">+{totalGain} lb across your lifts 💪</p>}

      <div className="eoc-tip">
        📸 Snap a progress photo before you start the next cycle — for your own records.
      </div>

      <button className="primary eoc-start" onClick={onStartNextCycle}>
        Start cycle {cycleNumber + 1} →
      </button>
    </div>
  )
}
