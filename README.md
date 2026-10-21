# ماجراجویی با کتاب (Book Adventure)

«ماجراجویی با کتاب» یک پلتفرم کتاب الکترونیکی فارسی با رابط کاربری راست‌به‌چپ (RTL) است. پروژه در مرحلهٔ اولیهٔ راه‌اندازی است.

## فناوری‌ها

- Next.js 16.4 (App Router)
- React 19.3
- TypeScript (حالت strict)
- Tailwind CSS v4 به‌صورت CSS-first (بدون `tailwind.config`)
- shadcn/ui روی Base UI، با فعال بودن `rtl`
- next-themes برای حالت تیره
- فونت وزیرمتن (Vazirmatn)
- آیکون‌های lucide-react

## شروع کار

```bash
npm install
npm run dev
```

سپس <http://localhost:3000> را در مرورگر باز کنید.

## اسکریپت‌ها

| اسکریپت             | توضیح                                           |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | اجرای سرور توسعه                                |
| `npm run build`     | ساخت نسخهٔ تولید                                |
| `npm run start`     | اجرای نسخهٔ ساخته‌شده                           |
| `npm run lint`      | بررسی کد با ESLint                              |
| `npm run format`    | فرمت فایل‌های `ts`، `tsx` و `css` با Prettier   |
| `npm run typecheck` | بررسی نوع‌ها با TypeScript (`tsc --noEmit`)     |

## ساختار پوشه‌ها

```text
app/                      صفحه‌ها و چیدمان (App Router)
components/ui/            کامپوننت‌های shadcn/ui
components/theme-provider.tsx  فراهم‌کنندهٔ تم (next-themes)
lib/utils.ts              توابع کمکی (از جمله cn)
hooks/                    هوک‌های سفارشی
public/                   فایل‌های ایستا
```

## افزودن کامپوننت shadcn

```bash
npx shadcn@latest add <name>
```

سرور MCP مربوط به shadcn در فایل `.mcp.json` تنظیم شده است.

## قواعد پروژه

- **RTL:** به‌جای کلاس‌های جهت‌دار (`pl-`، `pr-`، `ml-`، `mr-`، `text-left`) از کلاس‌های منطقی استفاده کنید: `ps-`، `pe-`، `ms-`، `me-`، `text-start`، `start-`، `end-`.
- **کلاس‌ها:** `cn` را از `@/lib/utils` وارد کنید.
- **حالت تیره:** با زدن کلید `d` جابه‌جا می‌شود.

## نکته دربارهٔ Next.js

این نسخهٔ Next.js تغییرات ناسازگار (breaking changes) دارد. پیش از نوشتن کد، راهنماهای موجود در `node_modules/next/dist/docs/` را بخوانید (به `AGENTS.md` نگاه کنید).
