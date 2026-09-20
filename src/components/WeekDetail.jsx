import { metaForWeek } from '../program/progression.js'
import { DAYS } from '../program/exercises.js'
import { weeklyVolume } from '../program/muscles.js'
import DayCard from './DayCard.jsx'
import MuscleMap from './MuscleMap.jsx'

export default function WeekDetail({ week, profile, logs, onOpenDay, onBack, onGoWeek }) {
  const meta = metaForWeek(week)
  return (
    <div className="week-detail">
      <div className="wd-topbar">
        <button className="back-btn" onClick={onBack}>← All weeks</button>
        <div className="wd-nav">
          <button onClick={() => onGoWeek(week - 1)} disabled={week <= 1} aria-label="Previous week">
            ‹
          </button>
          <span>Week {week}</span>
          <button onClick={() => onGoWeek(week + 1)} disabled={week >= 12} aria-label="Next week">
            ›
          </button>
        </div>
      </div>

      <div className="wd-head">
        <h2>Week {week}</h2>
        <span className="week-meso">{meta.mesoName}</span>
      </div>

      <div className="day-cards wd-days">
        {DAYS.map((d) => (
          <DayCard
            key={d.index}
            week={week}
            dayIndex={d.index}
            profile={profile}
            logs={logs}
            onClick={() => onOpenDay(week, d.index)}
          />
        ))}
      </div>

      <section className="card">
        <h2>Muscle coverage — Week {week}</h2>
        <p className="hint">
          Weekly working sets each muscle group gets this week (primary lifts
          count 1, secondary ½). Darker = more volume; “gap” flags a group with
          none.
        </p>
        <MuscleMap volume={weeklyVolume(week, profile)} />
      </section>
    </div>
  )
}
