import { daySummary } from '../program/generate.js'
import { sessionNumber } from '../program/sessions.js'
import { isComplete } from '../state/useLogs.js'

// A compact day summary card. Interactive (a button) when `onClick` is given,
// otherwise a static preview (used inside the clickable week card).
export default function DayCard({ week, dayIndex, profile, logs, onClick }) {
  const s = daySummary(week, dayIndex, profile)
  const complete = isComplete(logs, week, dayIndex)
  const num = sessionNumber(week, dayIndex, profile)
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      className={`day-card ${s.test ? 'test' : ''} ${complete ? 'done' : ''} ${onClick ? '' : 'static'}`}
      onClick={onClick}
    >
      {num != null && <span className="dc-num">#{num}</span>}
      {complete && <span className="dc-check" title="Completed">✓</span>}
      <span className="dc-day">{s.dayLabel}</span>
      <span className="dc-lift">{s.t1Name}</span>
      <span className="dc-top">
        {s.accessory ? `${s.t3Count} accessory lifts` : s.test ? '1RM test' : `Work to ${s.topRM}RM`}
      </span>
      {!s.accessory && <span className="dc-meta">{s.t2Count} T2 · {s.t3Count} T3</span>}
    </Tag>
  )
}
