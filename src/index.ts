export type {
  BirdEntry,
  BirdSession,
  IocSpecies,
  IocSpeciesNames,
  IocSpeciesDb,
  NameSet,
  LangCode,
  MappingDataFile,
  EbirdRow
} from './types.js'

export {
  IOC_SPECIES,
  CLEMENTS_OVERRIDES,
  ZH_OVERRIDES,
  PROVINCE_CODES,
  META
} from './data.js'

export {
  lookupByName,
  lookupByChinese,
  lookupByLatin,
  clementsToIocBinomial,
  getPrimaryName,
  getAliases
} from './mapping/species-lookup.js'
export { resolveLatinParts, type ResolvedLatin } from './mapping/resolve-latin.js'

export {
  resolveName,
  batchResolve,
  getSimplifiedChineseName,
  getZheng4Name,
  getTaiwanName,
  getHongKongName,
  getEnglishName,
  getLatinName,
  getEbirdChineseName,
  getClementsBinomial,
  listAliases,
  listAllNames,
  searchByPrefix,
  listSupportedLanguages,
  getCoverageStats,
  type ResolvedName,
  type SearchOptions
} from './name-bridge.js'

export { csvEscape, rowsToCSV, parseCSV } from './utils/csv.js'
export { calculateDuration } from './utils/duration.js'
export { buildLocationName } from './utils/location.js'
export { getProvinceCode } from './utils/province.js'
export {
  formatEbirdDate,
  formatEbirdTime,
  parseEbirdDate,
  parseEbirdTime,
  excelSerialToDate
} from './utils/date.js'

export {
  generateEbirdCSV,
  EBIRD_HEADERS,
  type GenerateEbirdCSVOptions
} from './converters/to-ebird-csv.js'
export {
  generateBirdReportCNXlsx,
  generateBirdReportCNData,
  BIRDREPORTCN_HEADERS
} from './converters/to-birdreportcn-xlsx.js'

export {
  parseBirdReportCNXlsx,
  type ParseBirdReportCNResult
} from './parsers/parse-birdreportcn-xlsx.js'
export {
  parseEbirdCSV,
  type ParseEbirdCSVResult
} from './parsers/parse-ebird-csv.js'

export {
  convertBirdReportCNToEbird,
  type BirdReportCNToEbirdOptions,
  type BirdReportCNToEbirdResult
} from './converters/birdreportcn-to-ebird.js'
export {
  convertEbirdToBirdReportCN,
  type EbirdToBirdReportCNResult
} from './converters/ebird-to-birdreportcn.js'

export const VERSION = '0.1.0-alpha.3'
