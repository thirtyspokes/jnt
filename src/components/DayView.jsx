import { Fragment, useEffect, useState } from 'react'
import { buildDay, daysInWeek } from '../program/generate.js'
import { estimated1RM } from '../program/estimate.js'
import { REST_SECONDS } from '../program/progression.js'
import { loggedDayVolume } from '../program/muscles.js'
import { suggestT1, t2aOverloadTip, previousT3Weight } from '../program/coaching.js'
import { t1Signal, t2aSignal } from '../program/autoreg.js'
import { sessionNumber, totalSessions } from '../program/sessions.js'
import MuscleMap from './MuscleMap.jsx'

const tierClass = (tier) =>
  tier === 'T1' ? 't1' : tier === 'T2a' ? 't2a' : tier === 'T2' ? 't2' : 't3'

const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const filled = (v) => Number(v) > 0
const setVolume = (node) =>
  (node?.sets ?? []).reduce((sum, s) => (filled(s.weight) && filled(s.reps) ? sum + Number(s.weight) * Number(s.reps) : sum), 0)
const doneSets = (node) => (node?.sets ?? []).filter((s) => filled(s.weight) && filled(s.reps))

// One exercise's per-set logging table.
function ExerciseLog({ week, day, refObj, exercise, node, api, onSetComplete, suggestedTop, prev }) {
  const [errorRows, setErrorRows] = useState({})
  const planned = exercise.sets
  const actualLen = node?.sets?.length ?? 0
  const rowCount = Math.max(planned.length, actualLen)

  const clearError = (idx) =>
    setErrorRows((e) => {
      if (!e[idx]) return e
      const n = { ...e }
      delete n[idx]
      return n
    })

  const setVal = (idx, patch) => {
    api.setActualSet(week, day, refObj, idx, patch, exercise.name)
    clearError(idx)
  }

  const toggleDone = (idx, a) => {
    if (a.done) {
      api.setActualSet(week, day, refObj, idx, { done: false }, exercise.name)
      return
    }
    if (!filled(a.weight) || !filled(a.reps)) {
      setErrorRows((e) => ({ ...e, [idx]: true }))
      return
    }
    api.setActualSet(week, day, refObj, idx, { done: true }, exercise.name)
    clearError(idx)
    onSetComplete(exercise.tier)
  }

  return (
    <div className="ex-block">
      <div className="ex-head">
        <span className={`tier-badge ${tierClass(exercise.tier)}`}>{exercise.tier}</span>
        <h3>{exercise.name}</h3>
        <span className="ex-rest">rest {fmtClock(REST_SECONDS[exercise.tier] ?? 60)}</span>
      </div>
      {exercise.note && <p className="ex-note">{exercise.note}</p>}
      {prev !== undefined && (
        <p className="ex-prev">
          Last used: {prev ? `${prev.weight} lb (Wk ${prev.week})` : 'none'}
        </p>
      )}

      <div className="set-table">
        <div className="set-row head">
          <span>Set</span>
          <span>Prescribed</span>
          <span>Weight</span>
          <span>Reps</span>
          <span />
          <span />
        </div>
        {Array.from({ length: rowCount }, (_, r) => {
          const p = planned[r] || planned[planned.length - 1]
          const isExtra = r >= planned.length
          const a = node?.sets?.[r] || { weight: '', reps: '', done: false }
          const err = errorRows[r]
          const presWeight = p.weight != null ? `${p.weight} lb` : '—'
          return (
            <Fragment key={r}>
              <div className={`set-row ${a.done ? 'done' : ''}`}>
                <span className="set-idx">{isExtra ? '+' : r + 1}</span>
                <span className="set-pres">
                  <span className="pres-w">{presWeight}</span>
                  <span className="pres-r">× {p.repsLabel}</span>
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="2.5"
                  className={err && !filled(a.weight) ? 'err' : ''}
                  placeholder={p.weight != null ? String(p.weight) : r === 0 && suggestedTop ? String(suggestedTop) : ''}
                  value={a.weight}
                  onChange={(e) => setVal(r, { weight: e.target.value })}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className={err && !filled(a.reps) ? 'err' : ''}
                  placeholder={p.repsTarget != null ? String(p.repsTarget) : ''}
                  value={a.reps}
                  onChange={(e) => setVal(r, { reps: e.target.value })}
                />
                <button
                  className={`set-check ${a.done ? 'on' : ''}`}
                  title={a.done ? 'Completed — tap to undo' : 'Mark set done & start rest'}
                  onClick={() => toggleDone(r, a)}
                >
                  {a.done ? '✓' : ''}
                </button>
                <span className="set-x">
                  {isExtra && (
                    <button className="icon-btn" title="Remove set" onClick={() => api.removeSet(week, day, refObj, r)}>
                      ×
                    </button>
                  )}
                </span>
              </div>
              {err && <div className="set-error">Enter weight and reps before completing this set.</div>}
            </Fragment>
          )
        })}
      </div>

      {exercise.plus && (
        <button className="add-set" onClick={() => api.addSet(week, day, refObj, exercise.name)}>
          + Add set
        </button>
      )}
    </div>
  )
}

