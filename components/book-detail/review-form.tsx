"use client"

import { useId, useState } from "react"
import { SendIcon } from "lucide-react"
import { toast } from "sonner"

import { toastSaveError } from "@/components/site/save-error"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatNumber } from "@/lib/format"
import type { UserReview } from "@/lib/store"
import { DEFAULT_REVIEW_NAME, type UserReviewInput } from "@/lib/store-core"

import {
  MIN_REVIEW_LENGTH,
  hasErrors,
  validateReview,
  type ReviewErrors,
} from "./book-detail-utils"
import { StarRatingInput } from "./star-rating-input"

type ReviewFormProps = {
  /** Returns null when the review couldn't be saved; the form keeps its text. */
  onSubmit: (input: UserReviewInput) => UserReview | null
}

export function ReviewForm({ onSubmit }: ReviewFormProps) {
  const id = useId()
  const [name, setName] = useState("")
  const [rating, setRating] = useState(0)
  const [text, setText] = useState("")
  const [errors, setErrors] = useState<ReviewErrors>({})

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateReview({ rating, text })
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) {
      // Send keyboard and screen reader users to the first problem.
      const field = nextErrors.rating ? `${id}-rating` : `${id}-text`
      const target = document.getElementById(field)
      const focusable =
        target?.querySelector<HTMLElement>("button") ?? target ?? null
      focusable?.focus()
      return
    }
    if (!onSubmit({ name, rating, text })) {
      toastSaveError("نظر شما ذخیره نشد")
      return
    }
    toast.success("نظر شما ثبت شد", {
      description: "از اینکه تجربه‌تان را با دیگران در میان گذاشتید، ممنونیم.",
    })
    setName("")
    setRating(0)
    setText("")
  }

  const trimmedLength = text.trim().length

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby={`${id}-heading`}
      className="flex flex-col gap-5 rounded-xl border bg-card p-5"
    >
      <div className="flex flex-col gap-1">
        <h3 id={`${id}-heading`} className="font-heading text-2xl font-bold">
          نظر خودتان را بنویسید
        </h3>
        <p className="text-sm text-muted-foreground">
          نظرتان فقط روی همین مرورگر ذخیره می‌شود.
        </p>
      </div>
      <FieldGroup>
        <Field data-invalid={errors.rating ? true : undefined}>
          <FieldTitle id={`${id}-rating-label`}>امتیاز شما</FieldTitle>
          <StarRatingInput
            id={`${id}-rating`}
            value={rating}
            onChange={(next) => {
              setRating(next)
              setErrors((current) => ({ ...current, rating: undefined }))
            }}
            invalid={Boolean(errors.rating)}
            aria-labelledby={`${id}-rating-label`}
            aria-describedby={errors.rating ? `${id}-rating-error` : undefined}
          />
          <FieldError id={`${id}-rating-error`}>{errors.rating}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${id}-name`}>نام (اختیاری)</FieldLabel>
          <Input
            id={`${id}-name`}
            name="name"
            autoComplete="nickname"
            maxLength={40}
            placeholder={DEFAULT_REVIEW_NAME}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="sm:max-w-xs"
          />
        </Field>

        <Field data-invalid={errors.text ? true : undefined}>
          <FieldLabel htmlFor={`${id}-text`}>متن نظر</FieldLabel>
          <Textarea
            id={`${id}-text`}
            name="text"
            rows={4}
            maxLength={1500}
            placeholder="این کتاب برای شما چطور بود؟"
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              if (errors.text) {
                setErrors((current) => ({ ...current, text: undefined }))
              }
            }}
            aria-invalid={errors.text ? true : undefined}
            aria-describedby={
              errors.text ? `${id}-text-error` : `${id}-text-hint`
            }
            className="min-h-28 leading-relaxed"
          />
          {errors.text ? (
            <FieldError id={`${id}-text-error`}>{errors.text}</FieldError>
          ) : (
            <FieldDescription id={`${id}-text-hint`}>
              {trimmedLength > 0 && trimmedLength < MIN_REVIEW_LENGTH
                ? `${formatNumber(MIN_REVIEW_LENGTH - trimmedLength)} حرف دیگر بنویسید.`
                : `دست‌کم ${formatNumber(MIN_REVIEW_LENGTH)} حرف.`}
            </FieldDescription>
          )}
        </Field>
      </FieldGroup>
      <div>
        <Button type="submit" size="lg" className="h-10 px-4">
          <SendIcon data-icon="inline-start" className="rtl:-scale-x-100" />
          ثبت نظر
        </Button>
      </div>
    </form>
  )
}
