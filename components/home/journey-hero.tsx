"use client"

import Image from "next/image"
import { ArrowDownIcon } from "lucide-react"
import { motion, useSpring, useTransform, useReducedMotion } from "motion/react"

import { Container } from "@/components/site/container"
import { buttonVariants } from "@/components/ui/button"

/** Warm paper, amber light and a real journey emerging from a book. */
export function JourneyHero() {
  const reducedMotion = useReducedMotion()
  const x = useSpring(0, { stiffness: 90, damping: 24 })
  const y = useSpring(0, { stiffness: 90, damping: 24 })
  const rotateY = useTransform(x, [-1, 1], [-3, 3])
  const rotateX = useTransform(y, [-1, 1], [2, -2])
  return (
    <section
      aria-labelledby="journey-title"
      className="overflow-hidden bg-background"
    >
      <Container className="grid min-h-[calc(100svh-4rem)] items-center gap-8 py-12 md:grid-cols-[42fr_58fr] md:gap-0 md:py-16">
        <div className="relative z-10 flex flex-col items-start gap-6">
          <h1
            id="journey-title"
            className="font-heading text-6xl leading-tight font-bold md:text-7xl lg:text-8xl"
          >
            ماجراجویی
            <br />
            با کتاب
          </h1>
          <p className="max-w-sm text-lg leading-9 text-muted-foreground">
            هر کتاب، راهی به جایی تازه است. میان قصه‌ها قدم بزنید، همسفر پیدا
            کنید و سفر بعدی‌تان را از همین‌جا شروع کنید.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#adventure-shelf"
              className={buttonVariants({ size: "lg" })}
            >
              سفرتان را انتخاب کنید <ArrowDownIcon className="size-4" />
            </a>
            <a
              href="#store"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              رفتن به فروشگاه
            </a>
          </div>
        </div>
        <motion.div
          className="relative md:-ms-12 md:w-[115%]"
          style={
            reducedMotion
              ? undefined
              : { rotateX, rotateY, transformPerspective: 1200 }
          }
          onPointerMove={(event) => {
            if (reducedMotion || event.pointerType !== "mouse") return
            const rect = event.currentTarget.getBoundingClientRect()
            x.set(((event.clientX - rect.left) / rect.width) * 2 - 1)
            y.set(((event.clientY - rect.top) / rect.height) * 2 - 1)
          }}
          onPointerLeave={() => {
            x.set(0)
            y.set(0)
          }}
        >
          <Image
            src="/hero/book-journey.webp"
            width={1536}
            height={1024}
            alt="کتابی باز که از صفحه‌های کاغذی‌اش راهی روشن میان کوه‌ها و درختان بیرون آمده است"
            priority
            sizes="(min-width: 768px) 65vw, 100vw"
            className="h-auto w-full"
          />
        </motion.div>
      </Container>
    </section>
  )
}
