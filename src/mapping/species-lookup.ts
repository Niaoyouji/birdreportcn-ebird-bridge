import { IOC_SPECIES, CLEMENTS_OVERRIDES } from '../data.js'
import type { IocSpecies, LangCode } from '../types.js'

let _byName: Map<string, IocSpecies> | null = null
let _byLatin: Map<string, IocSpecies> | null = null
let _clementsToIoc: Map<string, string> | null = null

function buildIndexes(): void {
  if (_byName && _byLatin) return
  const byName = new Map<string, IocSpecies>()
  const byLatin = new Map<string, IocSpecies>()
  for (const sp of IOC_SPECIES) {
    if (sp.latin) byLatin.set(sp.latin, sp)
    for (const ns of Object.values(sp.names)) {
      if (!ns) continue
      if (ns.primary && !byName.has(ns.primary)) byName.set(ns.primary, sp)
      if (ns.aliases) {
        for (const a of ns.aliases) {
          if (a && !byName.has(a)) byName.set(a, sp)
        }
      }
    }
  }
  _byName = byName
  _byLatin = byLatin
}

function buildClementsReverseMap(): Map<string, string> {
  if (_clementsToIoc) return _clementsToIoc
  const m = new Map<string, string>()
  for (const [iocBin, clementsBin] of Object.entries(CLEMENTS_OVERRIDES)) {
    m.set(clementsBin, iocBin)
  }
  _clementsToIoc = m
  return m
}

export function lookupByName(name: string): IocSpecies | null {
  if (!name) return null
  buildIndexes()
  return _byName!.get(name.trim()) || null
}

export function lookupByLatin(latin: string): IocSpecies | null {
  if (!latin) return null
  buildIndexes()
  const trimmed = latin.trim()
  const binomial = trimmed.split(/\s+/).slice(0, 2).join(' ')
  return _byLatin!.get(binomial) || _byLatin!.get(trimmed) || null
}

export function lookupByChinese(name: string): IocSpecies | null {
  return lookupByName(name)
}

export function clementsToIocBinomial(clementsBinomial: string): string {
  const reverse = buildClementsReverseMap()
  return reverse.get(clementsBinomial.trim()) || clementsBinomial.trim()
}

export function getPrimaryName(sp: IocSpecies, lang: LangCode): string | null {
  return sp.names[lang]?.primary || null
}

export function getAliases(sp: IocSpecies, lang: LangCode): string[] {
  return sp.names[lang]?.aliases ? [...sp.names[lang]!.aliases!] : []
}
