"use client"

import { MotionConfig, motion } from "motion/react"

type RevealProps = React.ComponentProps<typeof motion.div>

/** Fades a section in the first time it scrolls into view. */
export function Reveal({ children, ...props }: RevealProps) {
  return (
    // "user": with prefers-reduced-motion only the fade remains, no movement.
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -12% 0px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        {...props}
      >
        {children}
      </motion.div>
    </MotionConfig>
  )
}
