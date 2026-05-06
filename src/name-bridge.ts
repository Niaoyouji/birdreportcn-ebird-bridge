import { CLEMENTS_OVERRIDES, ZH_OVERRIDES, IOC_SPECIES } from './data.js'
import { lookupByName, lookupByLatin } from './mapping/species-lookup.js'
import type { IocSpecies, LangCode } from './types.js'

export interface ResolvedName {
  ioc: { latin: string }
  clements: { latin: string }
  primary: Partial<Record<LangCode, string>>
  aliases: Partial<Record<LangCode, string[]>>
  ebirdZh?: string
}

function applyClementsOverride(iocBinomial: string): string {
  return CLEMENTS_OVERRIDES[iocBinomial] || iocBinomial
}

function speciesToResolved(sp: IocSpecies): ResolvedName {
  const iocBinomial = sp.latin.split(/\s+/).slice(0, 2).join(' ')
  const clementsBinomial = applyClementsOverride(iocBinomial)
  const ebirdZh = ZH_OVERRIDES[iocBinomial]

  const primary: Partial<Record<LangCode, string>> = {}
  const aliases: Partial<Record<LangCode, string[]>> = {}
  for (const [lang, ns] of Object.entries(sp.names)) {
    if (!ns) continue
    if (ns.primary) primary[lang] = ns.primary
    if (ns.aliases && ns.aliases.length) aliases[lang] = [...ns.aliases]
  }

  return {
    ioc: { latin: sp.latin },
    clements: { latin: clementsBinomial },
    primary,
    aliases,
    ...(ebirdZh ? { ebirdZh } : {})
  }
}

/**
 * 用任意名字（中文/英文/拉丁/别名）查询物种，返回所有语言的对齐结果。
 * 是本库最常用的高阶 API。
 */
export function resolveName(query: string): ResolvedName | null {
  if (!query) return null
  const trimmed = query.trim()
  const sp = lookupByName(trimmed) || lookupByLatin(trimmed)
  return sp ? speciesToResolved(sp) : null
}

export function batchResolve(queries: string[]): Array<ResolvedName | null> {
  return queries.map(q => resolveName(q))
}

/** 简体中文（兼容郑四主名） */
export function getSimplifiedChineseName(query: string): string | null {
  return resolveName(query)?.primary.zh_CN ?? null
}
export const getZheng4Name = getSimplifiedChineseName

/** 繁体中文 / 台湾国语 主名（数据由 Avibase 填充，未覆盖则返回 null） */
export function getTaiwanName(query: string): string | null {
  return resolveName(query)?.primary.zh_TW ?? null
}

/** 繁体中文 / 香港用法 主名 */
export function getHongKongName(query: string): string | null {
  return resolveName(query)?.primary.zh_HK ?? null
}

/** IOC 英文名 */
export function getEnglishName(query: string): string | null {
  return resolveName(query)?.primary.en ?? null
}

/** IOC 拉丁二项式 */
export function getLatinName(query: string): string | null {
  return resolveName(query)?.ioc.latin ?? null
}

/**
 * eBird 自己界面上展示的简中名（来自 ZH_OVERRIDES）。
 * 与郑四主名不一定相同 —— eBird 有时使用不同译法或括号补充。
 */
export function getEbirdChineseName(query: string): string | null {
  return resolveName(query)?.ebirdZh ?? null
}

/** Clements 二项式（应用了 IOC→Clements 的 18 条修正） */
export function getClementsBinomial(query: string): string | null {
  return resolveName(query)?.clements.latin ?? null
}

/** 列出指定语言下的别名（不含主名） */
export function listAliases(query: string, lang: LangCode = 'zh_CN'): string[] {
  const r = resolveName(query)
  return r?.aliases[lang] ? [...r.aliases[lang]!] : []
}

/** 列出该物种在任一语言下的所有已知名字（主名 + 别名） */
export function listAllNames(query: string): string[] {
  const r = resolveName(query)
  if (!r) return []
  const all = new Set<string>()
  for (const v of Object.values(r.primary)) {
    if (v) all.add(v)
  }
  for (const arr of Object.values(r.aliases)) {
    if (arr) for (const a of arr) all.add(a)
  }
  return Array.from(all)
}

export interface SearchOptions {
  lang?: LangCode
  limit?: number
  includeAliases?: boolean
}

/**
 * 按前缀简单匹配主名（默认）+ 别名（可选）。仅做 startsWith 字典匹配。
 */
export function searchByPrefix(prefix: string, options: SearchOptions = {}): IocSpecies[] {
  const lang = options.lang ?? 'zh_CN'
  const limit = options.limit ?? 20
  const includeAliases = options.includeAliases ?? true
  if (!prefix) return []

  const p = prefix.trim()
  const results: IocSpecies[] = []
  const seen = new Set<string>()

  for (const sp of IOC_SPECIES) {
    const ns = sp.names[lang]
    if (!ns) continue
    if (ns.primary?.startsWith(p) || (includeAliases && ns.aliases?.some(a => a.startsWith(p)))) {
      if (!seen.has(sp.latin)) {
        seen.add(sp.latin)
        results.push(sp)
        if (results.length >= limit) break
      }
    }
  }
  return results
}

/**
 * 列出当前库覆盖了哪些语言（每个语言至少有一个物种填了主名）。
 */
export function listSupportedLanguages(): LangCode[] {
  const langs = new Set<LangCode>()
  for (const sp of IOC_SPECIES) {
    for (const lang of Object.keys(sp.names)) {
      if (sp.names[lang]?.primary) langs.add(lang)
    }
  }
  return Array.from(langs).sort()
}

/**
 * 各语言的覆盖率统计（含主名的物种数 / 总物种数）。
 */
export function getCoverageStats(): Record<LangCode, { primary: number; aliases: number }> {
  const stats: Record<string, { primary: number; aliases: number }> = {}
  for (const sp of IOC_SPECIES) {
    for (const [lang, ns] of Object.entries(sp.names)) {
      if (!ns) continue
      stats[lang] ||= { primary: 0, aliases: 0 }
      if (ns.primary) stats[lang]!.primary++
      if (ns.aliases?.length) stats[lang]!.aliases++
    }
  }
  return stats
}
