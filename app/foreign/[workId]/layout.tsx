import { notFound } from "next/navigation"

import { isWorkId } from "@/lib/foreign"

// Checked here, outside the page's loading boundary, so a malformed id gets
// a real 404 status before anything streams.
export default async function ForeignBookLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ workId: string }>
}) {
  if (!isWorkId((await params).workId)) notFound()
  return children
}
