// Pure, safe for client and server: picks one accent word out of a heading.

/** Whitespace or punctuation; ZWNJ and letters are not word boundaries. */
const isBoundary = (char: string | undefined) =>
  char === undefined || /[\s\p{P}]/u.test(char)

/**
 * Splits `title` around `accent` when it appears as whole word(s), so
 * Persian letters are never torn apart. Returns null when it doesn't.
 */
export function splitAccent(
  title: string,
  accent: string | undefined
): [before: string, accent: string, after: string] | null {
  if (!accent) return null
  let index = title.indexOf(accent)
  while (index !== -1) {
    const end = index + accent.length
    if (isBoundary(title[index - 1]) && isBoundary(title[end])) {
      return [title.slice(0, index), accent, title.slice(end)]
    }
    index = title.indexOf(accent, index + 1)
  }
  return null
}
