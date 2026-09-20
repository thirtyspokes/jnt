import { metaForWeek } from '../program/progression.js'
import { buildDay, daysInWeek } from '../program/generate.js'
import { nextSession, sessionNumber, totalSessions } from '../program/sessions.js'
import DayCard from './DayCard.jsx'
import EndOfCycle from './EndOfCycle.jsx'

const WEEKS = Array.from({ length: 12 }, (_, i) => i + 1)

const MESO_CLASS = { A: 'meso-a', B: 'meso-b', C: 'meso-c', D: 'meso-d' }
const badgeClass = (tier) => (tier === 'T1' ? 't1' : tier === 'T2a' ? 't2a' : tier === 'T2' ? 't2' : 't3')

function UpNextCard({ week, dayIndex, profile, onOpenDay }) {
  const d = buildDay(week, dayIndex, profile)
  const num = sessionNumber(week, dayIndex, profile)
  const rows = [
    d.t1 && { tier: d.t1.tier, name: d.t1.name, detail: d.t1.test ? '1RM test' : `Work to ${d.t1.sets[0].repsTarget}RM` },
    ...d.t2.map((x) => ({ tier: x.tier, name: x.name })),
    ...d.t3.map((x) => ({ tier: x.tier, name: x.name })),
  ].filter(Boolean)
  return (
    <button className="up-next-card" onClick={() => onOpenDay(week, dayIndex)}>
      <div className="unc-top">
        <span className="un-label">
          Up next · Session {num} of {totalSessions(profile)}
        </span>
        <span className="unc-go">Start →</span>
      </div>
      <div className="unc-head">
        <h2>{d.dayLabel}</h2>
        <span className="week-meso">Week {week} · {d.mesoName}</span>
      </div>
      <div className="unc-lifts">
        {rows.map((r, i) => (
          <div className={`unc-lift ${r.tier === 'T1' ? 'is-t1' : ''}`} key={i}>
            <span className={`tier-badge ${badgeClass(r.tier)}`}>{r.tier}</span>
            <span className="unc-name">{r.name}</span>
            {r.detail && <span className="unc-detail">{r.detail}</span>}
          </div>
        ))}
      </div>
    </button>
  )
}

export default function WeekOverview({ profile, logs, cycleNumber, onOpenWeek, onOpenDay, onSetBodyweight, onStartNextCycle }) {
  const next = nextSession(logs, profile)

  return (
    <div className="overview">
      {cycleNumber != null && <div className="cycle-badge">Cycle {cycleNumber}</div>}
      {next ? (
        <UpNextCard week={next.week} dayIndex={next.dayIndex} profile={profile} onOpenDay={onOpenDay} />
      ) : (
        <EndOfCycle
          profile={profile}
          logs={logs}
          cycleNumber={cycleNumber ?? 1}
          onSetBodyweight={onSetBodyweight}
          onStartNextCycle={onStartNextCycle}
        />
      )}

      <p className="hint overview-hint">
        Tap a week to open it — its four days plus a muscle-coverage map. Weeks 6
        and 12 are 1RM test days.
      </p>
      {WEEKS.map((week) => {
        const meta = metaForWeek(week)
        return (
          <button
            className={`week week-open ${MESO_CLASS[meta.meso]}`}
            key={week}
            onClick={() => onOpenWeek(week)}
          >
            <div className="week-head">
              <span className="week-no">Week {week}</span>
              <span className="week-meso">{meta.mesoName}</span>
              <span className="week-chevron" aria-hidden="true">→</span>
            </div>
            <div className="day-cards">
              {daysInWeek(week, profile).map((d) => (
                <DayCard key={d.index} week={week} dayIndex={d.index} profile={profile} logs={logs} />
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}
