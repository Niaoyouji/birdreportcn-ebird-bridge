import { parseBirdReportCNXlsx } from '../parsers/parse-birdreportcn-xlsx.js'
import { generateEbirdCSV, type GenerateEbirdCSVOptions } from './to-ebird-csv.js'

export interface BirdReportCNToEbirdOptions extends GenerateEbirdCSVOptions {
  defaultLocationName?: string
}

export interface BirdReportCNToEbirdResult {
  csv: string
  totalSessions: number
  totalEntries: number
}

export function convertBirdReportCNToEbird(
  buffer: Buffer | ArrayBuffer,
  options: BirdReportCNToEbirdOptions = {}
): BirdReportCNToEbirdResult {
  const { sessions, totalSessions, totalEntries } = parseBirdReportCNXlsx(buffer)

  if (options.defaultLocationName) {
    for (const s of sessions) {
      s.customLocationName = options.defaultLocationName
    }
  }

  const csv = generateEbirdCSV(sessions, options)
  return { csv, totalSessions, totalEntries }
}
