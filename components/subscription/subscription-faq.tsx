import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { formatNumber } from "@/lib/format"

export function SubscriptionFaq({ plusCount }: { plusCount: number }) {
  const questions = [
    {
      id: "included",
      question: "اشتراک شامل چه کتاب‌هایی است؟",
      answer: `همهٔ کتاب‌هایی که نشان «اشتراکی» دارند؛ الان ${formatNumber(plusCount)} عنوان. بقیهٔ کتاب‌ها مثل قبل با خرید جداگانه در دسترس‌اند.`,
    },
    {
      id: "audio",
      question: "کتاب‌های صوتی هم در اشتراک هستند؟",
      answer:
        "بله، کتاب‌های صوتی اشتراکی هم بدون خرید پخش می‌شوند و جای پخش هر کتاب در همین مرورگر برایتان می‌ماند.",
    },
    {
      id: "cancel",
      question: "می‌توانم اشتراک را لغو کنم؟",
      answer:
        "بله، هر وقت خواستید از همین صفحه لغو کنید. کتاب‌هایی که خریده‌اید همیشه در کتابخانهٔ شما می‌مانند.",
    },
    {
      id: "change",
      question: "اگر طرحم را عوض کنم چه می‌شود؟",
      answer:
        "طرح تازه از همان روز شروع می‌شود و جای طرح قبلی را می‌گیرد؛ تاریخ اعتبار هم بر اساس طرح جدید حساب می‌شود.",
    },
    {
      id: "payment",
      question: "پرداخت واقعی است؟",
      answer:
        "خیر؛ این یک پروژهٔ آموزشی است و با فعال‌سازی اشتراک هیچ مبلغی از حساب شما کم نمی‌شود.",
    },
  ]

  return (
    <Accordion className="rounded-xl bg-card px-5 ring-1 ring-foreground/10">
      {questions.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger className="py-4 text-base">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="pb-4 leading-7 text-muted-foreground">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
