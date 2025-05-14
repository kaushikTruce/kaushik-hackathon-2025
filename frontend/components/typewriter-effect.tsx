"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface TypewriterEffectProps {
  text: string
  delay?: number
  speed?: number
}

export default function TypewriterEffect({ text, delay = 500, speed = 100 }: TypewriterEffectProps) {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    // Start typing after initial delay
    const startTimeout = setTimeout(() => {
      setIsTyping(true)
    }, delay)

    return () => clearTimeout(startTimeout)
  }, [delay])

  useEffect(() => {
    if (!isTyping) return

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    } else {
      // When typing is complete, blink the cursor
      const blinkInterval = setInterval(() => {
        setCursorVisible((prev) => !prev)
      }, 500)

      return () => clearInterval(blinkInterval)
    }
  }, [currentIndex, isTyping, speed, text])

  return (
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 inline-block">
      {displayText}
      <motion.span
        animate={{ opacity: cursorVisible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="inline-block ml-1 w-[3px] h-[1em] bg-purple-500 align-middle"
      />
    </h1>
  )
}
