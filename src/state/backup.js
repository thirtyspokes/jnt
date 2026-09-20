// Backup / restore of the whole app state (the two localStorage blobs).
// Format is versioned so a future import can migrate an old file.

const PROFILE_KEY = 'jnt.profile.v1'
const LOGS_KEY = 'jnt.logs.v1'
const CYCLES_KEY = 'jnt.cycles.v1'
export const BACKUP_SCHEMA = 1

function readKey(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function buildBackup() {
  return {
    app: 'jnt',
    schema: BACKUP_SCHEMA,
    exportedAt: new Date().toISOString(),
    profile: readKey(PROFILE_KEY),
    logs: readKey(LOGS_KEY),
    cycles: readKey(CYCLES_KEY),
  }
}

export const backupJson = () => JSON.stringify(buildBackup(), null, 2)

// Trigger a file download of the backup (needs a user gesture to be reliable).
export function downloadBackup() {
  try {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    const blob = new Blob([backupJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jnt-backup-${stamp}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return true
  } catch {
    return false
  }
}

export async function copyBackup() {
  await navigator.clipboard.writeText(backupJson())
}

// Validate + parse pasted/loaded text into a backup object (throws on bad input).
export function parseBackup(text) {
  const obj = JSON.parse(text)
  if (!obj || obj.app !== 'jnt' || !('profile' in obj) || !('logs' in obj)) {
    throw new Error('That doesn’t look like a J&T backup file.')
  }
  return obj
}

// Write a backup object back into localStorage. Caller should reload afterward
// so the React stores re-read from storage.
export function applyBackup(obj) {
  if (obj.profile != null) localStorage.setItem(PROFILE_KEY, JSON.stringify(obj.profile))
  if (obj.logs != null) localStorage.setItem(LOGS_KEY, JSON.stringify(obj.logs))
  if (obj.cycles != null) localStorage.setItem(CYCLES_KEY, JSON.stringify(obj.cycles))
}

// Count what's in a parsed backup, for the restore confirmation.
export function backupSummary(obj) {
  const sessions = obj?.logs ? Object.keys(obj.logs).length : 0
  const exported = obj?.exportedAt ? new Date(obj.exportedAt).toLocaleString() : 'unknown date'
  return { sessions, exported }
}
