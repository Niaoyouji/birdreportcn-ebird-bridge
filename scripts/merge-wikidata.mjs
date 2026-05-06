#!/usr/bin/env node
/**
 * 把 Wikidata snapshot 合并入 ioc-species-db.json。
 *
 * 合并规则：
 * - 拉丁名为唯一主键
 * - zh_CN.primary 保持鸟有记原值不变（authoritative）
 * - zh_CN.aliases 增补：Wikidata 的 zh-cn 若与 primary 不同 → 加入 aliases（去重）
 * - zh_TW.primary：优先 WD zh-tw，否则 WD zh-hant
 * - zh_TW.aliases：WD zh_tw_alts (skos:altLabel) + zh-hant（若与 primary 不同）
 * - zh_HK.primary：WD zh-hk（不存在则不创建该条目）
 * - zh_HK.aliases：WD zh_hk_alts
 * - en.primary 保持鸟有记原值（IOC）
 * - 新增 ja.primary, ko.primary（来自 WD）
 * - species.wikidata_qid 作为元数据保存
 *
 * 用法：node scripts/merge-wikidata.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')

function dedupeAppend(existing, additions) {
  const set = new Set(existing || [])
  const out = [...(existing || [])]
  for (const a of additions) {
    if (!a) continue
    const t = a.trim()
    if (!t) continue
    if (!set.has(t)) {
      set.add(t)
      out.push(t)
    }
  }
  return out
}

function nameSetWith(primary, aliases) {
  if (!primary && (!aliases || aliases.length === 0)) return null
  const ns = { primary: primary || '' }
  const cleanedAliases = (aliases || []).filter(a => a && a.trim() && a !== primary)
  if (cleanedAliases.length) ns.aliases = cleanedAliases
  return ns
}

function main() {
  const dbPath = join(REPO_ROOT, 'data/ioc-species-db.json')
  const wdPath = join(REPO_ROOT, 'scripts/wikidata-snapshot.json')
  const db = JSON.parse(readFileSync(dbPath, 'utf8'))
  const wd = JSON.parse(readFileSync(wdPath, 'utf8'))

  const stats = {
    species_total: db.species.length,
    species_with_wd: 0,
    zh_CN_aliases_added: 0,
    zh_TW_added: 0,
    zh_TW_aliases_added: 0,
    zh_HK_added: 0,
    zh_HK_aliases_added: 0,
    ja_added: 0,
    ko_added: 0,
    qid_added: 0
  }

  for (const sp of db.species) {
    const w = wd.species[sp.latin]
    if (!w) continue
    stats.species_with_wd++

    if (w.wikidata_qid) {
      sp.wikidata_qid = w.wikidata_qid
      stats.qid_added++
    }

    // zh_CN: keep primary, augment aliases
    if (sp.names.zh_CN && w.zh_cn && w.zh_cn !== sp.names.zh_CN.primary) {
      const before = (sp.names.zh_CN.aliases || []).length
      sp.names.zh_CN.aliases = dedupeAppend(sp.names.zh_CN.aliases || [], [w.zh_cn])
      if ((sp.names.zh_CN.aliases || []).length > before) stats.zh_CN_aliases_added++
      if (sp.names.zh_CN.aliases.length === 0) delete sp.names.zh_CN.aliases
    }

    // zh_TW: prefer zh-tw, fallback zh-hant
    const twPrimary = w.zh_tw || w.zh_hant
    if (twPrimary) {
      const twAliasCands = []
      for (const a of w.zh_tw_alts) twAliasCands.push(a)
      for (const a of w.zh_hant_alts) twAliasCands.push(a)
      if (w.zh_hant && w.zh_hant !== twPrimary) twAliasCands.push(w.zh_hant)
      if (w.zh_tw && w.zh_tw !== twPrimary) twAliasCands.push(w.zh_tw)
      const ns = nameSetWith(twPrimary, twAliasCands)
      if (ns) {
        sp.names.zh_TW = ns
        stats.zh_TW_added++
        if (ns.aliases?.length) stats.zh_TW_aliases_added++
      }
    }

    // zh_HK
    if (w.zh_hk) {
      const ns = nameSetWith(w.zh_hk, w.zh_hk_alts)
      sp.names.zh_HK = ns
      stats.zh_HK_added++
      if (ns?.aliases?.length) stats.zh_HK_aliases_added++
    }

    // ja, ko
    if (w.ja) {
      sp.names.ja = { primary: w.ja }
      stats.ja_added++
    }
    if (w.ko) {
      sp.names.ko = { primary: w.ko }
      stats.ko_added++
    }
  }

  db.version = 'ioc-15.1+wikidata-2026-05-06'
  db.schema = '2.1'
  db.source = '基于 IOC World Bird List + 鸟有记整理 + Wikidata SPARQL（CC0）多语言扩展'
  db.supported_languages = {
    zh_CN: '简体中文（兼容郑四第 4 版主名 + 鸟有记整理别名 + Wikidata 增补）',
    zh_TW: '繁体中文 / 台湾国语（来自 Wikidata zh-tw / zh-hant）',
    zh_HK: '繁体中文 / 香港用法（来自 Wikidata zh-hk）',
    en: 'IOC 英文名',
    ja: '日本語（来自 Wikidata ja）',
    ko: '한국어（来自 Wikidata ko）'
  }
  db.fields = {
    latin: 'IOC 拉丁学名（二项式或含亚种）',
    wikidata_qid: 'Wikidata 条目 QID（如 Q997448），用于交叉引用',
    names: '多语言名集合，键为 BCP47 风格语言代码',
    'names.<lang>.primary': '该语言下的当前推荐主名',
    'names.<lang>.aliases': '该语言下的别名数组（含历史名、地方名、改名前称呼）'
  }

  writeFileSync(dbPath, JSON.stringify(db, null, 2))

  console.log('=== MERGE COMPLETE ===')
  console.log(JSON.stringify(stats, null, 2))
  console.log(`\nWritten: ${dbPath}`)

  // Coverage report
  const cov = { zh_CN: 0, zh_TW: 0, zh_HK: 0, en: 0, ja: 0, ko: 0 }
  const aliasCov = { zh_CN: 0, zh_TW: 0, zh_HK: 0 }
  for (const sp of db.species) {
    for (const k of Object.keys(cov)) if (sp.names[k]?.primary) cov[k]++
    for (const k of Object.keys(aliasCov)) if (sp.names[k]?.aliases?.length) aliasCov[k]++
  }
  console.log('\n=== Final coverage ===')
  console.log('Primary names:')
  for (const [k, v] of Object.entries(cov)) {
    console.log(`  ${k.padEnd(8)} ${String(v).padStart(5)} / ${db.species.length}  (${(100*v/db.species.length).toFixed(1)}%)`)
  }
  console.log('Aliases:')
  for (const [k, v] of Object.entries(aliasCov)) {
    console.log(`  ${k.padEnd(8)} ${String(v).padStart(5)} species with ≥1 alias`)
  }
}

main()
