// Pulls a Persian book catalog from the unofficial Fidibo MCP server
// (https://github.com/sepehr071/fidibo-mcp) and writes data/catalog.json.
// Run: npm run data:fidibo  (needs `uv` so that `uvx fidibo-mcp` works)

import { mkdir, readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from "@modelcontextprotocol/sdk/client/stdio.js"
import sharp from "sharp"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OUT_FILE = path.join(ROOT, "data", "catalog.json")
const COVER_CACHE_DIR = path.join(ROOT, ".cache", "covers")
const RESPONSE_CACHE_DIR = path.join(ROOT, ".cache", "fidibo")
// `--fresh` ignores cached fd_book / fd_reviews responses.
const FRESH = process.argv.includes("--fresh")

// Top-level ebook categories, in display order. Missing ones are skipped.
const WANTED_CATEGORIES = [
  "story-persian",
  "story-foreign",
  "psychology",
  "literature",
  "biography",
  "management",
  "philosophy",
  "history",
]
const EBOOKS_PER_CATEGORY = 8
const AUDIO_PER_CATEGORY = 4
const LIST_LIMIT = 12
const FREE_LIMIT = 8
const REVIEWS_PER_BOOK = 5
const REVIEW_MAX_CHARS = 400
const DESCRIPTION_MAX_CHARS = 1200
const DESCRIPTION_MAX_PARAGRAPHS = 4
const MAX_BLOCKED_ERRORS = 3
// Fidibo answers HTTP 429 after ~30 quick requests.
const CALL_GAP_MS = 2500
const RATE_LIMIT_WAIT_MS = 65_000
const MAX_RATE_LIMIT_RETRIES = 5

const BLOCKED_RE = /403|forbidden|captcha|bot[\s-]?check|challenge|blocked/i
const RATE_LIMIT_RE = /429|rate limit/i
const FALLBACK_COLOR = { dominant: "#5b4a3a", isDark: true }

// ---------------------------------------------------------------- MCP client

let blockedErrors = 0
let lastCallAt = 0

class BlockedError extends Error {}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function connect() {
  const env = getDefaultEnvironment()
  env.PATH = [path.join(homedir(), ".local", "bin"), env.PATH].join(
    path.delimiter
  )
  const transport = new StdioClientTransport({
    command: "uvx",
    args: ["fidibo-mcp"],
    env,
    stderr: "inherit",
  })
  const client = new Client({ name: "ebook-platform-fetch", version: "1.0.0" })
  await client.connect(transport)
  return client
}

/**
 * Calls one tool and returns its parsed JSON payload (throws on errors).
 * Calls are sequential and spaced out; HTTP 429 waits a minute and retries.
 * With `cache: true` the raw result is kept in .cache/fidibo/ for re-runs.
 */
async function call(client, name, args, { cache = false } = {}) {
  const cacheFile = path.join(
    RESPONSE_CACHE_DIR,
    `${name}-${Object.values(args).join("-")}.json`
  )
  if (cache && !FRESH) {
    const cached = await readFile(cacheFile, "utf8").catch(() => null)
    if (cached) return JSON.parse(cached)
  }

  for (let attempt = 1; ; attempt += 1) {
    await sleep(Math.max(0, lastCallAt + CALL_GAP_MS - Date.now()))
    lastCallAt = Date.now()
    try {
      const data = await callOnce(client, name, args)
      blockedErrors = 0
      if (cache) {
        await mkdir(RESPONSE_CACHE_DIR, { recursive: true })
        await writeFile(cacheFile, JSON.stringify(data))
      }
      return data
    } catch (error) {
      const message = String(error?.message ?? error)
      if (RATE_LIMIT_RE.test(message)) {
        if (attempt > MAX_RATE_LIMIT_RETRIES) {
          throw new BlockedError(
            `Fidibo keeps rate limiting (${attempt} attempts): ${message}`
          )
        }
        console.log(
          `  rate limited (429), waiting ${RATE_LIMIT_WAIT_MS / 1000}s`
        )
        await sleep(RATE_LIMIT_WAIT_MS)
        continue
      }
      if (BLOCKED_RE.test(message)) {
        blockedErrors += 1
        if (blockedErrors >= MAX_BLOCKED_ERRORS) {
          throw new BlockedError(
            `Fidibo seems to be blocking requests (${blockedErrors} bot-check/403 errors in a row): ${message}`
          )
        }
      }
      throw error
    }
  }
}

async function callOnce(client, name, args) {
  const result = await client.callTool({ name, arguments: args })
  const text = result.content?.[0]?.text ?? ""
  if (result.isError) throw new Error(text || "tool error")
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`non-JSON result from ${name}: ${text.slice(0, 200)}`)
  }
  if (data && typeof data === "object" && "error" in data && !data.books) {
    throw new Error(String(data.error))
  }
  return data
}

