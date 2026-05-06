import type { BirdEntry } from '../types.js'

export function calculateDuration(entries: BirdEntry[]): number {
  const timestamps = entries
    .map(e => (e.timestamp ? new Date(e.timestamp).getTime() : null))
    .filter((t): t is number => t != null)
  if (timestamps.length < 2) return 1

  const dayMap = new Map<string, number[]>()
  for (const ts of timestamps) {
    const d = new Date(ts)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (!dayMap.has(key)) dayMap.set(key, [])
    dayMap.get(key)!.push(ts)
  }

  let totalMs = 0
  for (const dayTs of dayMap.values()) {
    if (dayTs.length >= 2) {
      totalMs += Math.max(...dayTs) - Math.min(...dayTs)
    }
  }

  const minutes = Math.round(totalMs / 60000)
  return Math.max(1, Math.min(1440, minutes))
}
