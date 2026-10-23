// Pure, safe for client and server. Curated imagery (cover fans, hero picks)
// avoids sensitive topics, see the content rules in AGENTS.md.

const SENSITIVE_TITLE_WORDS = ["خودکشی"]

/** False for books whose title names a sensitive topic (e.g. suicide). */
export function isFeatureSafe(book: { title: string }): boolean {
  return !SENSITIVE_TITLE_WORDS.some((word) => book.title.includes(word))
}
