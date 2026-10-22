import Link from "next/link"
import { HeadphonesIcon } from "lucide-react"

import { Container } from "@/components/site/container"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/** /read/<id> of an audiobook: there is nothing to read, only to listen. */
export function AudiobookNotice({ id, title }: { id: number; title: string }) {
  return (
    <Container className="flex min-h-[calc(100svh-4rem-1px)] items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="justify-items-center gap-2 text-center">
          <span className="mb-2 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <HeadphonesIcon className="size-6" />
          </span>
          <CardTitle>
            <h1 className="font-heading text-2xl">این کتاب صوتی است</h1>
          </CardTitle>
          <CardDescription className="leading-relaxed text-balance">
            «{title}» خواندنی نیست، شنیدنی است. از صفحهٔ کتاب می‌توانید نمونهٔ
            صوتی آن را گوش کنید.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href={`/book/${id}`} className={buttonVariants()}>
            رفتن به صفحهٔ کتاب
          </Link>
        </CardFooter>
      </Card>
    </Container>
  )
}