// ------------------------------------------------------------ cover colors

async function loadCover(book) {
  const file = path.join(COVER_CACHE_DIR, `${book.id}.img`)
  const cached = await readFile(file).catch(() => null)
  if (cached) return cached
  const response = await fetch(book.image, {
    headers: { "User-Agent": "ebook-platform-bootcamp (catalog script)" },
  })
  if (!response.ok) throw new Error(`cover HTTP ${response.status}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  await mkdir(COVER_CACHE_DIR, { recursive: true })
  await writeFile(file, buffer)
  return buffer
}

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h
  if (max === r / 255) h = ((g - b) / 255 / d) % 6
  else if (max === g / 255) h = (b - r) / 255 / d + 2
  else h = (r - g) / 255 / d + 4
  return { h: (h * 60 + 360) % 360, s, l }
}

const toHex = (rgb) =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`

/** WCAG relative luminance (0 = black, 1 = white). */
function luminance([r, g, b]) {
  const lin = (c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

const average = (pixels) =>
  [0, 1, 2].map(
    (channel) =>
      pixels.reduce((sum, pixel) => sum + pixel[channel], 0) / pixels.length
  )

/**
 * Representative cover color: 32x32 thumbnail, near-white/near-black pixels
 * ignored, the 30° hue bucket with the most saturation weight wins and its
 * pixels are averaged. Greyish covers fall back to the plain average.
 */
async function coverColor(book) {
  const { data } = await sharp(await loadCover(book))
    .resize(32, 32, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const pixels = []
  for (let i = 0; i < data.length; i += 3) {
    pixels.push([data[i], data[i + 1], data[i + 2]])
  }
  const midtones = pixels.filter((pixel) => {
    const { l } = rgbToHsl(...pixel)
    return l > 0.08 && l < 0.92
  })
  const buckets = new Map()
  for (const pixel of midtones) {
    const { h, s } = rgbToHsl(...pixel)
    if (s < 0.25) continue
    const key = Math.floor(h / 30)
    const bucket = buckets.get(key) ?? { weight: 0, pixels: [] }
    bucket.weight += s
    bucket.pixels.push(pixel)
    buckets.set(key, bucket)
  }
  const best = [...buckets.values()].sort((a, b) => b.weight - a.weight)[0]
  const rgb =
    best && best.pixels.length >= pixels.length * 0.05
      ? average(best.pixels)
      : average(midtones.length ? midtones : pixels)
  return { dominant: toHex(rgb), isDark: luminance(rgb) < 0.4 }
}

// ------------------------------------------------------------- normalizers

const splitNames = (value) =>
  typeof value === "string"
    ? value
        .split(/[،,]/)
        .map((name) => name.trim())
        .filter(Boolean)
    : []

const cleanMood = (mood) =>
  mood
    .replace(/\(\s*[\d۰-۹]+\s*\)/g, "")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s+/g, " ")
    .trim()

function parseDuration(value) {
  if (typeof value !== "string") return undefined
  const parts = value.split(":").map(Number)
  if (parts.some(Number.isNaN)) return undefined
  return parts.reduce((total, part) => total * 60 + part, 0)
}

function truncate(text, max) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`
}

/** Privacy: first word only; masked emails/phones become a generic name. */
function firstWord(name) {
  const word = (typeof name === "string" ? name : "")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .trim()
    .split(/\s+/)[0]
  if (!/\p{L}/u.test(word) || /[@*]/.test(word)) return "کاربر فیدیبو"
  return word
}

// Headings that Fidibo glues onto the following sentence.
const HEADING_START_RE =
  /^(معرفی|نقد و بررسی|درباره|چرا|خلاصه|بخشی از|در بخشی از|جملاتی از|گزیده|ویژگی|نکات|کتاب .{0,60} را به چه کسانی)/
const PROMO_RE = /فیدیبو|کلیک کنید|اپلیکیشن|دانلود/
const LETTER_RE = /[\p{L}«]/u

/**
 * Splits Fidibo's flattened description into readable paragraphs.
 * Paragraph breaks were lost, so a sentence end directly followed by a letter
 * (".هانریش") marks a new block; a heading glued to the block text is cut at
 * the first place a known name (title/author/...) runs into the next word.
 */
function toParagraphs(raw, names) {
  if (typeof raw !== "string") return []
  const text = raw
    .replace(/[\u200e\u200f\r]/g, "")
    .replace(/[ \u2009\u00a0]+/g, " ")
  const blocks = text
    .split(/\n+|(?<=[.!?؟])\s*\u200c|(?<=[.!?؟])(?=[^\s.!?؟\d۰-۹)»"'،\u200c])/)
    .map((block) => block.replace(/^[\s\u200c]+/, "").trim())
    // Short lines without a sentence end are headings.
    .filter((block) => block && (block.length > 120 || /[.!?؟…»]$/.test(block)))

  const paragraphs = []
  for (const block of blocks) {
    const body = stripHeading(block, names)
    if (!body) continue
    const sentences = body
      .split(/(?<=[.!?؟])\s+/)
      .filter((sentence) => !PROMO_RE.test(sentence))
    // Drop a leading question used as a heading ("... چیست؟").
    if (sentences.length > 1 && /^.{0,100}[?؟]$/.test(sentences[0])) {
      sentences.shift()
    }
    // Long blocks are split again into ~400 char paragraphs.
    let current = ""
    for (const sentence of sentences) {
      if (current && current.length + sentence.length > 450) {
        paragraphs.push(current)
        current = ""
      }
      current = current ? `${current} ${sentence}` : sentence
    }
    if (current) paragraphs.push(current)
  }

  const result = []
  let total = 0
  for (const paragraph of paragraphs) {
    const clean = paragraph.replace(/\.{2,}/g, ".").trim()
    if (clean.length < 20) continue
    if (result.length >= DESCRIPTION_MAX_PARAGRAPHS) break
    if (total + clean.length > DESCRIPTION_MAX_CHARS && result.length > 0) break
    result.push(truncate(clean, DESCRIPTION_MAX_CHARS))
    total += clean.length
  }
  // Nothing survived (e.g. a short poem): keep the raw text as one paragraph.
  if (result.length === 0 && text.trim()) {
    result.push(
      truncate(text.replace(/\s+/g, " ").trim(), DESCRIPTION_MAX_CHARS)
    )
  }
  return result
}

function stripHeading(block, names) {
  const head = block.slice(0, 140)
  const sentenceEnd = head.search(/[.!?؟]\s/)
  const limit = sentenceEnd === -1 ? head.length : sentenceEnd
  let cut = -1
  const consider = (index) => {
    if (index > 0 && index < limit && (cut === -1 || index < cut)) cut = index
  }
  for (const name of [...names, "بخوانیم", "بشنویم", "بخوانید", "بشنوید"]) {
    if (!name || name.length < 4) continue
    let from = 0
    while (true) {
      const at = head.indexOf(name, from)
      if (at === -1) break
      const end = at + name.length
      if (LETTER_RE.test(head[end] ?? "")) consider(end)
      from = at + 1
    }
  }
  const quote = head.search(/[^\s(]«/)
  if (quote !== -1) consider(quote + 1)

  if (cut !== -1) return block.slice(cut).trim()
  // A heading we could not separate: drop its first sentence.
  if (HEADING_START_RE.test(block)) {
    const end = block.search(/[.!?؟]\s/)
    return end === -1 ? "" : block.slice(end + 1).trim()
  }
  return block
}

function normalizeReview(review) {
  return {
    user: firstWord(review.user),
    date: review.date ?? "",
    rating: typeof review.rating === "number" ? review.rating : 0,
    text: truncate(String(review.text ?? "").trim(), REVIEW_MAX_CHARS),
    likes: typeof review.likes === "number" ? review.likes : 0,
  }
}

function normalizeBook(card, details, reviews, categorySlug, color) {
  const d = { ...card, ...details }
  const authors = splitNames(d.authors)
  const translators = splitNames(d.translators)
  const narrators = splitNames(d.narrators)
  const finalPrice = d.final_price ?? 0
  const distribution = d.rating_distribution_pct ?? {}
  const book = {
    id: d.id,
    title: d.title,
    type: d.type,
    authors,
    publisher: d.publisher ?? "",
    finalPrice,
    inPlus: Boolean(d.in_plus),
    free: Boolean(d.free) || finalPrice === 0,
    rating: d.rating ?? 0,
    ratingsCount: d.ratings_count ?? 0,
    ratingDistribution: Object.fromEntries(
      [1, 2, 3, 4, 5].map((star) => [star, distribution[star] ?? 0])
    ),
    image: d.image,
    color,
    fidiboUrl: d.url,
    categorySlug,
    categoryTitles: Array.isArray(d.categories) ? d.categories : [],
    moods: (d.moods ?? []).map(cleanMood).filter(Boolean),
    description: toParagraphs(d.description, [
      d.title,
      ...authors,
      ...translators,
      ...narrators,
    ]),
    reviewsCount: d.reviews_count ?? reviews.length,
    reviews: reviews.map(normalizeReview).filter((review) => review.text),
  }
  if (translators.length) book.translators = translators
  if (narrators.length) book.narrators = narrators
  if (d.price && d.price > finalPrice) book.price = d.price
  if (d.discount_pct) book.discountPct = d.discount_pct
  if (d.pages) book.pages = d.pages
  const durationSeconds = parseDuration(d.duration)
  if (durationSeconds) book.durationSeconds = durationSeconds
  if (d.file_size) book.fileSize = d.file_size
  if (d.published) book.published = d.published
  if (d.original_title) book.originalTitle = d.original_title
  if (d.printed_price) book.printedPrice = d.printed_price
  return book
}

// ---------------------------------------------------------------------- main

const isWantedType = (card) =>
  card.type === "ebook" || card.type === "audiobook"

async function main() {
  console.log("Starting fidibo-mcp (uvx fidibo-mcp)...")
  const client = await connect()
  try {
    const { categories: allCategories } = await call(client, "fd_categories", {
      level: "ebooks",
    })
    const categories = WANTED_CATEGORIES.map((slug) =>
      allCategories.find((category) => category.slug === slug)
    )
      .filter(Boolean)
      .map(({ slug, title, subcategories = [] }) => ({
        slug,
        title,
        subcategories: subcategories.map((sub) => ({
          slug: sub.slug,
          title: sub.title,
        })),
      }))
    console.log(
      `Chosen categories: ${categories.map((c) => c.slug).join(", ")}`
    )

    /** id -> { card, categorySlug } */
    const cards = new Map()
    const addCard = (card, categorySlug) => {
      if (!isWantedType(card) || cards.has(card.id)) return
      cards.set(card.id, { card, categorySlug })
    }

    for (const category of categories) {
      for (const [kind, limit] of [
        ["ebook", EBOOKS_PER_CATEGORY],
        ["audio", AUDIO_PER_CATEGORY],
      ]) {
        const { books = [] } = await call(client, "fd_bestsellers", {
          period: "all",
          kind,
          category: category.slug,
          limit,
        })
        books.forEach((card) => addCard(card, category.slug))
        console.log(
          `  ${category.slug} ${kind}: ${books.length} (total ${cards.size})`
        )
      }
    }

    // Home lists from the API; books outside the dataset are fetched below.
    const listCards = {}
    const fetchList = async (name, tool, args) => {
      try {
        const { books = [] } = await call(client, tool, args)
        listCards[name] = books.filter(isWantedType)
      } catch (error) {
        if (error instanceof BlockedError) throw error
        console.warn(`  list ${name} failed: ${error.message}`)
        listCards[name] = []
      }
      console.log(`  list ${name}: ${listCards[name].length}`)
    }
    await fetchList("bestsellers", "fd_bestsellers", {
      period: "month",
      limit: LIST_LIMIT,
    })
    await fetchList("newest", "fd_new", { limit: LIST_LIMIT })
    await fetchList("free", "fd_free", { limit: FREE_LIMIT })
    await fetchList("audioBestsellers", "fd_bestsellers", {
      period: "all",
      kind: "audio",
      limit: LIST_LIMIT,
    })
    const listOnly = new Map()
    for (const books of Object.values(listCards)) {
      for (const card of books) {
        if (!cards.has(card.id)) listOnly.set(card.id, card)
      }
    }

    // Details + reviews for every book.
    const allIds = [...cards.keys(), ...listOnly.keys()]
    const books = []
    const skipped = []
    let index = 0
    for (const id of allIds) {
      index += 1
      const entry = cards.get(id) ?? { card: listOnly.get(id) }
      try {
        const details = await call(
          client,
          "fd_book",
          {
            book_id: id,
            full_text: true,
          },
          { cache: true }
        )
        let reviews = []
        try {
          const result = await call(
            client,
            "fd_reviews",
            {
              book_id: id,
              limit: REVIEWS_PER_BOOK,
              full_text: true,
            },
            { cache: true }
          )
          reviews = result.reviews ?? []
        } catch (error) {
          if (error instanceof BlockedError) throw error
          console.warn(`  reviews for ${id} failed: ${error.message}`)
        }
        const categorySlug =
          entry.categorySlug ?? matchCategory(details.categories, categories)
        if (!categorySlug) {
          skipped.push({ id, title: entry.card.title, reason: "no category" })
          console.log(`  [${index}/${allIds.length}] skip ${id} (category)`)
          continue
        }
        const image = details.image ?? entry.card.image
        if (!image) {
          skipped.push({ id, title: entry.card.title, reason: "no cover" })
          console.log(`  [${index}/${allIds.length}] skip ${id} (no cover)`)
          continue
        }
        let color
        try {
          color = await coverColor({ id, image })
        } catch (error) {
          console.warn(`  cover color for ${id} failed: ${error.message}`)
          color = FALLBACK_COLOR
        }
        books.push(
          normalizeBook(entry.card, details, reviews, categorySlug, color)
        )
        console.log(`  [${index}/${allIds.length}] ${id} ${details.title}`)
      } catch (error) {
        if (error instanceof BlockedError) throw error
        skipped.push({ id, title: entry.card.title, reason: error.message })
        console.warn(
          `  [${index}/${allIds.length}] skip ${id}: ${error.message}`
        )
      }
    }

    const byId = new Map(books.map((book) => [book.id, book]))
    const idsIn = (list) =>
      (listCards[list] ?? [])
        .map((card) => card.id)
        .filter((id) => byId.has(id))
    const byPopularity = (a, b) => b.ratingsCount - a.ratingsCount
    const lists = {
      bestsellers: idsIn("bestsellers"),
      newest: idsIn("newest"),
      discounted: books
        .filter((book) => book.discountPct && !book.free)
        .sort((a, b) => b.discountPct - a.discountPct || byPopularity(a, b))
        .slice(0, LIST_LIMIT)
        .map((book) => book.id),
      free: idsIn("free"),
      plus: books
        .filter((book) => book.inPlus)
        .sort(byPopularity)
        .slice(0, LIST_LIMIT)
        .map((book) => book.id),
      audioBestsellers: idsIn("audioBestsellers"),
    }

    const catalog = {
      generatedAt: new Date().toISOString(),
      source: "fidibo-mcp",
      categories,
      books,
      lists,
    }
    await mkdir(path.dirname(OUT_FILE), { recursive: true })
    await writeFile(OUT_FILE, `${JSON.stringify(catalog, null, 2)}\n`)

    const count = (type) => books.filter((book) => book.type === type).length
    console.log(
      `\nWrote ${path.relative(ROOT, OUT_FILE)}: ${books.length} books ` +
        `(${count("ebook")} ebooks, ${count("audiobook")} audiobooks)`
    )
    for (const category of categories) {
      const inCategory = books.filter((b) => b.categorySlug === category.slug)
      console.log(`  ${category.slug}: ${inCategory.length}`)
    }
    for (const [name, ids] of Object.entries(lists)) {
      console.log(`  list ${name}: ${ids.length}`)
    }
    if (skipped.length) {
      console.log(`Skipped ${skipped.length} book(s):`)
      skipped.forEach((s) => console.log(`  ${s.id} ${s.title}: ${s.reason}`))
    }
  } finally {
    await client.close()
  }
}

/** Maps fd_book category titles to one of the chosen top-level slugs. */
function matchCategory(titles = [], categories) {
  const top = categories.find((category) => titles.includes(category.title))
  if (top) return top.slug
  const sub = categories.find((category) =>
    category.subcategories.some((s) => titles.includes(s.title))
  )
  return sub?.slug
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}`)
  process.exitCode = 1
})
