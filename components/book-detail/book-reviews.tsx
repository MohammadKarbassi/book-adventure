"use client"

import {
  ExternalLinkIcon,
  MessageSquareTextIcon,
  ThumbsUpIcon,
} from "lucide-react"

import { RatingStars } from "@/components/book/rating-stars"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { TabsTrigger } from "@/components/ui/tabs"
import type { Review } from "@/lib/catalog"
import { formatDate, formatNumber } from "@/lib/format"
import { useUserReviews } from "@/lib/store"
import { cn } from "@/lib/utils"

import { formatReviewDate, initialOf } from "./book-detail-utils"
import { ReviewForm } from "./review-form"

type BookReviewsProps = {
  bookId: number
  /** The handful of Fidibo reviews we have. */
  reviews: Review[]
  /** All Fidibo reviews, including the ones we don't have. */
  reviewsCount: number
  fidiboUrl: string
}

/** «نظرات (N)»: Fidibo's count plus the reviews written in this browser. */
export function ReviewsTabTrigger({
  bookId,
  reviewsCount,
  value,
  className,
}: {
  bookId: number
  reviewsCount: number
  value: string
  className?: string
}) {
  const { reviews } = useUserReviews(bookId)
  return (
    <TabsTrigger value={value} className={className}>
      {`نظرات (${formatNumber(reviewsCount + reviews.length)})`}
    </TabsTrigger>
  )
}

export function BookReviews({
  bookId,
  reviews,
  reviewsCount,
  fidiboUrl,
}: BookReviewsProps) {
  const { reviews: own, addReview } = useUserReviews(bookId)
  const isEmpty = own.length === 0 && reviews.length === 0

  return (
    <div className="flex flex-col gap-8">
      <ReviewForm onSubmit={addReview} />

      {isEmpty ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareTextIcon />
            </EmptyMedia>
            <EmptyTitle>هنوز نظری ثبت نشده</EmptyTitle>
            <EmptyDescription>
              اولین نفری باشید که دربارهٔ این کتاب می‌نویسد.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul aria-label="نظرهای خوانندگان" className="flex flex-col">
          {own.map((review) => (
            <ReviewItem
              key={review.id}
              name={review.name}
              date={formatDate(review.createdAt)}
              rating={review.rating}
              text={review.text}
              mine
            />
          ))}
          {reviews.map((review, index) => (
            <ReviewItem
              key={`${review.user}-${review.date}-${index}`}
              name={review.user}
              date={formatReviewDate(review.date)}
              rating={review.rating}
              text={review.text}
              likes={review.likes}
            />
          ))}
        </ul>
      )}

      {reviewsCount > reviews.length ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/60 px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            {`${formatNumber(reviews.length)} نظر از ${formatNumber(reviewsCount)} نظر خوانندگان فیدیبو`}
          </p>
          <a
            href={fidiboUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            همهٔ نظرها در فیدیبو
            <ExternalLinkIcon data-icon="inline-end" />
          </a>
        </div>
      ) : null}
    </div>
  )
}

function ReviewItem({
  name,
  date,
  rating,
  text,
  likes,
  mine = false,
}: {
  name: string
  date: string
  rating: number
  text: string
  likes?: number
  mine?: boolean
}) {
  return (
    <li
      className={cn(
        "flex gap-4 border-b py-5 first:pt-0 last:border-b-0",
        mine &&
          "animate-in duration-500 fade-in slide-in-from-top-2 motion-reduce:animate-none"
      )}
    >
      <Avatar size="lg" className="mt-0.5">
        <AvatarFallback
          className={cn(
            "font-medium",
            mine && "bg-accent text-accent-foreground"
          )}
        >
          {initialOf(name)}
        </AvatarFallback>
      </Avatar>
      <article className="flex min-w-0 flex-1 flex-col gap-2">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h4 className="font-medium">{name}</h4>
          {mine ? <Badge variant="accent">نظر شما</Badge> : null}
          <RatingStars rating={rating} />
          <span className="text-xs text-muted-foreground">{date}</span>
        </header>
        <p className="leading-loose text-pretty whitespace-pre-line text-foreground/90">
          {text.trim()}
        </p>
        {likes ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ThumbsUpIcon aria-hidden="true" className="size-3.5" />
            {`${formatNumber(likes)} نفر این نظر را مفید دانستند`}
          </p>
        ) : null}
      </article>
    </li>
  )
}