// Fixed bottom rest countdown with a depleting progress bar.
function RestTimer({ timer, onAdd, onSkip }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [timer.endsAt])

  const remainingMs = Math.max(0, timer.endsAt - now)
  const remaining = Math.ceil(remainingMs / 1000)
  const progress = timer.total > 0 ? Math.min(1, remainingMs / (timer.total * 1000)) : 0
  const done = remainingMs <= 0

  return (
    <div className={`rest-timer ${done ? 'done' : ''}`}>
      <div className="rt-track">
        <div className="rt-fill" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="rt-row">
        <span className="rt-tier">{done ? 'Rest complete' : `${timer.tier} rest`}</span>
        <span className="rt-time">{fmtClock(remaining)}</span>
        <div className="rt-actions">
          <button onClick={onAdd} disabled={done}>+30s</button>
          <button className="rt-skip" onClick={onSkip}>{done ? 'Dismiss' : 'Skip'}</button>
        </div>
      </div>
    </div>
  )
}

// Post-workout recap: total volume, per-exercise work, muscles worked.
function WorkoutSummary({ week, dayIndex, profile, session, onEdit }) {
  const d = buildDay(week, dayIndex, profile, session)
  const items = [
    d.t1 && { ex: d.t1, node: session?.t1 },
    ...d.t2.map((x, i) => ({ ex: x, node: session?.t2?.[i] })),
    ...d.t3.map((x, i) => ({ ex: x, node: session?.t3?.[i] })),
  ].filter((it) => it && doneSets(it.node).length > 0)

  const total = items.reduce((s, it) => s + setVolume(it.node), 0)
  const vol = loggedDayVolume(dayIndex, profile, session)

  return (
    <div className="summary">
      <div className="sum-hero">
        <span className="sum-check">✓</span>
        <h2>Workout complete</h2>
      </div>

      <div className="sum-total">
        <span className="sum-total-num">{total.toLocaleString()}</span>
        <span className="sum-total-label">lb total volume</span>
      </div>

      {items.length > 0 ? (
        <div className="sum-list">
          {items.map((it, idx) => (
            <div className="sum-row" key={idx}>
              <span className={`tier-badge ${tierClass(it.ex.tier)}`}>{it.ex.tier}</span>
              <span className="sum-name">{it.ex.name}</span>
              <span className="sum-sets">
                {doneSets(it.node).map((s) => `${s.weight}×${s.reps}`).join(', ')}
              </span>
              <span className="sum-vol">{setVolume(it.node).toLocaleString()} lb</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="hint">No sets were logged for this workout.</p>
      )}

      <section className="card">
        <h2>Muscles worked</h2>
        <MuscleMap volume={vol} />
      </section>
    </div>
  )
}

// Coaching line for the T1 top set: a suggested rep-max weight.
function CoachBanner({ tip }) {
  if (!tip || tip.suggested == null) return null
  return (
    <div className="coach">
      <span className="coach-label">Coach</span>
      {tip.mode === 'history' ? (
        tip.hit ? (
          <span>
            Last {tip.targetRM}RM: <strong>{tip.prev.weight} lb × {tip.prev.reps}</strong> (Week{' '}
            {tip.prev.week}). Try <strong>{tip.suggested} lb</strong> (+{tip.increment}).
          </span>
        ) : (
          <span>
            Last {tip.targetRM}RM: <strong>{tip.prev.weight} lb × {tip.prev.reps}</strong> (Week{' '}
            {tip.prev.week}, short of {tip.targetRM}). Repeat <strong>{tip.suggested} lb</strong>.
          </span>
        )
      ) : tip.mode === 'test' ? (
        <span>
          Suggested opener: <strong>{tip.suggested} lb</strong> — your current 1RM. Go for a PR.
        </span>
      ) : (
        <span>
          Suggested top set: <strong>{tip.suggested} lb</strong> for a {tip.targetRM}RM — estimated
          from your {tip.tm} lb training max (no {tip.targetRM}RM logged yet).
        </span>
      )}
    </div>
  )
}

// Autoregulation callout: a suggested TM change from AMRAP performance.
function SignalCallout({ signal, status, onAccept, onDismiss }) {
  if (!signal || status) return null
  const isBump = signal.type === 'bump'
  return (
    <div className={`signal ${isBump ? 'up' : 'down'}`}>
      <span className="sig-icon" aria-hidden="true">⚡</span>
      <div className="sig-body">
        <p className="sig-reason">{signal.reason}</p>
        <p className="sig-change">
          {signal.label}: <strong>{signal.current ?? '—'} → {signal.next} lb</strong>
        </p>
      </div>
      <div className="sig-actions">
        <button className="sig-accept" onClick={onAccept}>{isBump ? `+${signal.delta}` : signal.delta} lb</button>
        <button className="sig-x" onClick={onDismiss} aria-label="Dismiss">×</button>
      </div>
    </div>
  )
}

// Forward-looking progressive-overload note for a no-working-max T2a lift.
function OverloadNote({ tip }) {
  if (!tip) return null
  return (
    <div className="coach">
      <span className="coach-label">Coach</span>
      {tip.exceeded ? (
        <span>
          Last {tip.exName}: <strong>{tip.prevWeight} × {tip.prevReps}</strong> (Wk {tip.prevWeek}, beat
          the {tip.prevTarget} target). Add weight — try <strong>{tip.suggested} lb</strong>.
        </span>
      ) : (
        <span>
          Last {tip.exName}: <strong>{tip.prevWeight} × {tip.prevReps}</strong> (Wk {tip.prevWeek}). Aim
          to beat it at <strong>{tip.prevWeight} lb</strong>.
        </span>
      )}
    </div>
  )
}

export default function DayView({ week, dayIndex, profile, session, logs, api, onUpdateOneRM, onAcceptSignal, onBack, onGoDay }) {
  const d = buildDay(week, dayIndex, profile, session)
  const [timer, setTimer] = useState(null)
  const [editing, setEditing] = useState(false)
  // T1/T2a coaching + autoreg only apply to the core (T1-bearing) days.
  const t1Tip = d.t1 ? suggestT1(week, dayIndex, profile, logs) : null
  const t1Sig = d.t1 ? t1Signal(week, dayIndex, profile, logs) : null
  const t2aSig = d.t1 ? t2aSignal(week, dayIndex, profile, logs) : null
  const t2aTip = d.t1 ? t2aOverloadTip(week, dayIndex, profile, logs) : null
  const weekDays = daysInWeek(week, profile)
  const pos = weekDays.findIndex((wd) => wd.index === dayIndex)

  const acceptSignal = (signal, key) => {
    onAcceptSignal(signal)
    api.setSignal(week, dayIndex, key, 'accepted')
  }
  const dismissSignal = (key) => api.setSignal(week, dayIndex, key, 'dismissed')

  const startRest = (tier) => {
    const total = REST_SECONDS[tier] ?? 60
    setTimer({ tier, total, endsAt: Date.now() + total * 1000 })
  }
  const addTime = () => setTimer((t) => (t ? { ...t, total: t.total + 30, endsAt: t.endsAt + 30000 } : t))

  const complete = !!session?.completedAt
  const showSummary = complete && !editing

  const top = session?.t1?.sets?.[0]
  const est = top ? estimated1RM(top.weight, top.reps) : null

  return (
    <div className={`day-view ${timer && !showSummary ? 'with-timer' : ''}`}>
      <div className="dv-topbar">
        <button className="back-btn" onClick={onBack}>← Week {week}</button>
        <div className="wd-nav">
          <button onClick={() => onGoDay(weekDays[pos - 1].index)} disabled={pos <= 0} aria-label="Previous day">
            ‹
          </button>
          <span>Day {pos + 1}</span>
          <button onClick={() => onGoDay(weekDays[pos + 1].index)} disabled={pos >= weekDays.length - 1} aria-label="Next day">
            ›
          </button>
        </div>
      </div>

      <div className="dv-head">
        <h2>{d.dayLabel}</h2>
        <span className="modal-sub">
          Session {sessionNumber(week, dayIndex, profile)} of {totalSessions(profile)} · Week {week} · {d.mesoName}
        </span>
      </div>

      {showSummary ? (
        <WorkoutSummary
          week={week}
          dayIndex={dayIndex}
          profile={profile}
          session={session}
          onEdit={() => setEditing(true)}
        />
      ) : (
        <>
          {/* T1 (core days only) */}
          {d.t1 && (
            <div className="t1-wrap">
              <CoachBanner tip={t1Tip} />
              <ExerciseLog
                week={week}
                day={dayIndex}
                refObj={{ tier: 't1' }}
                exercise={d.t1}
                node={session?.t1}
                api={api}
                onSetComplete={startRest}
                suggestedTop={t1Tip?.suggested}
              />
              <div className="t1-extra">
                {d.t1.tm != null && <span className="ex-meta">TM {d.t1.tm} lb</span>}
                {est && <span className="est-chip">est 1RM ≈ {est.rounded} lb</span>}
              </div>
              {d.t1.test && est && (
                <button className="recalc-btn" onClick={() => onUpdateOneRM(d.t1.key, est.rounded)}>
                  Update {d.t1.name} 1RM to {est.rounded} lb →
                </button>
              )}
              <SignalCallout
                signal={t1Sig}
                status={session?.signals?.t1}
                onAccept={() => acceptSignal(t1Sig, 't1')}
                onDismiss={() => dismissSignal('t1')}
              />
            </div>
          )}

          {/* T2 */}
          {d.t2.length > 0 && (
            <div className="ex-group">
              <h4 className="group-title">Secondary — T2</h4>
              {d.t2.map((x, i) => (
                <Fragment key={i}>
                  {i === 0 && <OverloadNote tip={t2aTip} />}
                  <ExerciseLog
                    week={week}
                    day={dayIndex}
                    refObj={{ tier: 't2', slot: i }}
                    exercise={x}
                    node={session?.t2?.[i]}
                    api={api}
                    onSetComplete={startRest}
                  />
                  {i === 0 && (
                    <SignalCallout
                      signal={t2aSig}
                      status={session?.signals?.t2a}
                      onAccept={() => acceptSignal(t2aSig, 't2a')}
                      onDismiss={() => dismissSignal('t2a')}
                    />
                  )}
                </Fragment>
              ))}
            </div>
          )}

          {/* T3 */}
          {d.t3.length > 0 && (
            <div className="ex-group">
              <h4 className="group-title">Accessories — T3</h4>
              {d.t3.map((x, i) => (
                <ExerciseLog
                  key={i}
                  week={week}
                  day={dayIndex}
                  refObj={{ tier: 't3', slot: i }}
                  exercise={x}
                  node={session?.t3?.[i]}
                  api={api}
                  onSetComplete={startRest}
                  prev={previousT3Weight(week, dayIndex, i, logs)}
                />
              ))}
            </div>
          )}

          {d.t2.length === 0 && d.t3.length === 0 && (
            <p className="hint">Assistance work is pulled this week — focus on the main lift and recover.</p>
          )}

          {/* session note + complete */}
          <div className="session-foot">
            <textarea
              className="session-note"
              placeholder="Session notes (how it felt, bar speed, tweaks)…"
              value={session?.note ?? ''}
              onChange={(e) => api.setNote(week, dayIndex, e.target.value)}
            />
            {complete ? (
              <div className="foot-btns">
                <button className="complete-btn on" onClick={() => setEditing(false)}>← Back to summary</button>
                <button
                  className="uncomplete-btn"
                  onClick={() => {
                    api.setComplete(week, dayIndex, false)
                    setEditing(false)
                  }}
                >
                  Reopen workout
                </button>
              </div>
            ) : (
              <button className="complete-btn" onClick={() => api.setComplete(week, dayIndex, true)}>
                Mark workout complete
              </button>
            )}
          </div>
        </>
      )}

      {timer && !showSummary && <RestTimer timer={timer} onAdd={addTime} onSkip={() => setTimer(null)} />}
    </div>
  )
}
