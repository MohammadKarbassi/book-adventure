#!/usr/bin/env node
// Builds two static data files for the site:
//   data/podcasts.json      Persian podcasts (iTunes directory + public RSS feeds)
//   data/audio-samples.json Free, legally usable audio for the audiobook player
//                           (Internet Archive / LibriVox, CC or public domain)
//
// Usage:
//   node scripts/fetch-podcasts.mjs            fetch the curated allowlists, write JSON
//   node scripts/fetch-podcasts.mjs --explore  print search candidates, write nothing
//
// Uses only Node 22 built-ins (fetch, crypto). RSS is parsed with plain regex.

import { createHash } from "node:crypto"
import { writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const UA = "BookAdventure-bootcamp/1.0 (educational project)"
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const PODCASTS_OUT = path.join(ROOT, "data", "podcasts.json")
const SAMPLES_OUT = path.join(ROOT, "data", "audio-samples.json")

const EPISODES_PER_PODCAST = 5
const MAX_PODCASTS = 10
const DESCRIPTION_MAX = 300

// Search terms used in --explore mode to find candidates.
const SEARCH_TERMS = [
  "پادکست",
  "رادیو",
  "کتاب",
  "داستان",
  "فارسی",
  "رادیو راه",
  "چنل بی",
  "بپرس",
  "رخ",
  "رادیو مرز",
  "پادکست فارسی کتاب",
  "کتاب صوتی",
  "قصه",
  "شعر",
  "تاریخ",
]

// iTunes collectionIds picked after exploring (in display order), with
// optional cleaner Persian title/author/description for the UI. Extra entries are
// fallbacks in case a feed fails; at most MAX_PODCASTS are kept.
const PODCAST_ALLOWLIST = [
  { collectionId: 1564548541 }, // پادکست رخ (History)
  { collectionId: 1496988806 }, // رادیو راه با مجتبی شکوری (Education)
  { collectionId: 1070642732, title: "چنل بی" }, // ChannelB (Documentary)
  { collectionId: 1412116121, title: "رادیو مرز" }, // Radio Marz (Documentary)
  { collectionId: 1473720110 }, // پادکست سه نقطه (Books)
  { collectionId: 1589248014 }, // پادکست قصه گو (Books)
  { collectionId: 1815965250 }, // پادکست فارسی داستان های کهن (Fiction)
  {
    collectionId: 1773720229,
    title: "هزار و یک داستان",
    // The feed's description is English; this is a translation of it.
    description:
      "پادکستی برای آوردن کتاب‌های گوناگون به گوش فارسی‌زبانان؛ در هر قسمت بخشی از یک اثر معاصر یا کلاسیک، از داستان تا غیرداستان و خودیاری، خوانده می‌شود.",
  }, // Hezar v yek dastan (Books)
  {
    collectionId: 1624329226,
    title: "پادکست جعبه",
    author: "منصور ضابطیان",
  }, // Jabe (Books)
  { collectionId: 1762587083 }, // قصه های نلی (Fiction)
  { collectionId: 1527853028 }, // نقاشی خیال با شعر (Books) - fallback
  { collectionId: 1702545886 }, // عبور از تاریخ (History) - fallback
]

// Host boilerplate appended to every description by some feeds.
const BOILERPLATE = [
  /Hosted on Acast\. See acast\.com\/privacy for more information\./gi,
]

const IA_QUERIES = [
  "mediatype:audio AND (language:per OR language:fas OR language:Persian) AND licenseurl:*creativecommons*",
  "mediatype:audio AND (language:per OR language:fas OR language:Persian) AND licenseurl:*publicdomain*",
  "collection:librivoxaudio AND (title:rubaiyat OR title:hafiz OR title:rumi OR title:persian)",
]

// Internet Archive files picked after exploring. Only items where the
// uploader is the reader/publisher and the text itself is public domain or
// the reading is released under CC by its author.
const SAMPLE_ALLOWLIST = [
  {
    id: "hezar-o-yek-shab-aghaz",
    identifier: "hezaroiekshab",
    file: "0000_aghaze_dastan_1001Shab_podcast.mp3",
  },
  {
    id: "hezar-o-yek-shab-1",
    identifier: "hezaroiekshab",
    file: "0001_1001Shab.mp3",
  },
  {
    id: "hezar-o-yek-shab-2",
    identifier: "hezaroiekshab",
    file: "0002_1001Shab.mp3",
  },
  {
    id: "farsi-readings-1",
    identifier: "FarsiReadings",
    file: "001_15.09.08_FarsiReadings.mp3",
  },
  {
    id: "farsi-readings-9",
    identifier: "FarsiReadings",
    file: "009_15.09.28_FarsiReadings.mp3",
  },
  {
    id: "masnavi-1",
    identifier: "masnairumiaudio",
    file: "masnawi-part01.mp3",
    title: "مثنوی معنوی مولانا - بخش ۱",
  },
]

// ---------------------------------------------------------------- helpers

async function request(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": UA, ...init.headers },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  })
  return res
}

async function getJson(url) {
  const res = await request(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

async function getText(url) {
  const res = await request(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.text()
}

const shortHash = (value) =>
  createHash("sha1").update(value).digest("hex").slice(0, 10)

const ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  zwnj: "‌",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  ndash: "–",
  mdash: "—",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
}

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === "#") {
      const n =
        code[1].toLowerCase() === "x"
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : match
    }
    return ENTITIES[code.toLowerCase()] ?? match
  })
}

