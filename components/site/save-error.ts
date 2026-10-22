import { toast } from "sonner"

export const SAVE_ERROR_DESCRIPTION =
  "فضای ذخیره‌سازی مرورگر در دسترس نیست یا پر است؛ دوباره تلاش کنید."

/** Shown when a localStorage write fails, so the UI never fakes a success. */
export function toastSaveError(title = "ذخیره نشد") {
  toast.error(title, { description: SAVE_ERROR_DESCRIPTION })
}
