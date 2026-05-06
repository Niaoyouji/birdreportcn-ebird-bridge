export type LangCode = 'zh_CN' | 'zh_TW' | 'zh_HK' | 'en' | string

export interface NameSet {
  primary: string
  aliases?: string[]
}

export interface IocSpeciesNames {
  zh_CN?: NameSet
  zh_TW?: NameSet
  zh_HK?: NameSet
  en?: NameSet
  [lang: string]: NameSet | undefined
}

export interface IocSpecies {
  latin: string
  names: IocSpeciesNames
}

export interface IocSpeciesDb {
  version: string
  schema: string
  source: string
  license: string
  fields: Record<string, string>
  supported_languages: Record<string, string>
  species: IocSpecies[]
}

export interface BirdEntry {
  speciesId?: string
  scientificName?: string
  commonNameCN?: string
  english?: string
  quantity: number
  notes?: string
  timestamp?: number
}

export interface BirdSession {
  id?: string
  name?: string
  timestamp: number
  latitude?: number
  longitude?: number
  province?: string
  city?: string
  district?: string
  specificLocation?: string
  customLocationName?: string
  notes?: string
  entries: BirdEntry[]
}

export interface MappingDataFile {
  version: string
  description: string
  license: string
  source?: string
  notes?: string[]
  mapping: Record<string, string>
}

export interface EbirdRow {
  commonName: string
  genus: string
  species: string
  number: number
  speciesComments: string
  locationName: string
  latitude: string
  longitude: string
  date: string
  startTime: string
  stateProvince: string
  countryCode: string
  protocol: string
  numberOfObservers: number
  duration: number
  allObservationsReported: 'Y' | 'N'
  effortDistanceMiles: string
  effortAreaAcres: string
  submissionComments: string
}