function unwrapCdata(text) {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
}

/** HTML/XML fragment -> plain text on one line. */
function toPlainText(html) {
  if (!html) return ""
  let text = decodeEntities(unwrapCdata(html))
  // Feeds often double-encode HTML, so strip tags after decoding.
  text = text
    .replace(/<\/?(br|p|div|li|ul|ol|h\d)\b[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
  text = decodeEntities(text)
  for (const pattern of BOILERPLATE) text = text.replace(pattern, "")
  return text.replace(/\s+/g, " ").trim()
}

function truncate(text, max = DESCRIPTION_MAX) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Inner content of the first <tag>…</tag> (tag may include a namespace). */
function tagContent(xml, tag) {
  const t = escapeRegExp(tag)
  const match = xml.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)</${t}>`))
  return match ? unwrapCdata(match[1]).trim() : ""
}

function tagAttribute(xml, tag, attribute) {
  const t = escapeRegExp(tag)
  const tagMatch = xml.match(new RegExp(`<${t}\\s[^>]*>`))
  if (!tagMatch) return ""
  const attr = tagMatch[0].match(
    new RegExp(`\\s${escapeRegExp(attribute)}\\s*=\\s*(["'])(.*?)\\1`)
  )
  return attr ? decodeEntities(attr[2]).trim() : ""
}

/** "1:02:03", "62:03", "3723" -> seconds. */
function parseDuration(value) {
  if (value === undefined || value === null || value === "") return null
  const text = String(value).trim()
  if (/^\d+(\.\d+)?$/.test(text)) return Math.round(Number(text))
  const parts = text.split(":").map(Number)
  if (parts.length < 2 || parts.length > 3 || parts.some(Number.isNaN)) {
    return null
  }
  return Math.round(parts.reduce((total, part) => total * 60 + part, 0))
}

function toIso(dateText) {
  const date = new Date(dateText)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/**
 * Checks that a URL serves audio, using a tiny ranged GET (some hosts reject
 * HEAD). Follows redirects (podcast hosts often use tracking redirects).
 */
async function checkAudio(url) {
  try {
    const res = await request(url, { headers: { Range: "bytes=0-1023" } })
    await res.body?.cancel()
    const type = res.headers.get("content-type") ?? ""
    const ok =
      (res.status === 200 || res.status === 206) &&
      /^(audio\/|application\/octet-stream)/i.test(type)
    return { ok, status: res.status, type }
  } catch (error) {
    return { ok: false, status: 0, type: String(error?.message ?? error) }
  }
}

const hasPersian = (text) => /[؀-ۿ]/.test(text)

// --------------------------------------------------------------- podcasts

function itunesSearchUrl(term) {
  const params = new URLSearchParams({
    media: "podcast",
    entity: "podcast",
    limit: "20",
    term,
    country: "US",
  })
  return `https://itunes.apple.com/search?${params}`
}

async function explorePodcasts() {
  const seen = new Map()
  for (const term of SEARCH_TERMS) {
    const { results } = await getJson(itunesSearchUrl(term))
    for (const r of results) {
      if (!seen.has(r.collectionId)) seen.set(r.collectionId, r)
    }
  }
  console.log("\n# Persian podcast candidates (iTunes search)")
  for (const r of seen.values()) {
    if (!hasPersian(r.collectionName ?? "")) continue
    console.log(
      [
        r.collectionId,
        r.collectionName,
        r.artistName,
        r.primaryGenreName,
        r.trackCount,
        r.releaseDate?.slice(0, 10),
        r.feedUrl,
      ].join(" | ")
    )
  }
}

function parseEpisodes(channelXml) {
  const items = channelXml.match(/<item[\s>][\s\S]*?<\/item>/g) ?? []
  const episodes = []
  for (const item of items) {
    const audioUrl = tagAttribute(item, "enclosure", "url")
    const audioType = tagAttribute(item, "enclosure", "type")
    if (!audioUrl) continue
    if (audioType && !audioType.startsWith("audio/")) continue
    const guid = tagContent(item, "guid") || audioUrl
    // HTML description first: some hosts flatten itunes:summary without
    // spaces between paragraphs.
    const description =
      tagContent(item, "description") ||
      tagContent(item, "content:encoded") ||
      tagContent(item, "itunes:summary")
    episodes.push({
      id: shortHash(guid),
      title: toPlainText(tagContent(item, "title")),
      publishedAt: toIso(toPlainText(tagContent(item, "pubDate"))),
      durationSeconds: parseDuration(
        toPlainText(tagContent(item, "itunes:duration"))
      ),
      audioUrl,
      description: truncate(toPlainText(description)),
    })
  }
  // Newest first; feeds are usually sorted already but not always.
  return episodes
    .filter((e) => e.title)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
}

async function buildPodcast(info, pick) {
  const xml = await getText(info.feedUrl)
  const channelHead = xml.split(/<item[\s>]/)[0]
  const episodes = parseEpisodes(xml).slice(0, EPISODES_PER_PODCAST)
  if (episodes.length === 0) throw new Error("no audio enclosures")

  const check = await checkAudio(episodes[0].audioUrl)
  if (!check.ok) {
    throw new Error(`audio check failed (${check.status} ${check.type})`)
  }

  const description =
    tagContent(channelHead, "description") ||
    tagContent(channelHead, "itunes:summary")
  return {
    id: String(info.collectionId),
    title: pick.title ?? info.collectionName.trim(),
    author: pick.author ?? info.artistName.trim(),
    artwork: info.artworkUrl600,
    genre: info.primaryGenreName,
    description: pick.description ?? truncate(toPlainText(description)),
    feedUrl: info.feedUrl,
    episodes,
  }
}

async function fetchPodcasts() {
  const params = new URLSearchParams({
    id: PODCAST_ALLOWLIST.map((pick) => pick.collectionId).join(","),
    entity: "podcast",
    country: "US",
  })
  const { results } = await getJson(`https://itunes.apple.com/lookup?${params}`)
  const byId = new Map(results.map((r) => [r.collectionId, r]))

  const podcasts = []
  for (const pick of PODCAST_ALLOWLIST) {
    if (podcasts.length >= MAX_PODCASTS) break
    const info = byId.get(pick.collectionId)
    if (!info?.feedUrl || !info.artworkUrl600) {
      console.warn(`skip ${pick.collectionId}: not on iTunes or no feed`)
      continue
    }
    try {
      const podcast = await buildPodcast(info, pick)
      podcasts.push(podcast)
      console.log(
        `ok   ${podcast.title} (${podcast.episodes.length} episodes, ${
          new URL(podcast.artwork).host
        })`
      )
    } catch (error) {
      console.warn(`skip ${info.collectionName}: ${error.message}`)
    }
  }
  return podcasts
}

// ---------------------------------------------------------- audio samples

function iaSearchUrl(query) {
  const params = new URLSearchParams({ q: query, rows: "50", output: "json" })
  for (const field of ["identifier", "title", "licenseurl", "language"]) {
    params.append("fl[]", field)
  }
  params.append("sort[]", "downloads desc")
  return `https://archive.org/advancedsearch.php?${params}`
}

async function exploreSamples() {
  for (const query of IA_QUERIES) {
    const { response } = await getJson(iaSearchUrl(query))
    console.log(`\n# ${query} (${response.numFound} found)`)
    for (const doc of response.docs) {
      console.log(
        [doc.identifier, doc.title, doc.licenseurl, doc.language].join(" | ")
      )
    }
  }
}

function licenseName(url) {
  const cc = url.match(/creativecommons\.org\/licenses\/([a-z-]+)\/([\d.]+)/i)
  if (cc) return `CC ${cc[1].toUpperCase()} ${cc[2]}`
  if (/publicdomain\/zero/i.test(url)) return "CC0 1.0 (Public Domain)"
  if (/publicdomain/i.test(url)) return "Public Domain"
  return url
}

const LANGUAGE_CODES = { per: "fa", fas: "fa", persian: "fa", farsi: "fa" }

function languageCode(value) {
  const first = Array.isArray(value) ? value[0] : value
  if (!first) return "und"
  return LANGUAGE_CODES[String(first).toLowerCase()] ?? String(first)
}

const asText = (value) => (Array.isArray(value) ? value.join("، ") : value)

async function fetchSamples() {
  const metadataCache = new Map()
  const samples = []
  for (const pick of SAMPLE_ALLOWLIST) {
    try {
      if (!metadataCache.has(pick.identifier)) {
        metadataCache.set(
          pick.identifier,
          await getJson(`https://archive.org/metadata/${pick.identifier}`)
        )
      }
      const { metadata, files } = metadataCache.get(pick.identifier)
      const file = files.find((f) => f.name === pick.file)
      if (!file) throw new Error(`file ${pick.file} not found`)
      const licenseUrl = asText(metadata.licenseurl) ?? ""
      if (!/creativecommons\.org/i.test(licenseUrl)) {
        throw new Error(`no CC/public-domain license (${licenseUrl})`)
      }

      const audioUrl = `https://archive.org/download/${encodeURIComponent(
        pick.identifier
      )}/${file.name.split("/").map(encodeURIComponent).join("/")}`
      const check = await checkAudio(audioUrl)
      if (!check.ok) {
        throw new Error(`audio check failed (${check.status} ${check.type})`)
      }

      const itemTitle = toPlainText(asText(metadata.title) ?? "")
      const fileTitle = file.title ? toPlainText(file.title) : ""
      samples.push({
        id: pick.id,
        title: pick.title ?? (fileTitle || itemTitle),
        language: languageCode(metadata.language),
        audioUrl,
        durationSeconds: parseDuration(file.length),
        license: licenseName(licenseUrl),
        licenseUrl,
        attribution: `${toPlainText(asText(metadata.creator) ?? "Unknown")} — «${itemTitle}», Internet Archive`,
        sourceUrl: `https://archive.org/details/${pick.identifier}`,
      })
      console.log(`ok   ${pick.id} (${check.type})`)
    } catch (error) {
      console.warn(`skip ${pick.id}: ${error.message}`)
    }
  }
  return samples
}

// ------------------------------------------------------------------- main

async function writeJson(file, data) {
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`)
  console.log(`wrote ${path.relative(ROOT, file)}`)
}

async function main() {
  if (process.argv.includes("--explore")) {
    await explorePodcasts()
    await exploreSamples()
    return
  }

  const generatedAt = new Date().toISOString()

  console.log("# podcasts")
  const podcasts = await fetchPodcasts()
  if (podcasts.length === 0) throw new Error("no podcasts fetched")
  await writeJson(PODCASTS_OUT, {
    generatedAt,
    source: "itunes-search + rss",
    podcasts,
  })

  console.log("\n# audio samples")
  const samples = await fetchSamples()
  if (samples.length === 0) throw new Error("no audio samples fetched")
  await writeJson(SAMPLES_OUT, { generatedAt, samples })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
