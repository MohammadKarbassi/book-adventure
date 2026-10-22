// Orders the adventures for the current reader: adventures whose category
// matches the books they bought, saved or started come first. Pure, so the
// server render, the client hook and the tests all share it.

/** What we know about the reader's interests, as catalog book ids. */
export type JourneySignals = {
  purchases: number[]
  favorites: number[]
  /** Books with reading or listening progress. */
  started: number[]
}

/** Buying says more than saving, saving more than opening. */
export const SIGNAL_WEIGHTS: Record<keyof JourneySignals, number> = {
  purchases: 3,
  favorites: 2,
  started: 1,
}

/** bookId (as a string, like JSON keys) → categorySlug, for the whole catalog. */
export type CategoryMap = Record<string, string>

export const NO_SIGNALS: JourneySignals = {
  purchases: [],
  favorites: [],
  started: [],
}

/**
 * Book ids with progress: reader pages are keyed by the book id, audiobook
 * positions by the player track id («book-<id>»; podcast episodes are skipped).
 */
export function startedBookIds(
  readerProgress: Record<string, number>,
  audioProgress: Record<string, number>
): number[] {
  const ids = new Set<number>()
  for (const [key, page] of Object.entries(readerProgress)) {
    if (page > 0 && /^\d+$/.test(key)) ids.add(Number(key))
  }
  for (const [key, seconds] of Object.entries(audioProgress)) {
    const match = /^book-(\d+)$/.exec(key)
    if (match && seconds > 0) ids.add(Number(match[1]))
  }
  return [...ids]
}

/** Interest per category: the weighted count of signal books in it. */
export function categoryScores(
  signals: JourneySignals,
  categoryOf: CategoryMap
): Map<string, number> {
  const scores = new Map<string, number>()
  for (const kind of Object.keys(SIGNAL_WEIGHTS) as (keyof JourneySignals)[]) {
    for (const id of new Set(signals[kind])) {
      const category = categoryOf[String(id)]
      if (!category) continue
      scores.set(category, (scores.get(category) ?? 0) + SIGNAL_WEIGHTS[kind])
    }
  }
  return scores
}

export type JourneyOrder<T> = {
  items: T[]
  /** True when at least one adventure matched the reader's interests. */
  personalized: boolean
}

/**
 * Highest category score first; ties (and readers with no signals) keep the
 * default order, so the result is stable.
 */
export function orderJourney<T extends { categorySlug: string }>(
  items: T[],
  signals: JourneySignals,
  categoryOf: CategoryMap
): JourneyOrder<T> {
  const scores = categoryScores(signals, categoryOf)
  const scored = items.map((item, index) => ({
    item,
    index,
    score: scores.get(item.categorySlug) ?? 0,
  }))
  if (!scored.some((entry) => entry.score > 0)) {
    return { items, personalized: false }
  }
  scored.sort((a, b) => b.score - a.score || a.index - b.index)
  return { items: scored.map((entry) => entry.item), personalized: true }
}
