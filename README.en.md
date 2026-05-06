# Chinese Bird Name Bridge

[![npm](https://img.shields.io/npm/v/@niaoyouji/chinese-bird-name-bridge.svg)](https://www.npmjs.com/package/@niaoyouji/chinese-bird-name-bridge)
[![Code License: MIT](https://img.shields.io/badge/code-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Data License: CC BY-NC 4.0](https://img.shields.io/badge/data-CC%20BY--NC%204.0-blue.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

A multilingual alignment dataset and query library for Chinese bird names — Simplified Chinese / Traditional Chinese (Taiwan, Hong Kong) / English / Latin (IOC, Clements). Includes observation data format conversion utilities as a side feature.

This library is a byproduct of building the [Niaoyouji 鸟有记](https://github.com/Niaoyouji) mini-app, open-sourced as a contribution to the Chinese-speaking birding community.

[中文 README](https://github.com/Niaoyouji/Chinese-bird-name-bridge/blob/main/README.md) · English

---

## Installation

```bash
npm install @niaoyouji/chinese-bird-name-bridge
```

> Currently `0.1.0-alpha.3`. API not yet stable.

## Quick Start

```ts
import {
  resolveName,
  getZheng4Name,
  getTaiwanName,
  getEnglishName,
  getLatinName
} from '@niaoyouji/chinese-bird-name-bridge'

// All languages in one call
resolveName('黑鳽')
// {
//   ioc:      { latin: 'Botaurus flavicollis' },
//   clements: { latin: 'Botaurus flavicollis' },
//   primary:  { zh_CN: '黑苇鳽', en: 'Black Bittern' },
//   aliases:  { zh_CN: ['黑鳽'] }
// }

// Direction helpers (input can be any language or alias)
getTaiwanName('仙八色鸫')   // → '八色鳥'
getZheng4Name('八色鳥')      // → '仙八色鸫'
getEnglishName('黑苇鳽')     // → 'Black Bittern'
getLatinName('黑苇鳽')       // → 'Botaurus flavicollis'
```

## Data Coverage

1508 IOC bird species (centered on Mainland China commons).

| Language | Primary | Aliases | Source |
|----------|---------|---------|--------|
| `zh_CN` | 1508 (100%) | 156 | IOC + Niaoyouji (Zheng4-compatible) |
| `zh_TW` | 1239 (82%) | 311 | Wikidata (CC0) |
| `zh_HK` | 544 (36%) | — | Wikidata (CC0) |
| `en` | 1508 (100%) | — | IOC |
| `ja` | 1346 (89%) | — | Wikidata (CC0) |
| `ko` | 498 (33%) | — | Wikidata (CC0) |

For 962 species the Taiwan name differs substantively from the Mainland name (not just Simplified-to-Traditional transliteration). For example:

- 仙八色鸫 / **八色鳥** (Pitta nympha)
- 斑嘴鸭 / **花嘴鴨** (Anas zonorhyncha)
- 普通海鸥 / **歐亞海鷗** (Larus canus)

## Data Schema

```json
{
  "latin": "Pitta nympha",
  "wikidata_qid": "Q731573",
  "names": {
    "zh_CN": { "primary": "仙八色鸫" },
    "zh_TW": { "primary": "八色鳥" },
    "zh_HK": { "primary": "仙八色鶇" },
    "en":    { "primary": "Fairy Pitta" },
    "ja":    { "primary": "ヤイロチョウ" },
    "ko":    { "primary": "팔색조" }
  }
}
```

Main data files:

- `data/ioc-species-db.json` — multilingual master table
- `data/ebird-clements-overrides.json` — IOC → Clements binomial diffs (18 entries)
- `data/ebird-zh-overrides.json` — eBird's own zh_CN display names (155 entries)
- `data/ebird-province-codes.json` — Chinese province → eBird state codes

## Side Feature: Observation Format Conversion

The Niaoyouji mini-app supports converting observation data between eBird and BirdReportCN (中国观鸟记录中心). The methods are extracted here for independent use:

| API | Purpose |
|-----|---------|
| `convertBirdReportCNToEbird(buffer)` | BirdReportCN XLSX → eBird CSV |
| `convertEbirdToBirdReportCN(csv)` | eBird CSV → BirdReportCN XLSX |
| `generateEbirdCSV(sessions)` / `parseEbirdCSV(csv)` | session array ↔ eBird CSV |
| `generateBirdReportCNXlsx(sessions)` / `parseBirdReportCNXlsx(buffer)` | session array ↔ BirdReportCN XLSX |

## License

- **Code**: MIT — see [`LICENSE`](https://github.com/Niaoyouji/Chinese-bird-name-bridge/blob/main/LICENSE)
- **Data**: CC BY-NC 4.0 — see [`LICENSE-DATA`](https://github.com/Niaoyouji/Chinese-bird-name-bridge/blob/main/LICENSE-DATA)
  - Free for personal, academic, and non-commercial open-source use
  - Commercial redistribution of the data requires a separate license

## Acknowledgements

- IOC World Bird List — https://www.worldbirdnames.org/
- Wikidata (multilingual upstream) — https://www.wikidata.org/
- Clements Checklist — Cornell Lab of Ornithology
- *A Checklist on the Classification and Distribution of the Birds of China*, 4th Edition (Zheng Guangmei et al., Science Press)
- Chinese Wild Bird Federation (CWBF) — https://www.bird.org.tw/
- BirdReportCN 中国观鸟记录中心 — http://www.birdreport.cn/

## Contributing

PRs welcome for:

1. Annual eBird/Clements taxonomy update corrections
2. Filling historical Chinese aliases (older Zheng editions, regional variants)
3. Filling zh_HK primary names (currently 36%)
4. Fixing the 11 unmatched species (taxonomic shifts)

Please read [`docs/mapping-methodology.md`](https://github.com/Niaoyouji/Chinese-bird-name-bridge/blob/main/docs/mapping-methodology.md) before contributing.

---

Maintained by [Niaoyouji 鸟有记](https://github.com/Niaoyouji).
