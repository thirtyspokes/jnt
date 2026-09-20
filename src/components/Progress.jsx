import { DAYS, T1 } from '../program/exercises.js'
import { trainingMax } from '../program/generate.js'
import { estimated1RM } from '../program/estimate.js'
import { numTop } from '../state/useLogs.js'

const TEST_WEEKS = new Set([6, 12])

// Lifts in training-day order, each mapped to the day it's trained on.
const LIFTS = ['squat', 'bench', 'deadlift', 'ohp'].map((key) => ({
  key,
  name: T1[key].name,
  dayIndex: DAYS.find((d) => d.t1 === key).index,
}))

function series(logs, dayIndex) {
  const points = []
  for (let week = 1; week <= 12; week++) {
    const node = logs[`${week}-${dayIndex}`]?.t1
    const top = numTop(node)
    if (!top) continue
    const est = estimated1RM(top.weight, top.reps)
    points.push({ week, weight: top.weight, reps: top.reps, est: est?.rounded ?? null, test: TEST_WEEKS.has(week) })
  }
  return points
}

function Sparkline({ points }) {
  const vals = points.map((p) => p.est).filter((v) => v != null)
  if (vals.length < 2) return <div className="spark empty">Need 2+ logged sessions</div>
  const W = 240
  const H = 48
  const pad = 4
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const xs = (i) => pad + (i * (W - 2 * pad)) / (points.length - 1)
  const ys = (v) => H - pad - ((v - min) / span) * (H - 2 * pad)
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xs(i).toFixed(1)} ${ys(p.est).toFixed(1)}`)
    .join(' ')
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={xs(i)} cy={ys(p.est)} r="2.5" fill="currentColor" />
      ))}
    </svg>
  )
}

export default function Progress({ profile, logs }) {
  return (
    <div className="progress">
      <p className="hint">
        Estimated 1RM (Epley) from each session's top set. Weeks 6 and 12 are
        tested maxes.
      </p>
      {LIFTS.map((lift) => {
        const pts = series(logs, lift.dayIndex)
        const oneRM = profile.oneRM?.[lift.key] ?? null
        const tm = trainingMax(oneRM, profile.tmPct)
        const tested = [...pts].reverse().find((p) => p.test)
        const bestEst = pts.reduce((m, p) => (p.est != null && p.est > m ? p.est : m), 0)
        return (
          <section className="card prog-card" key={lift.key}>
            <div className="prog-head">
              <h2>{lift.name}</h2>
              <div className="prog-stats">
                <span>TM <strong>{tm ?? '—'}</strong></span>
                <span>Best est <strong>{bestEst || '—'}</strong></span>
                <span>Tested <strong>{tested?.est ?? '—'}</strong></span>
              </div>
            </div>

            <div className="prog-body">
              <div className="spark-wrap">
                <Sparkline points={pts} />
              </div>
              {pts.length === 0 ? (
                <p className="hint">No logged sessions yet.</p>
              ) : (
                <table className="prog-table">
                  <thead>
                    <tr>
                      <th>Wk</th>
                      <th>Top set</th>
                      <th>Est 1RM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pts.map((p) => (
                      <tr key={p.week} className={p.test ? 'test' : ''}>
                        <td>{p.week}{p.test ? ' ·test' : ''}</td>
                        <td>{p.weight} × {p.reps}</td>
                        <td>{p.est ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
