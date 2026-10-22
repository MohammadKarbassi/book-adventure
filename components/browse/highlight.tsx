import { highlightParts } from "@/lib/browse"

/** Wraps the parts of `text` that match the search query in <mark>. */
export function Highlight({ text, query }: { text: string; query: string }) {
  return highlightParts(text, query).map((part, index) =>
    part.match ? (
      <mark
        key={index}
        className="rounded-sm bg-primary/30 px-0.5 text-inherit"
      >
        {part.text}
      </mark>
    ) : (
      part.text
    )
  )
}
