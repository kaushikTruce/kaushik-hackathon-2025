"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface HoverEffectProps {
  items: {
    title: string
    description: string
    link: string
  }[]
  className?: string
}

export function HoverEffect({ items, className }: HoverEffectProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative group block p-2 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition duration-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: hoveredIndex === idx ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="relative z-10 p-8 h-full rounded-xl bg-white border border-gray-200 shadow-lg"
            initial={{ scale: 1 }}
            animate={{ scale: hoveredIndex === idx ? 1.05 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col h-full">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 flex-grow">{item.description}</p>
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  )
}
