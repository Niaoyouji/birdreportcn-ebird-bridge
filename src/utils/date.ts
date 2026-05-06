export function formatEbirdDate(ts: number | Date): string {
  const d = typeof ts === 'number' ? new Date(ts) : ts
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

export function formatEbirdTime(ts: number | Date): string {
  const d = typeof ts === 'number' ? new Date(ts) : ts
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function parseEbirdDate(dateStr: string): Date | null {
  const m = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const month = parseInt(m[1]!, 10)
  const day = parseInt(m[2]!, 10)
  const year = parseInt(m[3]!, 10)
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return new Date(year, month - 1, day)
}

export function parseEbirdTime(timeStr: string): { hours: number; minutes: number } | null {
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const hours = parseInt(m[1]!, 10)
  const minutes = parseInt(m[2]!, 10)
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return { hours, minutes }
}

export function excelSerialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000))
}
