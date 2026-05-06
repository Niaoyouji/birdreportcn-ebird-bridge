import { describe, it, expect } from 'vitest'
import {
  generateEbirdCSV,
  generateBirdReportCNXlsx,
  parseBirdReportCNXlsx,
  parseEbirdCSV,
  lookupByChinese,
  lookupByName,
  lookupByLatin,
  resolveLatinParts,
  resolveName,
  getZheng4Name,
  getTaiwanName,
  getEnglishName,
  getHongKongName,
  getLatinName,
  getEbirdChineseName,
  getClementsBinomial,
  listAliases,
  listAllNames,
  searchByPrefix,
  listSupportedLanguages,
  getCoverageStats,
  calculateDuration,
  buildLocationName,
  getProvinceCode,
  csvEscape,
  parseCSV,
  EBIRD_HEADERS,
  type BirdSession
} from '../src/index.js'

const sampleSessions: BirdSession[] = [
  {
    id: 's1',
    name: '九寨沟一日',
    timestamp: new Date('2026-04-01T08:00:00').getTime(),
    latitude: 33.2602,
    longitude: 103.9201,
    province: '四川省',
    city: '阿坝州',
    specificLocation: '九寨沟',
    entries: [
      {
        scientificName: 'Treron sieboldii',
        commonNameCN: '红翅绿鸠',
        quantity: 3,
        timestamp: new Date('2026-04-01T08:30:00').getTime()
      },
      {
        scientificName: 'Botaurus flavicollis',
        commonNameCN: '黑苇鳽',
        quantity: 1,
        notes: '雄鸟',
        timestamp: new Date('2026-04-01T11:15:00').getTime()
      },
      {
        scientificName: 'Accipiter gentilis',
        commonNameCN: '苍鹰',
        quantity: 1,
        timestamp: new Date('2026-04-01T13:00:00').getTime()
      }
    ]
  }
]

describe('species lookup (low-level)', () => {
  it('finds species by Chinese name', () => {
    const sp = lookupByChinese('红翅绿鸠')
    expect(sp).not.toBeNull()
    expect(sp?.latin).toBe('Treron sieboldii')
  })

  it('finds species via alias (黑鳽 → 黑苇鳽)', () => {
    const sp = lookupByChinese('黑鳽')
    expect(sp).not.toBeNull()
    expect(sp?.names.zh_CN?.primary).toBe('黑苇鳽')
  })

  it('returns null for unknown name', () => {
    expect(lookupByChinese('火星鸟')).toBeNull()
  })

  it('finds species by Latin binomial', () => {
    const sp = lookupByLatin('Treron sieboldii')
    expect(sp?.names.zh_CN?.primary).toBe('红翅绿鸠')
  })

  it('lookupByName works with English', () => {
    const sp = lookupByName('Black Bittern')
    expect(sp?.names.zh_CN?.primary).toBe('黑苇鳽')
  })
})

