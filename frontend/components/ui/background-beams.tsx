"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

export const BackgroundBeams = ({ children }: { children?: React.ReactNode }) => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const beamsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!beamsRef.current) return
      const rect = beamsRef.current.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div ref={beamsRef} className="relative overflow-hidden">
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15), transparent 40%)`,
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-purple-50/50 via-transparent to-transparent" />
      <div className="absolute inset-0 z-0 bg-grid-slate-200/20 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      {children}
    </div>
  )
}
