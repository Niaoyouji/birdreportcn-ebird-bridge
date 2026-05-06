import { ZH_OVERRIDES } from '../data.js'
import { resolveLatinParts } from '../mapping/resolve-latin.js'
import { calculateDuration } from '../utils/duration.js'
import { buildLocationName } from '../utils/location.js'
import { getProvinceCode } from '../utils/province.js'
import { rowsToCSV } from '../utils/csv.js'
import { formatEbirdDate, formatEbirdTime } from '../utils/date.js'
import type { BirdSession } from '../types.js'

export interface GenerateEbirdCSVOptions {
  protocol?: string
  numberOfObservers?: number
  countryCode?: string
}

export const EBIRD_HEADERS = [
  'Common Name',
  'Genus',
  'Species',
  'Number',
  'Species Comments',
  'Location Name',
  'Latitude',
  'Longitude',
  'Date',
  'Start Time',
  'State/Province',
  'Country Code',
  'Protocol',
  'Number of Observers',
  'Duration (min)',
  'All observations reported?',
  'Effort Distance Miles',
  'Effort area acres',
  'Submission Comments'
] as const

export function generateEbirdCSV(
  sessions: BirdSession[],
  options: GenerateEbirdCSVOptions = {}
): string {
  const protocol = options.protocol ?? 'stationary'
  const observers = options.numberOfObservers ?? 1
  const country = options.countryCode ?? 'CN'

  const rows: (string | number)[][] = []

  for (const session of sessions) {
    const entries = session.entries || []
    if (entries.length === 0) continue

    const locationName = buildLocationName(session)
    const lat = session.latitude != null ? Number(session.latitude).toFixed(4) : ''
    const lng = session.longitude != null ? Number(session.longitude).toFixed(4) : ''
    const provinceCode = getProvinceCode(session.province)

    const duration = calculateDuration(entries)

    const sessionDate = new Date(session.timestamp || Date.now())
    const dateStr = formatEbirdDate(sessionDate)
    const timeStr = formatEbirdTime(sessionDate)

    for (const entry of entries) {
      const quantity = entry.quantity || 1
      const notes = (entry.notes || '').replace(/[\r\n]+/g, ' ')
      const { iocBinomial, genus, species } = resolveLatinParts(entry)
      const commonName =
        (iocBinomial && ZH_OVERRIDES[iocBinomial]) || entry.commonNameCN || ''

      rows.push([
        commonName,
        genus,
        species,
        quantity,
        notes,
        locationName,
        lat,
        lng,
        dateStr,
        timeStr,
        provinceCode,
        country,
        protocol,
        observers,
        duration,
        'Y',
        '',
        '',
        ''
      ])
    }
  }

  return rowsToCSV(rows)
}
