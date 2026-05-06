# Chinese Bird Name Bridge

中文鸟名多语言对齐数据集与查询工具。提供简体中文 / 繁体中文（台湾、香港）/ 英文 / 拉丁名（IOC、Clements）的双向映射，附带观察数据格式转换工具。

本库是 [鸟有记 / Niaoyouji](https://github.com/Niaoyouji) 小程序开发过程中沉淀下来的产物，开源出来希望对中文观鸟社区做点贡献。

中文 README · [English README](./README.en.md)

---

## 安装

```bash
npm install @niaoyouji/chinese-bird-name-bridge
```

> 当前 `0.1.0-alpha.3`，API 尚未稳定。

## 快速使用

```ts
import {
  resolveName,
  getZheng4Name,
  getTaiwanName,
  getEnglishName,
  getLatinName
} from '@niaoyouji/chinese-bird-name-bridge'

// 一次拿全所有语言
resolveName('黑鳽')
// {
//   ioc:      { latin: 'Botaurus flavicollis' },
//   clements: { latin: 'Botaurus flavicollis' },
//   primary:  { zh_CN: '黑苇鳽', en: 'Black Bittern' },
//   aliases:  { zh_CN: ['黑鳽'] }
// }

// 单方向查询（输入支持任意语言/别名）
getTaiwanName('仙八色鸫')   // → '八色鳥'
getZheng4Name('八色鳥')      // → '仙八色鸫'
getEnglishName('黑苇鳽')     // → 'Black Bittern'
getLatinName('黑苇鳽')       // → 'Botaurus flavicollis'
```

## 数据覆盖

1508 个 IOC 鸟种（以中国大陆常见种为主）。

| 语言 | 主名覆盖 | 别名 | 来源 |
|------|---------|------|------|
| `zh_CN` | 1508 (100%) | 156 | IOC + 鸟有记整理（郑四兼容） |
| `zh_TW` | 1239 (82%) | 311 | Wikidata（CC0） |
| `zh_HK` | 544 (36%) | — | Wikidata（CC0） |
| `en` | 1508 (100%) | — | IOC |
| `ja` | 1346 (89%) | — | Wikidata（CC0） |
| `ko` | 498 (33%) | — | Wikidata（CC0） |

其中 962 个物种的台湾名与简中实质性不同（不是简单繁简转换），例如：

- 仙八色鸫 / **八色鳥**
- 斑嘴鸭 / **花嘴鴨**
- 普通海鸥 / **歐亞海鷗**

## 数据 schema

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

主要数据文件：

- `data/ioc-species-db.json` — 多语言鸟名总表
- `data/ebird-clements-overrides.json` — IOC → Clements 拉丁差异（18 条）
- `data/ebird-zh-overrides.json` — eBird 网站简中显示名（155 条）
- `data/ebird-province-codes.json` — 中国省级 → eBird 省份代码

## 附加工具：观察数据格式互转

鸟有记小程序支持在 eBird 与中国观鸟记录中心（BirdReportCN）之间互转观察数据。本库把其中的关键方法抽出，方便有需要的用户独立使用：

| API | 用途 |
|-----|------|
| `convertBirdReportCNToEbird(buffer)` | BirdReportCN XLSX → eBird CSV |
| `convertEbirdToBirdReportCN(csv)` | eBird CSV → BirdReportCN XLSX |
| `generateEbirdCSV(sessions)` / `parseEbirdCSV(csv)` | session 数组 ↔ eBird CSV |
| `generateBirdReportCNXlsx(sessions)` / `parseBirdReportCNXlsx(buffer)` | session 数组 ↔ BirdReportCN XLSX |

## 协议

- **代码**：MIT — 见 [`LICENSE`](./LICENSE)
- **数据**：CC BY-NC 4.0 — 见 [`LICENSE-DATA`](./LICENSE-DATA)
  - 个人 / 学术 / 非商业开源使用免费
  - 商业产品再分发数据请联系作者

## 致谢

- IOC World Bird List — https://www.worldbirdnames.org/
- Wikidata（多语言名上游）— https://www.wikidata.org/
- Clements Checklist — Cornell Lab of Ornithology
- 《中国鸟类分类与分布名录》第 4 版（郑光美 等编，科学出版社）
- 中華民國野鳥學會（CWBF）— https://www.bird.org.tw/
- BirdReportCN 中国观鸟记录中心 — http://www.birdreport.cn/

## 贡献

欢迎以 PR 形式贡献：

1. 修正分类系统差异（eBird Clements 每年 10 月更新）
2. 补全历史中文别名（郑三、华版、台版、地方名）
3. 补充 zh_HK 主名（当前覆盖率 36%）
4. 修正未匹配的 11 个分类异动种

提交前请阅读 [`docs/mapping-methodology.md`](./docs/mapping-methodology.md)。

---

Maintained by [Niaoyouji 鸟有记](https://github.com/Niaoyouji).
