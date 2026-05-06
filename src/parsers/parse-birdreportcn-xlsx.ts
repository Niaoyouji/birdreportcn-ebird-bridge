import * as XLSX from 'xlsx'
import { excelSerialToDate } from '../utils/date.js'
import type { BirdSession } from '../types.js'

export interface ParseBirdReportCNResult {
  sessions: BirdSession[]
  totalSessions: number
  totalEntries: number
}

/**
 * 解析 BirdReportCN（中国观鸟记录中心）从其网站下载的 XLSX 文件。
 *
 * 期望列布局（首行为表头，从第二行开始为数据）：
 *   col 0/1: 任意（通常为序号、记录人等元信息）
 *   col 2:   中文名
 *   col 3:   日期（YYYY-MM-DD 字符串或 Excel 日期序列号）
 *   col 4:   数量
 *
 * 注意：BirdReportCN 上传格式只接受 [中文名, 数量] 两列（由
 * generateBirdReportCNXlsx 产出），与本解析器不对称。
 */
export function parseBirdReportCNXlsx(buffer: Buffer | ArrayBuffer): ParseBirdReportCNResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { sessions: [], totalSessions: 0, totalEntries: 0 }
  }
  const sheet = workbook.Sheets[sheetName]!
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]

  const sessionsMap = new Map<string, BirdSession>()
  const rows = data.slice(1)

  for (const row of rows) {
    if (!row || row.length < 3) continue

    const dateVal = row[3]
    const name = row[2]
    const quantity = parseInt(String(row[4] ?? 1), 10) || 1

    if (dateVal == null || !name) continue

    let dateStr: string
    if (typeof dateVal === 'number') {
      dateStr = excelSerialToDate(dateVal).toISOString().substring(0, 10)
    } else {
      dateStr = String(dateVal).substring(0, 10)
    }

    if (!sessionsMap.has(dateStr)) {
      sessionsMap.set(dateStr, {
        name: dateStr,
        timestamp: new Date(dateStr).getTime(),
        entries: []
      })
    }

    sessionsMap.get(dateStr)!.entries.push({
      commonNameCN: String(name).trim(),
      quantity
    })
  }

  const sessions = Array.from(sessionsMap.values())
    .filter(s => s.entries.length > 0)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  const totalEntries = sessions.reduce((sum, s) => sum + s.entries.length, 0)

  return { sessions, totalSessions: sessions.length, totalEntries }
}
