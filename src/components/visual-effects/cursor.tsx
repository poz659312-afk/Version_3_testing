"use client"

import React, { useEffect, useRef, useState } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  color: string
  life: number
  maxLife: number
  angle?: number
  spin?: number
}

export default function Cursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [activeCursor, setActiveCursor] = useState<string | null>(null)
  const [isPowerSave, setIsPowerSave] = useState(false)
  
  // Coordinates and physics variables kept in refs to avoid React re-renders on mouse movement
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, moved: false })
  const particlesRef = useRef<Particle[]>([])
  const animationFrameIdRef = useRef<number | null>(null)
  const lastMoveTimeRef = useRef<number>(Date.now())
  const isSleepingRef = useRef<boolean>(true)

  const syncSettings = () => {
    if (typeof window === "undefined") return

    // 1. Read performance mode
    const perfMode = localStorage.getItem("chameleon_perf_mode")
    const powerSaveActive = perfMode === "power-save"
    setIsPowerSave(powerSaveActive)

    // 2. Read equipped cursor
    const equipped = localStorage.getItem("chameleon-equipped-cursor")
    setActiveCursor(equipped)

    // Reset default system cursor
    document.documentElement.style.cursor = ""
  }

  useEffect(() => {
    syncSettings()

    window.addEventListener("chameleon_visual_settings_changed", syncSettings)
    window.addEventListener("storage", syncSettings)

    return () => {
      window.removeEventListener("chameleon_visual_settings_changed", syncSettings)
      window.removeEventListener("storage", syncSettings)
      document.documentElement.style.cursor = ""
    }
  }, [])

  // Manage cursor events and animation loop
  useEffect(() => {
    if (typeof window === "undefined" || isPowerSave || !activeCursor) {
      // Clear canvas and cancel frame if disabled
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
      document.documentElement.style.cursor = ""
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.scale(dpr, dpr)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    // Interpolation setup for smooth cursor follow
    mouseRef.current = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      moved: false
    }
    particlesRef.current = []
    isSleepingRef.current = false

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX
      mouseRef.current.targetY = e.clientY
      mouseRef.current.moved = true
      lastMoveTimeRef.current = Date.now()

      // Wake up the render loop if it's sleeping
      if (isSleepingRef.current) {
        isSleepingRef.current = false
        renderLoop()
      }
    }

    window.addEventListener("mousemove", handleMouseMove)

    // Hide standard cursor if cyber-cross is selected
    if (activeCursor === "cursor-cyber-cross") {
      document.documentElement.style.cursor = "none"
    } else {
      document.documentElement.style.cursor = ""
    }

    // Sparkles particle generator helper
    const createSparkle = (x: number, y: number) => {
      const colors = ["#f59e0b", "#fbbf24", "#06b6d4", "#a855f7", "#ec4899"]
      const color = colors[Math.floor(Math.random() * colors.length)]
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 1.5 + 0.5
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.2, // slight upward float
        size: Math.random() * 4 + 2,
        alpha: 1,
        color,
        life: 0,
        maxLife: Math.random() * 30 + 20
      }
    }

    // Bubbles particle generator helper
    const createBubble = (x: number, y: number) => {
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -1 * (Math.random() * 1.2 + 0.4), // upward float
        size: Math.random() * 6 + 3,
        alpha: 0.8,
        color: "rgba(56, 189, 248, 0.4)", // transparent sky-400
        life: 0,
        maxLife: Math.random() * 40 + 30
      }
    }

    // The optimized Canvas drawing and update function
    const renderLoop = () => {
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Clear the canvas area
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      const mouse = mouseRef.current
      const particles = particlesRef.current

      // Lerp mouse coordinates
      mouse.x += (mouse.targetX - mouse.x) * 0.2
      mouse.y += (mouse.targetY - mouse.y) * 0.2

      // Check for sleep state: if idle for 3 seconds and no active particles, sleep
      const timeSinceLastMove = Date.now() - lastMoveTimeRef.current
      if (timeSinceLastMove > 3000 && particles.length === 0) {
        isSleepingRef.current = true
        animationFrameIdRef.current = null
        return
      }

      // Add particles if mouse moved
      if (mouse.moved) {
        if (activeCursor === "cursor-sparkles" && Math.random() < 0.6) {
          particles.push(createSparkle(mouse.targetX, mouse.targetY))
        } else if (activeCursor === "cursor-bubbles" && Math.random() < 0.4) {
          particles.push(createBubble(mouse.targetX, mouse.targetY))
        }
        mouse.moved = false
      }

      // 1. Render Sparkles or Bubbles particles
      if (activeCursor === "cursor-sparkles" || activeCursor === "cursor-bubbles") {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]
          p.x += p.vx
          p.y += p.vy
          
          if (activeCursor === "cursor-bubbles") {
            // Add a gentle wavy movement to bubbles
            p.vx += Math.sin(p.life / 10) * 0.05
            p.size += 0.02 // grow slightly as they rise
          } else {
            // Apply slight gravity to sparkles
            p.vy += 0.04
          }

          p.life++
          p.alpha = 1 - p.life / p.maxLife

          if (p.life >= p.maxLife || p.alpha <= 0) {
            particles.splice(i, 1)
            continue
          }

          ctx.save()
          if (activeCursor === "cursor-sparkles") {
            // Draw a shiny 4-point star sparkle
            ctx.beginPath()
            ctx.moveTo(p.x, p.y - p.size)
            ctx.quadraticCurveTo(p.x, p.y, p.x + p.size, p.y)
            ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + p.size)
            ctx.quadraticCurveTo(p.x, p.y, p.x - p.size, p.y)
            ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - p.size)
            ctx.closePath()
            ctx.fillStyle = p.color
            ctx.shadowBlur = 4
            ctx.shadowColor = p.color
            ctx.globalAlpha = p.alpha
            ctx.fill()
          } else {
            // Draw a glass-like bubble
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(56, 189, 248, ${p.alpha * 0.8})`
            ctx.lineWidth = 1.2
            ctx.stroke()
            
            // Inner soft glowing radial fill
            const bubbleGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
            bubbleGrad.addColorStop(0, "rgba(255, 255, 255, 0)")
            bubbleGrad.addColorStop(0.8, "rgba(56, 189, 248, 0.05)")
            bubbleGrad.addColorStop(1, `rgba(56, 189, 248, ${p.alpha * 0.15})`)
            ctx.fillStyle = bubbleGrad
            ctx.fill()

            // Soft light reflection highlight
            ctx.beginPath()
            ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.18, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.75})`
            ctx.fill()
          }
          ctx.restore()
        }
      }

      // 2. Render Cyber Crosshair HUD (drawn directly on mouse coordinates)
      if (activeCursor === "cursor-cyber-cross") {
        ctx.save()
        ctx.translate(mouse.x, mouse.y)

        // Draw crosshair color glow
        const glowColor = "rgba(16, 185, 129, 0.85)" // Emerald green
        ctx.strokeStyle = glowColor
        ctx.fillStyle = glowColor
        ctx.shadowBlur = 6
        ctx.shadowColor = glowColor

        // Central cross Dot
        ctx.beginPath()
        ctx.arc(0, 0, 1.8, 0, Math.PI * 2)
        ctx.fill()

        // Outer rotating ring arc sections
        const rotationAngle = (Date.now() / 1000) % (Math.PI * 2)
        ctx.rotate(rotationAngle)
        
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(0, 0, 10, 0, Math.PI * 0.3)
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(0, 0, 10, Math.PI * 0.6, Math.PI * 0.9)
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(0, 0, 10, Math.PI * 1.2, Math.PI * 1.5)
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(0, 0, 10, Math.PI * 1.8, Math.PI * 2.1)
        ctx.stroke()

        // Static cursor guide lines
        ctx.rotate(-rotationAngle) // counter-rotate
        ctx.lineWidth = 0.8
        
        // Left guide line
        ctx.beginPath()
        ctx.moveTo(-16, 0)
        ctx.lineTo(-6, 0)
        ctx.stroke()

        // Right guide line
        ctx.beginPath()
        ctx.moveTo(6, 0)
        ctx.lineTo(16, 0)
        ctx.stroke()

        // Top guide line
        ctx.beginPath()
        ctx.moveTo(0, -16)
        ctx.lineTo(0, -6)
        ctx.stroke()

        // Bottom guide line
        ctx.beginPath()
        ctx.moveTo(0, 6)
        ctx.lineTo(0, 16)
        ctx.stroke()

        ctx.restore()
      }

      // Next tick
      animationFrameIdRef.current = requestAnimationFrame(renderLoop)
    }

    // Start the animation loop
    renderLoop()

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("mousemove", handleMouseMove)
      document.documentElement.style.cursor = ""
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [activeCursor, isPowerSave])

  if (isPowerSave || !activeCursor) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 99999
      }}
    />
  )
}
