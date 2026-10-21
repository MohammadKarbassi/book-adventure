// Pure text helpers, safe to import from client and server code.

/** Unifies Arabic/Persian letter variants, diacritics, ZWNJ and spacing. */
export function normalizePersian(text: string): string {
  return text
    .replace(/[يى]/g, "ی") // ي ى -> ی
    .replace(/ك/g, "ک") // ك -> ک
    .replace(/[ۀة]/g, "ه") // ۀ ة -> ه
    .replace(/[أإآ]/g, "ا") // أ إ آ -> ا
    .replace(/[ً-ْٰ]/g, "") // diacritics
    .replace(/[‌‍‎‏]/g, "") // ZWNJ, ZWJ, direction marks
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)) // Persian digits
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)) // Arabic digits
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}
