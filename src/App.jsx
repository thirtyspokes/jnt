import { useEffect, useState } from 'react'
import { useProfile, numericProfile, hasAllMaxes, DEFAULT_PROFILE } from './state/useProfile.js'
import { useLogs } from './state/useLogs.js'
import { useCycles } from './state/useCycles.js'
import { testedMax } from './program/cycles.js'
import Setup from './components/Setup.jsx'
import WeekOverview from './components/WeekOverview.jsx'
import WeekDetail from './components/WeekDetail.jsx'
import DayView from './components/DayView.jsx'
import Progress from './components/Progress.jsx'
import ConfirmModal from './components/ConfirmModal.jsx'

export default function App() {
  const [profile, setProfile] = useProfile()
  const [logs, logApi] = useLogs()
  const [cycles, cyclesApi] = useCycles()
  const ready = hasAllMaxes(profile)
  const [tab, setTab] = useState('setup') // 'setup' | 'plan' | 'progress'
  const [weekView, setWeekView] = useState(null) // null = overview, else week number
  const [dayView, setDayView] = useState(null) // { week, dayIndex } standalone day view
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmNextCycle, setConfirmNextCycle] = useState(false)
  const cycleNumber = cycles.length + 1

  // Capture this cycle's starting maxes once the lifter has entered all four,
  // so end-of-cycle gains have a stable baseline (test-day recalcs won't move it).
  useEffect(() => {
    if (hasAllMaxes(profile) && !profile.cycleStartMaxes) {
      setProfile((p) => ({ ...p, cycleStartMaxes: { ...p.oneRM } }))
    }
  }, [profile, setProfile])

  const openPlan = () => {
    setWeekView(null)
    setDayView(null)
    setTab('plan')
  }

  // Open a day; remember its week so "back" from the day returns to that week.
  const openDay = (week, dayIndex) => {
    setWeekView(week)
    setDayView({ week, dayIndex })
  }

  const np = numericProfile(profile)

  const updateOneRM = (lift, value) => {
    // A retest sets a fresh true 1RM, so clear that lift's autoreg offset.
    setProfile((p) => ({
      ...p,
      oneRM: { ...p.oneRM, [lift]: String(value) },
      tmAdjust: { ...(p.tmAdjust || {}), [lift]: 0 },
    }))
  }

  // Apply an accepted autoregulation signal (T1 -> TM offset; T2a -> working max).
  const acceptSignal = (signal) => {
    if (signal.kind === 't1') {
      setProfile((p) => ({
        ...p,
        tmAdjust: { ...(p.tmAdjust || {}), [signal.lift]: (p.tmAdjust?.[signal.lift] || 0) + signal.delta },
      }))
    } else if (signal.kind === 't2a') {
      setProfile((p) => ({
        ...p,
        t2Max: { ...p.t2Max, [signal.exId]: String((Number(p.t2Max?.[signal.exId]) || 0) + signal.delta) },
      }))
    }
  }

  const startFromScratch = () => {
    logApi.clearAll()
    cyclesApi.clearAll()
    setProfile(structuredClone(DEFAULT_PROFILE))
    setWeekView(null)
    setDayView(null)
    setConfirmReset(false)
    setTab('setup')
  }

  // Archive the finished cycle, then start a fresh one: keep the setup, carry
  // the end-of-program tested maxes forward, reset autoreg + logs.
  const startNextCycle = () => {
    cyclesApi.archive({
      id: `c-${Date.now()}`,
      number: cycleNumber,
      startedAt: profile.cycleStartedAt ?? null,
      archivedAt: new Date().toISOString(),
      profile: structuredClone(profile),
      logs: structuredClone(logs),
    })
    const oneRM = { ...profile.oneRM }
    for (const key of ['squat', 'bench', 'deadlift', 'ohp']) {
      const t = testedMax(key, logs)
      if (t != null) oneRM[key] = String(t)
    }
    setProfile((p) => ({
      ...p,
      oneRM,
      tmAdjust: { squat: 0, bench: 0, deadlift: 0, ohp: 0 },
      cycleStartedAt: new Date().toISOString(),
      cycleStartMaxes: { ...oneRM }, // baseline for the new cycle = carried-forward maxes
    }))
    logApi.clearAll()
    setWeekView(null)
    setDayView(null)
    setConfirmNextCycle(false)
    setTab('plan')
  }

  const daySession = dayView ? logs[`${dayView.week}-${dayView.dayIndex}`] || null : null

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark">J&amp;T</span>
          <div>
            <h1>Jacked &amp; Tan 2.0</h1>
            <p className="sub">12-week block · 4-day upper/lower</p>
          </div>
        </div>
        <nav className="tabs">
          <button className={tab === 'setup' ? 'on' : ''} onClick={() => setTab('setup')}>
            Setup
          </button>
          <button
            className={tab === 'plan' ? 'on' : ''}
            onClick={() => ready && openPlan()}
            disabled={!ready}
            title={ready ? '' : 'Enter your four 1RMs first'}
          >
            Plan
          </button>
          <button
            className={tab === 'progress' ? 'on' : ''}
            onClick={() => ready && setTab('progress')}
            disabled={!ready}
            title={ready ? '' : 'Enter your four 1RMs first'}
          >
            Progress
          </button>
        </nav>
      </header>

      <main className="content">
        {tab === 'setup' && (
          <Setup
            profile={profile}
            setProfile={setProfile}
            onDone={() => ready && setTab('plan')}
            onReset={() => setConfirmReset(true)}
          />
        )}
        {tab === 'plan' && dayView != null && (
          <DayView
            key={`${dayView.week}-${dayView.dayIndex}`}
            week={dayView.week}
            dayIndex={dayView.dayIndex}
            profile={np}
            session={daySession}
            logs={logs}
            api={logApi}
            onUpdateOneRM={updateOneRM}
            onAcceptSignal={acceptSignal}
            onBack={() => setDayView(null)}
            onGoDay={(dayIndex) => setDayView({ week: dayView.week, dayIndex })}
          />
        )}
        {tab === 'plan' && dayView == null && weekView == null && (
          <WeekOverview
            profile={np}
            logs={logs}
            cycleNumber={cycleNumber}
            onOpenWeek={setWeekView}
            onOpenDay={openDay}
            onStartNextCycle={() => setConfirmNextCycle(true)}
          />
        )}
        {tab === 'plan' && dayView == null && weekView != null && (
          <WeekDetail
            week={weekView}
            profile={np}
            logs={logs}
            onOpenDay={openDay}
            onBack={() => setWeekView(null)}
            onGoWeek={setWeekView}
          />
        )}
        {tab === 'progress' && <Progress profile={np} logs={logs} />}
      </main>

      {confirmNextCycle && (
        <ConfirmModal
          title={`Start cycle ${cycleNumber + 1}?`}
          message="This archives your completed cycle, carries your tested maxes forward as your new 1RMs, and resets the plan to Week 1. Your setup is kept and the finished cycle stays saved."
          confirmLabel="Start next cycle"
          onConfirm={startNextCycle}
          onCancel={() => setConfirmNextCycle(false)}
        />
      )}

      {confirmReset && (
        <ConfirmModal
          title="Start from scratch?"
          message="This permanently deletes your maxes, exercise choices, custom lifts, and every logged session. This can't be undone."
          confirmLabel="Delete everything"
          danger
          onConfirm={startFromScratch}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  )
}
