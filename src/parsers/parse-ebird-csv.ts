import { parseCSV } from '../utils/csv.js'
import { parseEbirdDate, parseEbirdTime } from '../utils/date.js'
import { lookupByLatin, clementsToIocBinomial } from '../mapping/species-lookup.js'
import type { BirdSession, BirdEntry } from '../types.js'

export interface ParseEbirdCSVResult {
  sessions: BirdSession[]
  totalSessions: number
  totalEntries: number
  unmatchedSpecies: string[]
}

interface ParsedRow {
  commonName: string
  genus: string
  species: string
  number: number
  speciesComments: string
  locationName: string
  latitude: string
  longitude: string
  dateStr: string
  startTime: string
  stateProvince: string
  countryCode: string
}

const HEADER_MAP: Record<string, keyof ParsedRow> = {
  'Common Name': 'commonName',
  'Genus': 'genus',
  'Species': 'species',
  'Number': 'number',
  'Species Comments': 'speciesComments',
  'Location Name': 'locationName',
  'Latitude': 'latitude',
  'Longitude': 'longitude',
  'Date': 'dateStr',
  'Start Time': 'startTime',
  'State/Province': 'stateProvince',
  'Country Code': 'countryCode'
}

export function parseEbirdCSV(csv: string): ParseEbirdCSVResult {
  const rows = parseCSV(csv)
  if (rows.length === 0) {
    return { sessions: [], totalSessions: 0, totalEntries: 0, unmatchedSpecies: [] }
  }

  let dataStart = 0
  let headerToIndex: Record<string, number> | null = null

  if (rows[0] && rows[0][0] === 'Common Name') {
    const header = rows[0]!
    headerToIndex = {}
    for (let i = 0; i < header.length; i++) {
      headerToIndex[header[i]!] = i
    }
    dataStart = 1
  }

  const getCol = (row: string[], header: string): string => {
    if (headerToIndex) {
      const idx = headerToIndex[header]
      if (idx == null) return ''
      return row[idx] ?? ''
    }
    const idx = EBIRD_NO_HEADER_ORDER.indexOf(header)
    return idx >= 0 ? row[idx] ?? '' : ''
  }

  const sessionsMap = new Map<string, BirdSession>()
  const unmatched = new Set<string>()

  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i]!
    if (row.length < 4) continue

    const parsed: ParsedRow = {
      commonName: getCol(row, 'Common Name').trim(),
      genus: getCol(row, 'Genus').trim(),
      species: getCol(row, 'Species').trim(),
      number: parseInt(getCol(row, 'Number'), 10) || 1,
      speciesComments: getCol(row, 'Species Comments'),
      locationName: getCol(row, 'Location Name').trim(),
      latitude: getCol(row, 'Latitude').trim(),
      longitude: getCol(row, 'Longitude').trim(),
      dateStr: getCol(row, 'Date').trim(),
      startTime: getCol(row, 'Start Time').trim(),
      stateProvince: getCol(row, 'State/Province').trim(),
      countryCode: getCol(row, 'Country Code').trim()
    }

    if (!parsed.commonName && !parsed.genus) continue

    const date = parseEbirdDate(parsed.dateStr) || new Date(0)
    const time = parseEbirdTime(parsed.startTime)
    const sessionTs = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time?.hours ?? 0,
      time?.minutes ?? 0
    ).getTime()

    const sessionKey = `${parsed.locationName}|${parsed.dateStr}|${parsed.startTime}`
    if (!sessionsMap.has(sessionKey)) {
      sessionsMap.set(sessionKey, {
        name: parsed.locationName || parsed.dateStr,
        timestamp: sessionTs,
        latitude: parsed.latitude ? Number(parsed.latitude) : undefined,
        longitude: parsed.longitude ? Number(parsed.longitude) : undefined,
        province: parsed.stateProvince || undefined,
        customLocationName: parsed.locationName || undefined,
        entries: []
      })
    }

    let scientificName: string | undefined
    let commonNameCN = parsed.commonName

    if (parsed.genus && parsed.species) {
      const clementsBin = `${parsed.genus} ${parsed.species}`
      const iocBin = clementsToIocBinomial(clementsBin)
      scientificName = iocBin
      const sp = lookupByLatin(iocBin)
      if (sp) {
        commonNameCN = sp.names.zh_CN?.primary || commonNameCN
      } else {
        unmatched.add(clementsBin)
      }
    }

    const entry: BirdEntry = {
      scientificName,
      commonNameCN,
      quantity: parsed.number,
      notes: parsed.speciesComments || undefined,
      timestamp: sessionTs
    }

    sessionsMap.get(sessionKey)!.entries.push(entry)
  }

  const sessions = Array.from(sessionsMap.values()).sort(
    (a, b) => a.timestamp - b.timestamp
  )

  const totalEntries = sessions.reduce((sum, s) => sum + s.entries.length, 0)

  return {
    sessions,
    totalSessions: sessions.length,
    totalEntries,
    unmatchedSpecies: Array.from(unmatched).sort()
  }
}

const EBIRD_NO_HEADER_ORDER = [
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
]
