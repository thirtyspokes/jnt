import Model from 'react-body-highlighter'
import { MUSCLE_GROUPS } from '../program/muscles.js'

// Map each tracked group to react-body-highlighter muscle slug(s).
const SLUGS = {
  chest: ['chest'],
  shoulders: ['front-deltoids', 'back-deltoids'],
  triceps: ['triceps'],
  biceps: ['biceps'],
  forearms: ['forearm'],
  traps: ['trapezius'],
  lats: ['upper-back'],
  glutes: ['gluteal'],
  quads: ['quadriceps'],
  hamstrings: ['hamstring'],
  abs: ['abs'],
  calves: ['calves'],
}

// Amber -> bright-orange ramp; index = frequency - 1 (see the component).
const LEVELS = 5
const HIGHLIGHTS = [
  'hsl(28 58% 32%)',
  'hsl(29 72% 41%)',
  'hsl(31 82% 49%)',
  'hsl(33 88% 56%)',
  'hsl(36 92% 63%)',
]
const BODY_COLOR = '#3a404b' // unworked silhouette on the dark stage

const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

// intensity t in [0,1] -> discrete level 1..LEVELS (0 = not worked)
const levelFor = (t) => (t <= 0 ? 0 : Math.min(LEVELS, 1 + Math.round(t * (LEVELS - 1))))

// continuous orange for the table bars
const barColor = (t) =>
  t <= 0 ? 'var(--border)' : `hsl(31 ${Math.round(55 + t * 35)}% ${Math.round(44 + t * 13)}%)`

export default function MuscleMap({ volume, title }) {
  const vol = volume || {}
  const values = MUSCLE_GROUPS.map((g) => vol[g.key] || 0)
  const max = Math.max(0, ...values)

  const data = MUSCLE_GROUPS.flatMap((g) => {
    const level = levelFor(max > 0 ? (vol[g.key] || 0) / max : 0)
    return level ? [{ name: g.label, muscles: SLUGS[g.key], frequency: level }] : []
  })

  const modelProps = {
    data,
    bodyColor: BODY_COLOR,
    highlightedColors: HIGHLIGHTS,
    svgStyle: { width: '100%', height: 'auto' },
  }

  return (
    <div className="muscle-map">
      {title && <h3 className="mm-title">{title}</h3>}
      <div className="mm-body">
        <div className="muscle-stage">
          <div className="figures">
            <figure>
              <Model type="anterior" {...modelProps} />
              <figcaption>Front</figcaption>
            </figure>
            <figure>
              <Model type="posterior" {...modelProps} />
              <figcaption>Back</figcaption>
            </figure>
          </div>
          <div className="mm-legend">
            <span>0</span>
            <span className="legend-bar" />
            <span>{fmt(max)} sets</span>
          </div>
        </div>

        <table className="muscle-table">
          <thead>
            <tr>
              <th>Muscle</th>
              <th>Sets/wk</th>
            </tr>
          </thead>
          <tbody>
            {MUSCLE_GROUPS.map((g) => {
              const sets = vol[g.key] || 0
              const t = max > 0 ? sets / max : 0
              return (
                <tr key={g.key} className={sets === 0 ? 'gap' : ''}>
                  <td>{g.label}</td>
                  <td>
                    <div className="mt-cell">
                      <span className="mt-track">
                        <span className="mt-fill" style={{ width: `${t * 100}%`, background: barColor(t) }} />
                      </span>
                      <span className="mt-val">{fmt(sets)}</span>
                      {sets === 0 && <span className="mt-gap">gap</span>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
