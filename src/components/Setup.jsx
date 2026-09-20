import { useState } from 'react'
import { DAYS, T1, t2For, t3For, makeCustomId } from '../program/exercises.js'
import { trainingMax } from '../program/generate.js'
import { weeklyVolume, MUSCLE_GROUPS } from '../program/muscles.js'
import { hasAllMaxes } from '../state/useProfile.js'
import { downloadBackup, copyBackup, parseBackup, applyBackup, backupSummary } from '../state/backup.js'
import MuscleMap from './MuscleMap.jsx'
import ConfirmModal from './ConfirmModal.jsx'

const WEEKS = Array.from({ length: 12 }, (_, i) => i + 1)

const T1_ORDER = ['squat', 'bench', 'deadlift', 'ohp']
const DAY_TYPES = [
  { v: 'any', label: 'Any day' },
  { v: 'lower', label: 'Lower days' },
  { v: 'upper', label: 'Upper days' },
]

export default function Setup({ profile, setProfile, onDone, onReset }) {
  const update = (patch) => setProfile((p) => ({ ...p, ...patch }))
  const custom = profile.custom ?? { t2: [], t3: [] }

  const setOneRM = (lift, value) =>
    setProfile((p) => ({ ...p, oneRM: { ...p.oneRM, [lift]: value } }))

  const setT2Max = (id, value) =>
    setProfile((p) => ({ ...p, t2Max: { ...p.t2Max, [id]: value } }))

  // Resize a per-day selection array to `count`, filling new slots with the
  // first available option not already chosen for that day/tier.
  const resize = (arr, count, options) => {
    const next = arr.slice(0, count)
    while (next.length < count) {
      const pick = options.find((o) => !next.includes(o.id)) || options[0]
      next.push(pick.id)
    }
    return next
  }

  const setCount = (tier, count) => {
    setProfile((p) => {
      const cst = p.custom ?? { t2: [], t3: [] }
      const selections = { ...p.selections }
      DAYS.forEach((d) => {
        const opts = tier === 't2' ? t2For(d.dayType, cst.t2) : t3For(d.dayType, cst.t3)
        const cur = selections[d.index]?.[tier] ?? []
        selections[d.index] = {
          ...selections[d.index],
          [tier]: resize(cur, count, opts),
        }
      })
      return { ...p, [tier === 't2' ? 't2Count' : 't3Count']: count, selections }
    })
  }

  // ---- custom exercises ----
  const [draft, setDraft] = useState({ name: '', tier: 't2', dayType: 'any', muscles: [] })
  const [mapWeek, setMapWeek] = useState(1)

  const toggleDraftMuscle = (key) =>
    setDraft((d) => ({
      ...d,
      muscles: d.muscles.includes(key) ? d.muscles.filter((k) => k !== key) : [...d.muscles, key],
    }))

  const addCustom = () => {
    const name = draft.name.trim()
    if (!name) return
    const entry = {
      id: makeCustomId(draft.tier),
      name,
      dayType: draft.dayType,
      muscles: draft.muscles,
      custom: true,
    }
    setProfile((p) => {
      const cst = p.custom ?? { t2: [], t3: [] }
      return { ...p, custom: { ...cst, [draft.tier]: [...(cst[draft.tier] ?? []), entry] } }
    })
    setDraft((d) => ({ ...d, name: '', muscles: [] }))
  }

  const removeCustom = (tier, id) => {
    setProfile((p) => {
      const cst = p.custom ?? { t2: [], t3: [] }
      const nextCustom = { ...cst, [tier]: (cst[tier] ?? []).filter((e) => e.id !== id) }
      // Repair any day that had this exercise selected: swap in another option.
      const selections = { ...p.selections }
      DAYS.forEach((d) => {
        const cur = selections[d.index]?.[tier] ?? []
        if (!cur.includes(id)) return
        const opts = tier === 't2' ? t2For(d.dayType, nextCustom.t2) : t3For(d.dayType, nextCustom.t3)
        const repaired = cur.map((x) => {
          if (x !== id) return x
          const pick = opts.find((o) => !cur.includes(o.id)) || opts[0]
          return pick ? pick.id : x
        })
        selections[d.index] = { ...selections[d.index], [tier]: repaired }
      })
      return { ...p, custom: nextCustom, selections }
    })
  }

  const setSlot = (dayIndex, tier, slot, id) => {
    setProfile((p) => {
      const day = { ...(p.selections[dayIndex] || { t2: [], t3: [] }) }
      const arr = [...(day[tier] || [])]
      arr[slot] = id
      day[tier] = arr
      return { ...p, selections: { ...p.selections, [dayIndex]: day } }
    })
  }

  // ---- backup / restore ----
  const [copyMsg, setCopyMsg] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [importErr, setImportErr] = useState('')
  const [pendingRestore, setPendingRestore] = useState(null)

  const onCopy = async () => {
    try {
      await copyBackup()
      setCopyMsg('Copied!')
    } catch {
      setCopyMsg('Copy failed')
    }
    setTimeout(() => setCopyMsg(''), 1800)
  }

  const tryRestore = (text) => {
    try {
      setPendingRestore(parseBackup(text))
      setImportErr('')
    } catch (err) {
      setImportErr(err.message || 'Invalid backup')
    }
  }

  const onFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => tryRestore(String(reader.result))
    reader.onerror = () => setImportErr('Could not read that file.')
    reader.readAsText(file)
  }

  const confirmRestore = () => {
    applyBackup(pendingRestore)
    window.location.reload()
  }

  const ready = hasAllMaxes(profile)
  const tmPctOptions = [
    { v: 0.85, label: '85%' },
    { v: 0.875, label: '87.5%' },
    { v: 0.9, label: '90%' },
  ]

  return (
    <div className="setup">
      {/* ---- 1RMs ---- */}
      <section className="card">
        <div className="card-head">
          <h2>Your maxes</h2>
          <label className="tm-pct">
            Training max
            <select
              value={profile.tmPct}
              onChange={(e) => update({ tmPct: parseFloat(e.target.value) })}
            >
              {tmPctOptions.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.label} of 1RM
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="hint">
          Enter your true 1-rep max for each main lift. Your training max (the
          basis for Block 1 back-off weights) is computed and rounded to the
          nearest 5 lb.
        </p>
        <div className="max-grid">
          {T1_ORDER.map((lift) => {
            const val = profile.oneRM[lift]
            const n = parseFloat(val)
            const tm = Number.isFinite(n) && n > 0 ? trainingMax(n, profile.tmPct) : null
            return (
              <div className="max-row" key={lift}>
                <label>{T1[lift].name}</label>
                <div className="max-input">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="5"
                    placeholder="1RM"
                    value={val}
                    onChange={(e) => setOneRM(lift, e.target.value)}
                  />
                  <span className="lb">lb</span>
                </div>
                <div className="tm">{tm != null ? `TM ${tm}` : '—'}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---- counts ---- */}
      <section className="card">
        <h2>How many assistance lifts?</h2>
        <p className="hint">Applies to every training day. Defaults: 2 T2, 3 T3.</p>
        <div className="count-row">
          <CountControl
            label="T2 (secondary compounds)"
            value={profile.t2Count}
            min={1}
            max={4}
            onChange={(c) => setCount('t2', c)}
          />
          <CountControl
            label="T3 (accessories)"
            value={profile.t3Count}
            min={1}
            max={6}
            onChange={(c) => setCount('t3', c)}
          />
        </div>
      </section>

      {/* ---- custom exercises ---- */}
      <section className="card">
        <h2>Your own exercises</h2>
        <p className="hint">
          Add any lift that isn't in the lists below — it becomes selectable on
          the days you choose.
        </p>
        <div className="custom-add">
          <input
            type="text"
            placeholder="Exercise name (e.g. Belt Squat)"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          />
          <select value={draft.tier} onChange={(e) => setDraft((d) => ({ ...d, tier: e.target.value }))}>
            <option value="t2">T2</option>
            <option value="t3">T3</option>
          </select>
          <select value={draft.dayType} onChange={(e) => setDraft((d) => ({ ...d, dayType: e.target.value }))}>
            {DAY_TYPES.map((o) => (
              <option key={o.v} value={o.v}>{o.label}</option>
            ))}
          </select>
          <button className="add-custom-btn" onClick={addCustom} disabled={!draft.name.trim()}>
            Add
          </button>
        </div>
        <div className="muscle-pick">
          <span className="mp-label">Targets</span>
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              className={`mp-chip ${draft.muscles.includes(g.key) ? 'on' : ''}`}
              onClick={() => toggleDraftMuscle(g.key)}
            >
              {g.label}
            </button>
          ))}
        </div>
        {(custom.t2.length > 0 || custom.t3.length > 0) && (
          <div className="custom-list">
            {['t2', 't3'].map((tier) =>
              (custom[tier] ?? []).map((e) => (
                <span className="custom-chip" key={e.id}>
                  <span className={`chip-tier ${tier}`}>{tier.toUpperCase()}</span>
                  {e.name}
                  <span className="chip-day">
                    {DAY_TYPES.find((o) => o.v === e.dayType)?.label ?? e.dayType}
                    {!e.muscles?.length && ' · untracked'}
                  </span>
                  <button className="chip-x" title="Remove" onClick={() => removeCustom(tier, e.id)}>
                    ×
                  </button>
                </span>
              )),
            )}
          </div>
        )}
      </section>

      {/* ---- per-day exercise picks ---- */}
      <section className="card">
        <h2>Pick your lifts</h2>
        <p className="hint">
          T1 is fixed. The first T2 each day drives the percentage progression
          (add a working max to see its weight); the rest are max-rep-set work.
        </p>
        <div className="day-grid">
          {DAYS.map((d) => {
            const sel = profile.selections[d.index] || { t2: [], t3: [] }
            const t2opts = t2For(d.dayType, custom.t2)
            const t3opts = t3For(d.dayType, custom.t3)
            return (
              <div className="day-col" key={d.index}>
                <div className="day-col-head">
                  <h3>{d.label}</h3>
                  <span className="pill t1">T1 · {T1[d.t1].name}</span>
                </div>

                <div className="slot-group">
                  <span className="slot-label">T2</span>
                  {sel.t2.map((id, i) => (
                    <div className="slot" key={i}>
                      <select value={id} onChange={(e) => setSlot(d.index, 't2', i, e.target.value)}>
                        {t2opts.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}{o.custom ? ' ✦' : ''}
                          </option>
                        ))}
                      </select>
                      {i === 0 && (
                        <div className="t2a-max">
                          <input
                            type="number"
                            min="0"
                            step="5"
                            placeholder="max (opt.)"
                            value={profile.t2Max?.[id] ?? ''}
                            onChange={(e) => setT2Max(id, e.target.value)}
                          />
                          <span className="tag">T2a %</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="slot-group">
                  <span className="slot-label">T3</span>
                  {sel.t3.map((id, i) => (
                    <div className="slot" key={i}>
                      <select value={id} onChange={(e) => setSlot(d.index, 't3', i, e.target.value)}>
                        {t3opts.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}{o.custom ? ' ✦' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---- muscle coverage ---- */}
      <section className="card">
        <div className="card-head">
          <h2>Muscle coverage</h2>
          <label className="week-pick">
            Week
            <select value={mapWeek} onChange={(e) => setMapWeek(Number(e.target.value))}>
              {WEEKS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="hint">
          Weekly working sets each muscle group gets from your current picks
          (primary lifts count 1, secondary ½). Darker = more volume; “gap” flags
          a group with none.
        </p>
        <MuscleMap volume={weeklyVolume(mapWeek, profile)} />
      </section>

      <div className="setup-actions">
        <button className="primary" disabled={!ready} onClick={onDone}>
          {ready ? 'View my 12-week plan →' : 'Enter all four 1RMs to continue'}
        </button>
      </div>

      {/* ---- backup & restore ---- */}
      <section className="card">
        <h2>Backup &amp; restore</h2>
        <p className="hint">
          Your data lives only on this device. Download or copy a backup and keep
          it in Files or iCloud Drive so a cleared browser or reinstall can’t wipe
          your history.
        </p>
        <div className="backup-row">
          <button className="backup-btn" onClick={() => downloadBackup()}>Download backup</button>
          <button className="backup-btn" onClick={onCopy}>{copyMsg || 'Copy backup'}</button>
        </div>

        <div className="restore-block">
          <label className="restore-file">
            Restore from file
            <input type="file" accept="application/json,.json" onChange={onFile} />
          </label>
          <div className="restore-paste">
            <textarea
              placeholder="…or paste a backup here"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <button
              className="backup-btn"
              disabled={!pasteText.trim()}
              onClick={() => tryRestore(pasteText)}
            >
              Restore
            </button>
          </div>
          {importErr && <p className="restore-err">{importErr}</p>}
        </div>
      </section>

      <section className="danger-zone">
        <div>
          <h3>Start from scratch</h3>
          <p>Clear your maxes, lift choices, custom exercises, and all logged progress.</p>
        </div>
        <button className="btn-danger-outline" onClick={onReset}>
          Start from scratch
        </button>
      </section>

      {pendingRestore && (
        <ConfirmModal
          title="Restore this backup?"
          message={`This replaces your current data with the backup from ${
            backupSummary(pendingRestore).exported
          } (${backupSummary(pendingRestore).sessions} logged sessions). The app will reload.`}
          confirmLabel="Restore"
          onConfirm={confirmRestore}
          onCancel={() => setPendingRestore(null)}
        />
      )}
    </div>
  )
}

function CountControl({ label, value, min, max, onChange }) {
  return (
    <div className="count-control">
      <span>{label}</span>
      <div className="stepper">
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
          −
        </button>
        <strong>{value}</strong>
        <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
          +
        </button>
      </div>
    </div>
  )
}
