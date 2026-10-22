// Pure helpers for the book page, shared by server and client code.
// No catalog import here: client components may use these too.

import { formatNumber, toPersianDigits } from "@/lib/format"

/** Route ids are plain positive integers without leading zeros ("1631"). */
export function parseBookId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) ? id : null
}

/** Trims to `max` characters at a word boundary and adds an ellipsis. */
export function excerpt(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut
  return `${base.replace(/[\s،,.:;؛]+$/, "")}…`
}

// Bidi controls and stray marks that Fidibo leaves around Latin titles.
const BIDI_CONTROLS = /[​-‏‪-‮⁦-⁩﻿]/g

/** Removes invisible direction marks and collapses spaces. */
export function cleanText(text: string): string {
  return text.replace(BIDI_CONTROLS, "").replace(/\s+/g, " ").trim()
}

/** True when the text has Latin letters and no Persian/Arabic ones. */
export function isLatin(text: string): boolean {
  return /[A-Za-z]/.test(text) && !/[؀-ۿ]/.test(text)
}

/** Fidibo review dates: "۱۴۰۰-۱۰-۰۵" → "۱۴۰۰/۱۰/۰۵". */
export function formatReviewDate(date: string): string {
  return toPersianDigits(date.replace(/-/g, "/"))
}

/** First visible letter of a name for an avatar, "؟" when empty. */
export function initialOf(name: string): string {
  const letter = cleanText(name).match(/[\p{L}\p{N}]/u)
  return letter ? letter[0] : "؟"
}

export const MIN_REVIEW_LENGTH = 10

export type ReviewDraft = { rating: number; text: string }
export type ReviewErrors = { rating?: string; text?: string }

export function validateReview({ rating, text }: ReviewDraft): ReviewErrors {
  const errors: ReviewErrors = {}
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = "لطفاً به کتاب امتیاز بدهید."
  }
  const length = text.trim().length
  if (length === 0) {
    errors.text = "متن نظر را بنویسید."
  } else if (length < MIN_REVIEW_LENGTH) {
    errors.text = `متن نظر باید دست‌کم ${formatNumber(MIN_REVIEW_LENGTH)} حرف باشد.`
  }
  return errors
}

export function hasErrors(errors: ReviewErrors): boolean {
  return Boolean(errors.rating || errors.text)
}

/** Labels for the 1–5 star input. */
export const RATING_LABELS = ["خیلی بد", "بد", "معمولی", "خوب", "عالی"] as const

/** Toman saved by the discount; 0 when there is none. */
export function discountAmount(book: {
  finalPrice: number
  price?: number
}): number {
  return book.price && book.price > book.finalPrice
    ? book.price - book.finalPrice
    : 0
}
