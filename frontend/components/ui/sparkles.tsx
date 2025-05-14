"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface SparklesProps {
  id?: string
  className?: string
  background?: string
  minSize?: number
  maxSize?: number
  speed?: number
  particleColor?: string
  particleDensity?: number
}

interface Particle {
  x: number
  y: number
  size: number
  opacity: number
  vx: number
  vy: number
}

export const SparklesCore = ({
  id,
  className,
  background = "transparent",
  minSize = 0.4,
  maxSize = 1,
  speed = 1,
  particleColor = "#FFF",
  particleDensity = 100,
}: SparklesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const widthRef = useRef(0)
  const heightRef = useRef(0)
  const mouseRef = useRef({ x: 0, y: 0 })
  const isHoveringRef = useRef(false)
  const animationFrameIdRef = useRef<number>(0)

  const handleMouseMove = (event: MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      mouseRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
    }
  }

  const handleMouseEnter = () => {
    isHoveringRef.current = true
  }

  const handleMouseLeave = () => {
    isHoveringRef.current = false
  }

  const initializeCanvas = () => {
    if (canvasRef.current) {
      contextRef.current = canvasRef.current.getContext("2d")

      const handleResize = () => {
        if (canvasRef.current) {
          const canvas = canvasRef.current
          const parent = canvas.parentElement
          if (parent) {
            widthRef.current = parent.offsetWidth
            heightRef.current = parent.offsetHeight
            canvas.width = parent.offsetWidth
            canvas.height = parent.offsetHeight
            generateParticles()
          }
        }
      }

      handleResize()
      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
      }
    }
  }

  const generateParticles = () => {
    if (widthRef.current && heightRef.current) {
      const particleCount = Math.min(Math.floor((widthRef.current * heightRef.current) / 10000) * particleDensity, 1000)
      const newParticles: Particle[] = []

      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * widthRef.current
        const y = Math.random() * heightRef.current
        const size = Math.random() * (maxSize - minSize) + minSize
        const opacity = Math.random()
        const direction = Math.random() > 0.5 ? 1 : -1
        const vx = (Math.random() * 0.2 + 0.1) * direction * speed
        const vy = (Math.random() * 0.2 + 0.1) * direction * speed

        newParticles.push({ x, y, size, opacity, vx, vy })
      }

      particlesRef.current = newParticles
    }
  }

  const drawParticles = () => {
    const context = contextRef.current
    const width = widthRef.current
    const height = heightRef.current

    if (context && width && height) {
      context.clearRect(0, 0, width, height)

      particlesRef.current.forEach((particle) => {
        context.beginPath()
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        context.fillStyle = `${particleColor}${Math.floor(particle.opacity * 99)}`
        context.fill()
      })
    }
  }

  const updateParticles = () => {
    const width = widthRef.current
    const height = heightRef.current
    const mouse = mouseRef.current
    const isHovering = isHoveringRef.current

    if (width && height) {
      particlesRef.current = particlesRef.current.map((particle) => {
        let { x, y, vx, vy, size, opacity } = particle

        // Update position
        x += vx
        y += vy

        // Boundary check
        if (x < 0 || x > width) vx = -vx
        if (y < 0 || y > height) vy = -vy

        // Mouse interaction
        if (isHovering) {
          const dx = mouse.x - x
          const dy = mouse.y - y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const maxDistance = 100

          if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance
            vx -= (dx / distance) * force * 0.2
            vy -= (dy / distance) * force * 0.2
          }
        }

        return { ...particle, x, y, vx, vy }
      })
    }
  }

  useEffect(() => {
    const cleanup = initializeCanvas()

    if (canvasRef.current) {
      canvasRef.current.addEventListener("mousemove", handleMouseMove)
      canvasRef.current.addEventListener("mouseenter", handleMouseEnter)
      canvasRef.current.addEventListener("mouseleave", handleMouseLeave)
    }

    const animate = () => {
      updateParticles()
      drawParticles()
      animationFrameIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener("mousemove", handleMouseMove)
        canvasRef.current.removeEventListener("mouseenter", handleMouseEnter)
        canvasRef.current.removeEventListener("mouseleave", handleMouseLeave)
      }
      cancelAnimationFrame(animationFrameIdRef.current)
      if (cleanup) cleanup()
    }
  }, [particleColor, particleDensity, minSize, maxSize, speed])

  return <canvas ref={canvasRef} id={id} className={cn("absolute inset-0", className)} style={{ background }} />
}
