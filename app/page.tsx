import { BookRow } from "@/components/book/book-row"
import { Container } from "@/components/site/container"
import { getList, toSummary } from "@/lib/catalog"

// Temporary home page to verify the shell; replaced by the shelf in step 3.
export default function Page() {
  return (
    <Container className="flex flex-col gap-16 py-12">
      <BookRow
        title="پرفروش‌های ماه"
        description="کتاب‌هایی که این ماه بیشتر از همه خوانده شده‌اند"
        books={getList("bestsellers").map(toSummary)}
        priority
      />
      <BookRow
        title="کتاب‌های صوتی پرفروش"
        description="برای راه، آشپزخانه و پیش از خواب"
        href="/audiobooks"
        books={getList("audioBestsellers").map(toSummary)}
      />
    </Container>
  )
}
