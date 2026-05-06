import * as XLSX from 'xlsx'
import type { BirdSession } from '../types.js'

export const BIRDREPORTCN_HEADERS = ['中文名', '数量'] as const

export function generateBirdReportCNData(sessions: BirdSession[]): {
  headers: readonly string[]
  rows: (string | number)[][]
} {
  const speciesMap = new Map<string, number>()

  for (const session of sessions) {
    for (const entry of session.entries || []) {
      const name = entry.commonNameCN || ''
      if (!name) continue
      speciesMap.set(name, (speciesMap.get(name) || 0) + (entry.quantity || 1))
    }
  }

  const rows: (string | number)[][] = Array.from(speciesMap.entries()).map(
    ([name, qty]) => [name, qty]
  )

  return { headers: BIRDREPORTCN_HEADERS, rows }
}

/**
 * 生成 BirdReportCN 上传格式的 XLSX，仅包含 [中文名, 数量] 两列，
 * 数量按中文名跨 session 聚合。这是 BirdReportCN 网站导入接口接受的格式。
 */
export function generateBirdReportCNXlsx(sessions: BirdSession[]): Buffer {
  const { headers, rows } = generateBirdReportCNData(sessions)
  const wb = XLSX.utils.book_new()
  const data: (string | number)[][] = [Array.from(headers), ...rows]
  const ws = XLSX.utils.aoa_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return buf as Buffer
}
