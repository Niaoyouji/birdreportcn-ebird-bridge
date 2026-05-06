import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IocSpecies } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')

function loadJSON<T>(filename: string): T {
  return JSON.parse(readFileSync(join(dataDir, filename), 'utf8')) as T
}

const iocDbJson = loadJSON<{
  version: string
  species: IocSpecies[]
}>('ioc-species-db.json')

const clementsJson = loadJSON<{
  version: string
  mapping: Record<string, string>
}>('ebird-clements-overrides.json')

const zhJson = loadJSON<{
  version: string
  mapping: Record<string, string>
}>('ebird-zh-overrides.json')

const provinceJson = loadJSON<{
  version: string
  mapping: Record<string, string>
}>('ebird-province-codes.json')

export const IOC_SPECIES: IocSpecies[] = iocDbJson.species
export const CLEMENTS_OVERRIDES: Record<string, string> = clementsJson.mapping
export const ZH_OVERRIDES: Record<string, string> = zhJson.mapping
export const PROVINCE_CODES: Record<string, string> = provinceJson.mapping

export const META = {
  iocVersion: iocDbJson.version,
  clementsVersion: clementsJson.version,
  zhVersion: zhJson.version,
  provinceVersion: provinceJson.version
}
