import { splitAccent } from "@/lib/accent"

/** Renders `text` with one whole-word `accent` in the brand accent color. */
export function AccentText({
  text,
  accent,
}: {
  text: string
  accent?: string
}) {
  const parts = splitAccent(text, accent)
  if (!parts) return text
  const [before, word, after] = parts
  return (
    <>
      {before}
      <span className="text-accent-foreground">{word}</span>
      {after}
    </>
  )
}
