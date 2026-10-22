// Samples every catalog cover into a soft palette and writes data/palettes.json:
// { [bookId]: { top, bottom, accent } } as "#rrggbb", for page gradients.
// Covers come from .cache/covers/<id>.img (filled by scripts/fetch-fidibo.mjs);
// missing ones are downloaded. Run: npm run data:palettes

import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const CATALOG_FILE = path.join(ROOT, "data", "catalog.json")
const OUT_FILE = path.join(ROOT, "data", "palettes.json")
const COVER_CACHE_DIR = path.join(ROOT, ".cache", "covers")
// The Fidibo CDN rejects non-browser agents.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

const WIDTH = 40
const HEIGHT = 60
/** Share of the cover height sampled for the top and bottom colors. */
const BAND = 0.3

async function loadCover(book) {
  const file = path.join(COVER_CACHE_DIR, `${book.id}.img`)
  const cached = await readFile(file).catch(() => null)
  if (cached) return cached
  const response = await fetch(book.image, {
    headers: { "User-Agent": USER_AGENT },
  })
  if (!response.ok) throw new Error(`cover HTTP ${response.status}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  await mkdir(COVER_CACHE_DIR, { recursive: true })
  await writeFile(file, buffer)
  return buffer
}

// ------------------------------------------------------------ color math

const toLinear = (c) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const fromLinear = (v) =>
  255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)

/** sRGB 0–255 → OKLab [L, a, b]. */
function toOklab([r, g, b]) {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** OKLab → "#rrggbb", reducing chroma until the color fits in sRGB. */
function toHex([L, a, b]) {
  for (let k = 1; k >= 0; k -= 0.05) {
    const l = (L + 0.3963377774 * a * k + 0.2158037573 * b * k) ** 3
    const m = (L - 0.1055613458 * a * k - 0.0638541728 * b * k) ** 3
    const s = (L - 0.0894841775 * a * k - 1.291485548 * b * k) ** 3
    const rgb = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ]
    const inGamut = rgb.every((v) => v >= -0.001 && v <= 1.001)
    if (inGamut || k <= 0.05) {
      return `#${rgb
        .map((v) =>
          Math.round(Math.min(255, Math.max(0, fromLinear(Math.max(0, v)))))
            .toString(16)
            .padStart(2, "0")
        )
        .join("")}`
    }
  }
  throw new Error("unreachable")
}

const chroma = ([, a, b]) => Math.hypot(a, b)
const hue = ([, a, b]) => ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360
const distance = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])

const mean = (points) =>
  [0, 1, 2].map(
    (i) => points.reduce((sum, point) => sum + point[i], 0) / points.length
  )

/** Mean of the points closest to the center, dropping the farthest 25%. */
function trimmedMean(points) {
  const center = mean(points)
  const sorted = [...points].sort(
    (p, q) => distance(p, center) - distance(q, center)
  )
  return mean(sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.75))))
}

/**
 * Representative color of a band: a small deterministic k-means in OKLab and
 * the biggest cluster's trimmed mean, so two-tone bands give one of the tones
 * instead of a muddy average of both.
 */
function representative(points) {
  const k = Math.min(4, points.length)
  // Farthest-point initialisation, starting from the band's mean.
  const centers = [trimmedMean(points)]
  while (centers.length < k) {
    let best = points[0]
    let bestDistance = -1
    for (const point of points) {
      const d = Math.min(...centers.map((center) => distance(point, center)))
      if (d > bestDistance) {
        best = point
        bestDistance = d
      }
    }
    centers.push(best)
  }
  let groups = []
  for (let iteration = 0; iteration < 12; iteration++) {
    groups = centers.map(() => [])
    for (const point of points) {
      let nearest = 0
      for (let i = 1; i < centers.length; i++) {
        if (distance(point, centers[i]) < distance(point, centers[nearest])) {
          nearest = i
        }
      }
      groups[nearest].push(point)
    }
    groups.forEach((group, i) => {
      if (group.length) centers[i] = mean(group)
    })
  }
  const biggest = groups.reduce((a, b) => (b.length > a.length ? b : a))
  return trimmedMean(biggest)
}

/** Near-black / near-white pixels, usually title text or paper margins. */
const isExtreme = ([L]) => L < 0.2 || L > 0.94

function bandColor(points) {
  const midtones = points.filter((point) => !isExtreme(point))
  // Mostly black or white band: that *is* its color.
  const sample = midtones.length >= points.length * 0.3 ? midtones : points
  const [L, a, b] = representative(sample)
  // Keep gradients soft: no pitch-black or paper-white ends.
  return [Math.min(0.93, Math.max(0.22, L)), a, b]
}

/**
 * Accent: the 20° hue bucket with the most chroma weight (count × chroma),
 * ignoring tiny specks; its more saturated half is averaged.
 */
function accentColor(points, fallback) {
  const colorful = points.filter(
    (point) => point[0] > 0.3 && point[0] < 0.92 && chroma(point) > 0.04
  )
  const buckets = new Map()
  for (const point of colorful) {
    const key = Math.floor(hue(point) / 20)
    const bucket = buckets.get(key) ?? { weight: 0, points: [] }
    bucket.weight += chroma(point)
    bucket.points.push(point)
    buckets.set(key, bucket)
  }
  const best = [...buckets.values()]
    .filter((bucket) => bucket.points.length >= points.length * 0.03)
    .sort((a, b) => b.weight - a.weight)[0]
  if (!best) return fallback
  const vivid = [...best.points]
    .sort((p, q) => chroma(q) - chroma(p))
    .slice(0, Math.max(1, Math.ceil(best.points.length / 2)))
  const [L, a, b] = mean(vivid)
  return [Math.min(0.8, Math.max(0.4, L)), a, b]
}

async function palette(book) {
  const { data } = await sharp(await loadCover(book))
    .resize(WIDTH, HEIGHT, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const rows = []
  for (let y = 0; y < HEIGHT; y++) {
    const row = []
    for (let x = 0; x < WIDTH; x++) {
      const i = (y * WIDTH + x) * 3
      row.push(toOklab([data[i], data[i + 1], data[i + 2]]))
    }
    rows.push(row)
  }
  const bandRows = Math.round(HEIGHT * BAND)
  const top = bandColor(rows.slice(0, bandRows).flat())
  const bottom = bandColor(rows.slice(HEIGHT - bandRows).flat())
  const all = rows.flat()
  const fallback = [top, bottom].sort((p, q) => chroma(q) - chroma(p))[0]
  return {
    top: toHex(top),
    bottom: toHex(bottom),
    accent: toHex(accentColor(all, fallback)),
  }
}

// ------------------------------------------------------------------- main

const catalog = JSON.parse(await readFile(CATALOG_FILE, "utf8"))
const palettes = {}
const failed = []
for (const book of catalog.books) {
  try {
    palettes[String(book.id)] = await palette(book)
  } catch (error) {
    failed.push(book.id)
    console.warn(`  ${book.id}: ${error.message}, using the dominant color`)
    const color = book.color.dominant
    palettes[String(book.id)] = { top: color, bottom: color, accent: color }
  }
}
await writeFile(OUT_FILE, `${JSON.stringify(palettes, null, 2)}\n`)
console.log(
  `Wrote ${Object.keys(palettes).length} palettes to data/palettes.json` +
    (failed.length ? ` (${failed.length} fell back: ${failed.join(", ")})` : "")
)
