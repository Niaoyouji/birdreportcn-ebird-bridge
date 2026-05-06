import { parseEbirdCSV } from '../parsers/parse-ebird-csv.js'
import { generateBirdReportCNXlsx } from './to-birdreportcn-xlsx.js'

export interface EbirdToBirdReportCNResult {
  buffer: Buffer
  totalSessions: number
  totalEntries: number
  unmatchedSpecies: string[]
}

export function convertEbirdToBirdReportCN(csv: string): EbirdToBirdReportCNResult {
  const { sessions, totalSessions, totalEntries, unmatchedSpecies } = parseEbirdCSV(csv)
  const buffer = generateBirdReportCNXlsx(sessions)
  return { buffer, totalSessions, totalEntries, unmatchedSpecies }
}
