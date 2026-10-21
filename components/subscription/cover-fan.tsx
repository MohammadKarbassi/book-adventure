"use client"

import { motion, useReducedMotion, type Variants } from "motion/react"

import { BookCover } from "@/components/book/book-cover"
import type { BookSummary } from "@/lib/catalog"

type FanBook = Pick<BookSummary, "id" | "title" | "image" | "color">

const spring = { type: "spring", stiffness: 220, damping: 22 } as const

// Fanned like a hand of cards; hovering the stack spreads it a little wider.
function fanVariants(offset: number, reduce: boolean): Variants {
  const distance = Math.abs(offset)
  return {
    rest: {
      x: offset * 52,
      y: distance * 12,
      rotate: offset * 7,
      transition: spring,
    },
    hover: reduce
      ? { x: offset * 52, y: distance * 12, rotate: offset * 7 }
      : {
          x: offset * 84,
          y: distance * 18 - 8,
          rotate: offset * 10,
          transition: spring,
        },
  }
}

export function CoverFan({ books }: { books: FanBook[] }) {
  const reduce = useReducedMotion() ?? false
  const middle = (books.length - 1) / 2

  return (
    <motion.div
      initial="rest"
      animate="rest"
      whileHover="hover"
      aria-hidden="true"
      className="relative mx-auto h-64 w-full max-w-md sm:h-80"
    >
      {books.map((book, index) => {
        const offset = index - middle
        return (
          <motion.div
            key={book.id}
            variants={fanVariants(offset, reduce)}
            className="absolute inset-x-0 top-2 mx-auto w-28 origin-bottom sm:w-44"
            style={{ zIndex: 10 - Math.abs(offset) }}
          >
            <BookCover
              book={book}
              priority
              sizes="176px"
              className="w-full shadow-xl"
            />
          </motion.div>
        )
      })}
    </motion.div>
  )
}
