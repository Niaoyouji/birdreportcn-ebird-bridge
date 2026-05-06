# 名录对齐方法论 / Alignment Methodology

> 本文档解释 Chinese-bird-name-bridge 如何在多个华语圈鸟名系统与国际分类系统之间建立映射，以及背后的设计决策。

## 1. 涉及的命名系统

| 系统 | 维护方 | 主要特征 | 在本库中的代号 |
|------|--------|----------|-----------------|
| **IOC World Bird List** | International Ornithological Committee | 国际中立、年度更新、广泛用于学术 | `latin` 字段 |
| **Clements Checklist** | Cornell Lab of Ornithology | eBird/iNaturalist 内部使用，每年 10 月更新 | 通过 `ebird-clements-overrides.json` 18 条修正 |
| **郑光美《中国鸟类分类与分布名录》第 4 版** | 中国动物学会鸟类学分会 / 科学出版社 | 中文圈大陆权威，BirdReportCN 直接采用 | `names.zh_CN.primary` |
| **中華民國野鳥學會 (CWBF) 名錄** | CWBF | 台湾本地权威 | `names.zh_TW.primary`（P2 填充） |
| **Avibase** | Bird Studies Canada | 全球综合，含多语言别名 | 上游数据源 |
| **eBird zh_CN 显示名** | Cornell Lab | eBird 网站内的简中名 | `ebird-zh-overrides.json` |

## 2. 数据 Schema（v2 多语言形态）

每个物种以 IOC 拉丁二项式为主键，在 `names` 字段下按语言分组：

```json
{
  "latin": "Botaurus flavicollis",
  "names": {
    "zh_CN": { "primary": "黑苇鳽", "aliases": ["黑鳽"] },
    "zh_TW": { "primary": "黃頸黑鷺" },
    "en":    { "primary": "Black Bittern" }
  }
}
```

设计原则：
- **拉丁名是唯一稳定主键** —— IOC 二项式
- **每种语言独立 NameSet（primary + aliases）** —— 不同语言的"主名"互不依附
- **未填充的语言整个 omit** —— 不写空对象，保持文件紧凑

## 3. 为什么用 IOC 作枢纽？

- IOC 是**国际中立标准**，与任何"地方权威"都没有政治/学术主从关系
- IOC 二项式与 Clements **绝大多数一致**，差异表只需 ~18 条
- IOC 中文名经过别名扩充后与郑四高度兼容，与台湾名/香港名也能挂钩（通过 Avibase 别名层）
- IOC 每年更新，更贴近"当前科学共识"

```
zh_CN (郑四 + 鸟有记别名)
zh_TW (CWBF 体系，via Avibase)
zh_HK (港式繁中，via Avibase)
   ↘  ↓  ↙
        IOC 拉丁
   ↗   ↓   ↘
en (IOC)    Clements (差异 18 条)    eBird zh_CN 显示名 (差异 155 条)
```

## 4. 别名兜底链

`lookupByName(query)` 的查找顺序：

1. 在所有语言的 `primary` 中精确匹配
2. 在所有语言的 `aliases` 中精确匹配（按物种顺序、首次命中获胜）
3. 失败返回 `null`

这意味着输入「黑鳽」（郑三别名）会经 `zh_CN.aliases` 命中「黑苇鳽」（郑四主名）。未来填充 `zh_TW.primary = "黃頸黑鷺"` 后，输入「黃頸黑鷺」也会命中同一物种。

## 5. 拉丁名拆分规则（导出 eBird CSV）

`resolveLatinParts(entry)` 处理多种边界情况：

| 输入 | 处理 |
|------|------|
| 标准二项式 `Genus species` | 应用 overrides 后输出 `genus` + `species` |
| 含亚种的三项式 | 保留前两段 |
| 杂交种 `Genus species × species` | genus/species 留空，让 eBird 走中文名匹配 |
| 斜杠种 `Genus species/species` | 同上 |
| 未定种 `Genus sp.` / `Genus cf. species` | 同上 |

## 6. 时长 (Duration) 计算

eBird 要求 `Duration (min)` 字段，1 ≤ duration ≤ 1440。

- 按本地自然日分组所有 entry timestamps
- 每天求 `max - min`
- 加总各天跨度
- clamp 到 [1, 1440]

跨日的连续记录如果直接 `max - min` 会算出几小时甚至几天，本算法剔除夜间间隔。

## 7. 省份代码

eBird CSV 的 `State/Province` 字段填两位省份代码（如 `BJ`），`Country Code` 字段填 `CN`。

`ebird-province-codes.json` 同时提供"全称"和"简称"两套键。

## 8. 更新策略

| 更新源 | 频率 | 处理方式 |
|--------|------|---------|
| eBird Clements | 每年 10 月 | 人工对照 18 条 overrides；发布 minor 版本 |
| IOC World Bird List | 年内多次 | 重大变更才同步；保持 schema 稳定 |
| 郑四再版（如未来出现郑五） | 不定期 | 把旧主名移入 `aliases`，新主名替换 `primary` |
| Avibase 多语言名 | 同步上游周期 | 增量补充 `zh_TW` / `zh_HK` 字段 |

## 9. 已知局限

- **不处理亚种级别的差异**：到种级别即可，亚种留给上层调用方
- **位置反向解析**：本库不提供坐标→省份解析
- **匹配策略**：本库提供精确名 / 别名 / 简单前缀匹配；不包含拼音/语音/模糊语义匹配
- **数据完整性依赖人工维护**：欢迎社区 PR 补正

## 10. 路线图

| 阶段 | 内容 |
|------|------|
| **P1（已完成）** | 多语言 schema + name-bridge 高阶 API + 双向格式转换 |
| **P2** | 引入 Avibase 数据源，填充 `zh_TW` / `zh_HK` 字段 |
| **P3** | 鸟有记小程序反向接入 `zh_TW` 别名，支持台湾用户语音/文本输入 |
| **P4** | npm publish + 社区宣发（Show HN / r/birding / 朱雀会 / 台湾鸟会） |

---

最后更新：2026-05-06
