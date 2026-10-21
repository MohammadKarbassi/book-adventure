// Persian number, price and duration formatting shared across the site.

const persianDigits = "۰۱۲۳۴۵۶۷۸۹"

/** Replaces Latin digits with Persian ones; other characters stay as they are. */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => persianDigits[+digit])
}

const numberFormat = new Intl.NumberFormat("fa-IR")

/** 270000 → "۲۷۰٬۰۰۰" */
export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

/** 270000 → "۲۷۰٬۰۰۰ تومان", 0 → "رایگان" */
export function formatPrice(toman: number): string {
  return toman === 0 ? "رایگان" : `${formatNumber(toman)} تومان`
}

/** 4.567 → "۴٫۶" */
export function formatRating(rating: number): string {
  return new Intl.NumberFormat("fa-IR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating)
}

/** 15883 → "۴ ساعت و ۲۴ دقیقه", 540 → "۹ دقیقه" */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours === 0) return `${formatNumber(Math.max(minutes, 1))} دقیقه`
  if (minutes === 0) return `${formatNumber(hours)} ساعت`
  return `${formatNumber(hours)} ساعت و ${formatNumber(minutes)} دقیقه`
}

/** Player clock: 75 → "۱:۱۵", 3725 → "۱:۰۲:۰۵" */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  const clock = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
  return toPersianDigits(clock)
}

/** ISO date → Jalali date in Persian, e.g. "۱ آبان ۱۴۰۵" */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso))
}
