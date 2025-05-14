"use client"

import { useEffect, useState } from "react"
import { motion, stagger, useAnimate, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

export const TypewriterEffect = ({
  words,
  className,
  cursorClassName,
}: {
  words: {
    text: string
    className?: string
  }[]
  className?: string
  cursorClassName?: string
}) => {
  const [scope, animate] = useAnimate()
  const isInView = useInView(scope)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (isInView && !started) {
      setStarted(true)

      const wordsArray = words.map((word) => word.text)
      const textToType = wordsArray.join(" ")

      const letterAnimation = async () => {
        await animate(
          "span",
          {
            display: "inline-block",
            opacity: 1,
          },
          {
            duration: 0.1,
            delay: stagger(0.05),
            ease: "easeInOut",
          },
        )

        await animate(
          ".cursor",
          {
            opacity: 0,
          },
          {
            duration: 0.5,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
          },
        )
      }

      letterAnimation()
    }
  }, [isInView, animate, words, started])

  const renderWords = () => {
    return (
      <div className="inline">
        {words.map((word, idx) => {
          return (
            <div key={`word-${idx}`} className="inline-block">
              {word.text.split("").map((char, index) => (
                <motion.span
                  initial={{ opacity: 0, display: "none" }}
                  key={`char-${index}`}
                  className={cn(`opacity-0 hidden`, word.className)}
                >
                  {char}
                </motion.span>
              ))}
              &nbsp;
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={scope} className={cn("text-base font-bold", className)}>
      {renderWords()}
      <motion.span
        initial={{ opacity: 0 }}
        className={cn("cursor inline-block bg-primary w-[4px] h-[1em] rounded-full", cursorClassName)}
      ></motion.span>
    </div>
  )
}
