import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="text-start font-heading text-3xl font-bold">
            ماجراجویی با کتاب
          </h1>
          <p className="text-start">پروژه در مرحلهٔ اولیهٔ راه‌اندازی است.</p>
          <p className="text-start">این صفحه فعلاً فقط یک نمونهٔ اولیه است.</p>
          <Button className="mt-2">دکمه</Button>
        </div>
        <div className="text-start text-xs text-muted-foreground">
          برای تغییر حالت تیره، کلید <kbd>d</kbd> را بزنید.
        </div>
      </div>
    </div>
  )
}