describe('name-bridge (high-level)', () => {
  it('resolveName returns full alignment object', () => {
    const r = resolveName('黑鳽')
    expect(r).not.toBeNull()
    expect(r?.ioc.latin).toBe('Botaurus flavicollis')
    expect(r?.clements.latin).toBe('Botaurus flavicollis')
    expect(r?.primary.zh_CN).toBe('黑苇鳽')
    expect(r?.primary.en).toBe('Black Bittern')
    expect(r?.aliases.zh_CN).toContain('黑鳽')
  })

  it('resolveName applies Clements override (Accipiter→Astur)', () => {
    const r = resolveName('苍鹰')
    expect(r?.ioc.latin).toBe('Accipiter gentilis')
    expect(r?.clements.latin).toBe('Astur gentilis')
  })

  it('resolveName surfaces eBird simplified Chinese when present', () => {
    const r = resolveName('Acridotheres javanicus')
    expect(r?.ebirdZh).toBeTruthy()
  })

  it('getZheng4Name returns simplified Chinese primary', () => {
    expect(getZheng4Name('Botaurus flavicollis')).toBe('黑苇鳽')
    expect(getZheng4Name('Black Bittern')).toBe('黑苇鳽')
    expect(getZheng4Name('黑鳽')).toBe('黑苇鳽')
  })

  it('getTaiwanName returns Taiwan-specific name when distinct from zh_CN', () => {
    expect(getTaiwanName('仙八色鸫')).toBe('八色鳥')
    expect(getTaiwanName('斑嘴鸭')).toBe('花嘴鴨')
    expect(getTaiwanName('普通海鸥')).toBe('歐亞海鷗')
  })

  it('Taiwan name input round-trips back to all forms', () => {
    expect(getZheng4Name('八色鳥')).toBe('仙八色鸫')
    expect(getLatinName('八色鳥')).toBe('Pitta nympha')
    expect(getEnglishName('八色鳥')).toBe('Fairy Pitta')
  })

  it('getTaiwanName returns null for species without Taiwan name in data', () => {
    expect(getTaiwanName('黑苇鳽')).toBeNull()
  })

  it('getHongKongName works for species with HK data', () => {
    expect(getHongKongName('鸳鸯')).toBe('鴛鴦')
  })


  it('getEnglishName / getLatinName', () => {
    expect(getEnglishName('黑苇鳽')).toBe('Black Bittern')
    expect(getLatinName('黑苇鳽')).toBe('Botaurus flavicollis')
  })

  it('getClementsBinomial applies override', () => {
    expect(getClementsBinomial('苍鹰')).toBe('Astur gentilis')
    expect(getClementsBinomial('红翅绿鸠')).toBe('Treron sieboldii')
  })

  it('getEbirdChineseName falls back to null when no override', () => {
    expect(getEbirdChineseName('Treron sieboldii')).toBeNull()
  })

  it('listAliases returns the alias array', () => {
    const aliases = listAliases('黑苇鳽', 'zh_CN')
    expect(aliases).toContain('黑鳽')
  })

  it('listAllNames includes primary + aliases across all langs', () => {
    const all = listAllNames('黑苇鳽')
    expect(all).toContain('黑苇鳽')
    expect(all).toContain('黑鳽')
    expect(all).toContain('Black Bittern')
  })

  it('searchByPrefix matches primary names', () => {
    const results = searchByPrefix('红翅', { lang: 'zh_CN', limit: 5 })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every(s => s.names.zh_CN?.primary?.startsWith('红翅'))).toBe(true)
  })

  it('listSupportedLanguages reports zh_CN, zh_TW, zh_HK, en', () => {
    const langs = listSupportedLanguages()
    expect(langs).toEqual(expect.arrayContaining(['zh_CN', 'zh_TW', 'zh_HK', 'en']))
    expect(langs).not.toContain('ja')
    expect(langs).not.toContain('ko')
  })

  it('getCoverageStats reports expected ranges', () => {
    const stats = getCoverageStats()
    expect(stats['zh_CN']?.primary).toBe(1508)
    expect(stats['zh_TW']?.primary).toBeGreaterThan(1000)
    expect(stats['zh_HK']?.primary).toBeGreaterThan(400)
    expect(stats['en']?.primary).toBe(1508)
  })
})

describe('resolveLatinParts (IOC → Clements)', () => {
  it('passes through when no override', () => {
    const r = resolveLatinParts({ scientificName: 'Treron sieboldii', quantity: 1 })
    expect(r.iocBinomial).toBe('Treron sieboldii')
    expect(r.genus).toBe('Treron')
    expect(r.species).toBe('sieboldii')
  })

  it('applies Accipiter → Astur override for gentilis', () => {
    const r = resolveLatinParts({ scientificName: 'Accipiter gentilis', quantity: 1 })
    expect(r.iocBinomial).toBe('Accipiter gentilis')
    expect(r.genus).toBe('Astur')
    expect(r.species).toBe('gentilis')
  })

  it('blanks genus/species for hybrid', () => {
    const r = resolveLatinParts({ scientificName: 'Genus species × other', quantity: 1 })
    expect(r.genus).toBe('')
    expect(r.species).toBe('')
  })

  it('falls back to Chinese name lookup', () => {
    const r = resolveLatinParts({ commonNameCN: '红翅绿鸠', quantity: 1 })
    expect(r.iocBinomial).toBe('Treron sieboldii')
  })
})

