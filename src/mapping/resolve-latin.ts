import { CLEMENTS_OVERRIDES } from '../data.js'
import { lookupByName } from './species-lookup.js'
import type { BirdEntry } from '../types.js'

export interface ResolvedLatin {
  iocBinomial: string
  genus: string
  species: string
}

export function resolveLatinParts(entry: BirdEntry): ResolvedLatin {
  let iocLatin = (entry.scientificName || '').trim()

  if (!iocLatin && entry.commonNameCN) {
    const sp = lookupByName(entry.commonNameCN)
    if (sp) iocLatin = sp.latin.trim()
  }

  const iocBinomial = iocLatin ? iocLatin.split(/\s+/).slice(0, 2).join(' ') : ''
  if (!iocLatin) return { iocBinomial: '', genus: '', species: '' }

  if (/[×\/(]|\bsp{1,2}\.|\bcf\./i.test(iocLatin)) {
    return { iocBinomial, genus: '', species: '' }
  }

  const ebirdLatin = CLEMENTS_OVERRIDES[iocBinomial] || iocBinomial
  const parts = ebirdLatin.split(/\s+/)
  if (parts.length < 2) return { iocBinomial, genus: '', species: '' }

  const genus = parts[0]!
  const species = parts[1]!
  if (!/^[A-Z][a-z]+$/.test(genus)) return { iocBinomial, genus: '', species: '' }
  if (!/^[a-z]+$/.test(species)) return { iocBinomial, genus: '', species: '' }

  return { iocBinomial, genus, species }
}
