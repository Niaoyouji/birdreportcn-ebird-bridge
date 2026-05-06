#!/usr/bin/env node
/**
 * 从 Wikidata SPARQL 端点拉取 IOC 鸟种的多语言名称（含 zh-tw / zh-hk / zh-hant）。
 *
 * - 输入：data/ioc-species-db.json (拉丁名)
 * - 输出：scripts/wikidata-snapshot.json (raw)
 * - 数据 license：Wikidata 是 CC0，可直接合并入 CC BY-NC 4.0 数据集
 *
 * 用法：node scripts/fetch-wikidata.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')

const BATCH_SIZE = 100
const BATCH_DELAY_MS = 1500
const ENDPOINT = 'https://query.wikidata.org/sparql'
const USER_AGENT = 'chinese-bird-name-bridge/0.1 (https://github.com/Niaoyouji/Chinese-bird-name-bridge)'

function buildQuery(binomials) {
  const values = binomials.map(b => `"${b.replace(/"/g, '\\"')}"`).join(' ')
  return `SELECT ?binom ?taxon
  (SAMPLE(?en_)      AS ?en)
  (SAMPLE(?zh_)      AS ?zh)
  (SAMPLE(?zh_hans_) AS ?zh_hans)
  (SAMPLE(?zh_hant_) AS ?zh_hant)
  (SAMPLE(?zh_cn_)   AS ?zh_cn)
  (SAMPLE(?zh_tw_)   AS ?zh_tw)
  (SAMPLE(?zh_hk_)   AS ?zh_hk)
  (SAMPLE(?ja_)      AS ?ja)
  (SAMPLE(?ko_)      AS ?ko)
  (GROUP_CONCAT(DISTINCT ?alt_zh_tw; separator="|") AS ?zh_tw_alts)
  (GROUP_CONCAT(DISTINCT ?alt_zh_hk; separator="|") AS ?zh_hk_alts)
  (GROUP_CONCAT(DISTINCT ?alt_zh_hant; separator="|") AS ?zh_hant_alts)
WHERE {
  VALUES ?binom { ${values} }
  ?taxon wdt:P225 ?binom .
  OPTIONAL { ?taxon rdfs:label ?en_      FILTER(LANG(?en_)      = "en") }
  OPTIONAL { ?taxon rdfs:label ?zh_      FILTER(LANG(?zh_)      = "zh") }
  OPTIONAL { ?taxon rdfs:label ?zh_hans_ FILTER(LANG(?zh_hans_) = "zh-hans") }
  OPTIONAL { ?taxon rdfs:label ?zh_hant_ FILTER(LANG(?zh_hant_) = "zh-hant") }
  OPTIONAL { ?taxon rdfs:label ?zh_cn_   FILTER(LANG(?zh_cn_)   = "zh-cn") }
  OPTIONAL { ?taxon rdfs:label ?zh_tw_   FILTER(LANG(?zh_tw_)   = "zh-tw") }
  OPTIONAL { ?taxon rdfs:label ?zh_hk_   FILTER(LANG(?zh_hk_)   = "zh-hk") }
  OPTIONAL { ?taxon rdfs:label ?ja_      FILTER(LANG(?ja_)      = "ja") }
  OPTIONAL { ?taxon rdfs:label ?ko_      FILTER(LANG(?ko_)      = "ko") }
  OPTIONAL { ?taxon skos:altLabel ?alt_zh_tw    FILTER(LANG(?alt_zh_tw)    = "zh-tw") }
  OPTIONAL { ?taxon skos:altLabel ?alt_zh_hk    FILTER(LANG(?alt_zh_hk)    = "zh-hk") }
  OPTIONAL { ?taxon skos:altLabel ?alt_zh_hant  FILTER(LANG(?alt_zh_hant)  = "zh-hant") }
}
GROUP BY ?binom ?taxon`
}

function runQuery(query, batchIndex) {
  const tmpFile = `/tmp/sparql-batch-${batchIndex}.txt`
  writeFileSync(tmpFile, query)
  const t0 = Date.now()
  const out = execFileSync('curl', [
    '-sG', ENDPOINT,
    '-H', 'Accept: application/sparql-results+json',
    '-H', `User-Agent: ${USER_AGENT}`,
    '--data-urlencode', `query@${tmpFile}`,
    '--max-time', '90'
  ], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 })
  const elapsed = Date.now() - t0
  return { json: JSON.parse(out), elapsedMs: elapsed }
}

function pickValue(binding, key) {
  return binding[key]?.value || null
}

function pickAltList(binding, key) {
  const v = binding[key]?.value
  if (!v) return []
  return v.split('|').map(s => s.trim()).filter(Boolean)
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  const db = JSON.parse(readFileSync(join(REPO_ROOT, 'data/ioc-species-db.json'), 'utf8'))
  const allBinomials = db.species.map(s => s.latin)
  console.log(`Total IOC binomials: ${allBinomials.length}`)
  console.log(`Batch size: ${BATCH_SIZE} | delay: ${BATCH_DELAY_MS}ms`)

  const results = {}
  const stats = {
    queried: 0,
    matched: 0,
    en: 0, zh: 0, zh_hans: 0, zh_hant: 0,
    zh_cn: 0, zh_tw: 0, zh_hk: 0,
    ja: 0, ko: 0,
    zh_tw_alts: 0, zh_hk_alts: 0, zh_hant_alts: 0
  }

  const batches = []
  for (let i = 0; i < allBinomials.length; i += BATCH_SIZE) {
    batches.push(allBinomials.slice(i, i + BATCH_SIZE))
  }

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const query = buildQuery(batch)
    process.stdout.write(`[${i + 1}/${batches.length}] querying ${batch.length} binomials... `)
    let queryResult
    try {
      queryResult = runQuery(query, i)
    } catch (err) {
      console.log('FAIL:', err.message)
      continue
    }
    const rows = queryResult.json.results.bindings
    console.log(`HTTP OK | ${rows.length} rows | ${queryResult.elapsedMs}ms`)
    stats.queried += batch.length
    for (const r of rows) {
      const binom = r.binom.value
      results[binom] = {
        wikidata_qid: r.taxon.value.split('/').pop(),
        en: pickValue(r, 'en'),
        zh: pickValue(r, 'zh'),
        zh_hans: pickValue(r, 'zh_hans'),
        zh_hant: pickValue(r, 'zh_hant'),
        zh_cn: pickValue(r, 'zh_cn'),
        zh_tw: pickValue(r, 'zh_tw'),
        zh_hk: pickValue(r, 'zh_hk'),
        ja: pickValue(r, 'ja'),
        ko: pickValue(r, 'ko'),
        zh_tw_alts: pickAltList(r, 'zh_tw_alts'),
        zh_hk_alts: pickAltList(r, 'zh_hk_alts'),
        zh_hant_alts: pickAltList(r, 'zh_hant_alts')
      }
      stats.matched++
      for (const k of ['en', 'zh', 'zh_hans', 'zh_hant', 'zh_cn', 'zh_tw', 'zh_hk', 'ja', 'ko']) {
        if (results[binom][k]) stats[k]++
      }
      for (const k of ['zh_tw_alts', 'zh_hk_alts', 'zh_hant_alts']) {
        if (results[binom][k].length) stats[k]++
      }
    }
    if (i < batches.length - 1) await sleep(BATCH_DELAY_MS)
  }

  const snapshotPath = join(__dirname, 'wikidata-snapshot.json')
  writeFileSync(snapshotPath, JSON.stringify({
    fetched_at: new Date().toISOString(),
    source: 'Wikidata SPARQL (CC0)',
    endpoint: ENDPOINT,
    total_queried: allBinomials.length,
    total_matched: Object.keys(results).length,
    stats,
    species: results
  }, null, 2))

  console.log('\n=== SUMMARY ===')
  console.log(`Queried: ${stats.queried} / Matched: ${stats.matched} (${(100 * stats.matched / stats.queried).toFixed(1)}%)`)
  console.log('Coverage (matched only):')
  for (const k of ['en', 'zh', 'zh_hans', 'zh_hant', 'zh_cn', 'zh_tw', 'zh_hk', 'ja', 'ko', 'zh_tw_alts', 'zh_hk_alts', 'zh_hant_alts']) {
    const pct = stats.matched > 0 ? (100 * stats[k] / stats.matched).toFixed(1) : '0.0'
    console.log(`  ${k.padEnd(15)} ${String(stats[k]).padStart(5)} / ${stats.matched}  (${pct}%)`)
  }
  console.log(`\nSnapshot written: ${snapshotPath}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