describe('utils', () => {
  it('calculates duration as sum of per-day spans', () => {
    const t = calculateDuration([
      { quantity: 1, timestamp: new Date('2026-04-01T08:00:00').getTime() },
      { quantity: 1, timestamp: new Date('2026-04-01T10:30:00').getTime() }
    ])
    expect(t).toBe(150)
  })

  it('builds eBird location name from city + specificLocation', () => {
    expect(
      buildLocationName({
        timestamp: 0,
        entries: [],
        city: '成都市',
        specificLocation: '青龙湖'
      })
    ).toBe('成都·青龙湖')
  })

  it('returns province code (full and short forms)', () => {
    expect(getProvinceCode('四川省')).toBe('SC')
    expect(getProvinceCode('四川')).toBe('SC')
    expect(getProvinceCode('火星')).toBe('')
  })

  it('csv escape', () => {
    expect(csvEscape('plain')).toBe('plain')
    expect(csvEscape('with,comma')).toBe('"with,comma"')
    expect(csvEscape('with"quote')).toBe('"with""quote"')
  })

  it('parse CSV with quoted fields', () => {
    const rows = parseCSV('a,b,c\n"with,comma","x""y",z')
    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['with,comma', 'x"y', 'z']
    ])
  })
})

describe('generateEbirdCSV', () => {
  const csv = generateEbirdCSV(sampleSessions)
  const lines = csv.split('\n')

  it('produces one row per entry (no header)', () => {
    expect(lines.length).toBe(3)
  })

  it('uses Astur for goshawk via overrides', () => {
    expect(csv).toContain('Astur,gentilis')
  })

  it('uses Treron sieboldii unchanged', () => {
    expect(csv).toContain('Treron,sieboldii')
  })

  it('builds location name 阿坝·九寨沟', () => {
    expect(csv).toContain('阿坝州·九寨沟')
  })

  it('uses province code SC and country CN', () => {
    expect(csv).toMatch(/,SC,CN,/)
  })
})

describe('generateBirdReportCNXlsx (upload format: 中文名+数量, 数量聚合)', () => {
  it('produces a non-empty xlsx buffer', () => {
    const buf = generateBirdReportCNXlsx(sampleSessions)
    expect(Buffer.isBuffer(buf)).toBe(true)
    expect(buf.length).toBeGreaterThan(100)
  })

  it('aggregates same species across entries', async () => {
    const XLSX = await import('xlsx')
    const sessions: BirdSession[] = [
      {
        timestamp: 0,
        entries: [
          { commonNameCN: '红翅绿鸠', quantity: 2 },
          { commonNameCN: '红翅绿鸠', quantity: 5 },
          { commonNameCN: '苍鹰', quantity: 1 }
        ]
      }
    ]
    const buf = generateBirdReportCNXlsx(sessions)
    const wb = XLSX.read(buf, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]!]!
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]
    expect(data[0]).toEqual(['中文名', '数量'])
    const honglv = data.find(r => r[0] === '红翅绿鸠')
    expect(honglv?.[1]).toBe(7)
  })
})

describe('parseBirdReportCNXlsx (download format from website: 5 columns)', () => {
  it('extracts entries grouped by date', async () => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      ['序号', '记录人', '中文名', '日期', '数量'],
      [1, '小红', '红翅绿鸠', '2026-04-01', 3],
      [2, '小红', '苍鹰', '2026-04-01', 1],
      [3, '小红', '黑苇鳽', '2026-04-02', 1]
    ])
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const { sessions, totalSessions, totalEntries } = parseBirdReportCNXlsx(buf)
    expect(totalSessions).toBe(2)
    expect(totalEntries).toBe(3)

    const day1 = sessions.find(s => s.name?.startsWith('2026-04-01'))
    expect(day1?.entries.length).toBe(2)
    expect(day1?.entries[0]?.commonNameCN).toBe('红翅绿鸠')
    expect(day1?.entries[0]?.quantity).toBe(3)
  })
})

describe('parseEbirdCSV', () => {
  it('round-trips through generateEbirdCSV', () => {
    const headerLine = EBIRD_HEADERS.join(',')
    const dataCsv = generateEbirdCSV(sampleSessions)
    const fullCsv = headerLine + '\n' + dataCsv

    const { sessions, totalEntries, unmatchedSpecies } = parseEbirdCSV(fullCsv)
    expect(totalEntries).toBe(3)
    expect(unmatchedSpecies).toEqual([])

    const flat = sessions.flatMap(s => s.entries)
    expect(flat.find(e => e.scientificName === 'Treron sieboldii')).toBeTruthy()
  })

  it('parses headerless CSV using positional order', () => {
    const csv = generateEbirdCSV(sampleSessions)
    const { totalEntries } = parseEbirdCSV(csv)
    expect(totalEntries).toBe(3)
  })
})
