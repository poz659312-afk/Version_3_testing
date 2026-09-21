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
  char?: string
  points?: { x: number; y: number }[]
}

export default function Cursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [activeCursor, setActiveCursor] = useState<string | null>(null)
  const [isPowerSave, setIsPowerSave] = useState(false)
  
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(pointer: coarse)").matches || 
           window.matchMedia("(hover: none)").matches || 
           window.matchMedia("(max-width: 1024px)").matches || 
           (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
  })
  
  // Coordinates and physics variables kept in refs to avoid React re-renders on mouse movement
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, moved: false })
  const particlesRef = useRef<Particle[]>([])
  const animationFrameIdRef = useRef<number | null>(null)
  const lastMoveTimeRef = useRef<number>(Date.now())
  const isSleepingRef = useRef<boolean>(true)

  const syncSettings = () => {
    if (typeof window === "undefined") return

    // 0. Detect touch/mobile device (no hardware mouse cursor)
    const isCoarse = window.matchMedia("(pointer: coarse)").matches || 
                     window.matchMedia("(hover: none)").matches || 
                     window.matchMedia("(max-width: 1024px)").matches || 
                     (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
    setIsTouchDevice(isCoarse)
    if (isCoarse) return

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
    if (typeof window === "undefined" || isTouchDevice || isPowerSave || !activeCursor) {
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

    // Infernal Embers particle generator
    const createEmber = (x: number, y: number) => {
      const emberColors = ["#ef4444", "#f97316", "#f59e0b", "#fbbf24", "#dc2626", "#fed7aa"]
      const color = emberColors[Math.floor(Math.random() * emberColors.length)]
      return {
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 1.8,
        vy: -Math.random() * 2.2 - 0.8, // buoyant upward rise
        size: Math.random() * 4 + 2,
        alpha: 1,
        color,
        life: 0,
        maxLife: Math.random() * 26 + 18
      }
    }

    // Sakura Blossom Petal particle generator
    const createSakuraPetal = (x: number, y: number) => {
      const sakuraColors = ["#fda4af", "#f472b6", "#fbcfe8", "#ec4899", "#f43f5e"]
      const color = sakuraColors[Math.floor(Math.random() * sakuraColors.length)]
      return {
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 1.6,
        vy: Math.random() * 1.3 + 0.6, // gentle flutter fall
        size: Math.random() * 3.5 + 3.5,
        alpha: 0.95,
        color,
        life: 0,
        maxLife: Math.random() * 45 + 30,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.08
      }
    }

    // Lightning Arc spark generator
    const createLightningSpark = (x: number, y: number) => {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * 22 + 10
      const midDist = dist * 0.5
      const midX = x + Math.cos(angle) * midDist + (Math.random() - 0.5) * 12
      const midY = y + Math.sin(angle) * midDist + (Math.random() - 0.5) * 12
      const endX = x + Math.cos(angle) * dist + (Math.random() - 0.5) * 8
      const endY = y + Math.sin(angle) * dist + (Math.random() - 0.5) * 8
      const boltColors = ["#00f0ff", "#38bdf8", "#67e8f9", "#ffffff"]
      const color = boltColors[Math.floor(Math.random() * boltColors.length)]

      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.4 + 1.2,
        alpha: 1,
        color,
        life: 0,
        maxLife: Math.random() * 10 + 6, // fast discharge
        points: [{ x, y }, { x: midX, y: midY }, { x: endX, y: endY }]
      }
    }

    // Quantum Matrix Glyph generator
    const createMatrixGlyph = (x: number, y: number) => {
      const chars = ["0", "1", "7", "X", "Z", "9", "λ", "Ω", "Ψ", "✦", "0x", "10", "§"]
      const char = chars[Math.floor(Math.random() * chars.length)]
      const matrixColors = ["#4ade80", "#22c55e", "#86efac", "#a7f3d0", "#ffffff"]
      const color = matrixColors[Math.floor(Math.random() * matrixColors.length)]

      return {
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 0.3,
        vy: Math.random() * 1.6 + 0.8, // falls downward
        size: Math.random() * 2 + 11, // font size
        alpha: 1,
        color,
        life: 0,
        maxLife: Math.random() * 32 + 20,
        char
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
        } else if (activeCursor === "cursor-inferno" && Math.random() < 0.7) {
          particles.push(createEmber(mouse.targetX, mouse.targetY))
          if (Math.random() < 0.35) {
            particles.push(createEmber(mouse.targetX, mouse.targetY))
          }
        } else if (activeCursor === "cursor-sakura" && Math.random() < 0.5) {
          particles.push(createSakuraPetal(mouse.targetX, mouse.targetY))
        } else if (activeCursor === "cursor-lightning" && Math.random() < 0.6) {
          particles.push(createLightningSpark(mouse.targetX, mouse.targetY))
        } else if (activeCursor === "cursor-matrix" && Math.random() < 0.6) {
          particles.push(createMatrixGlyph(mouse.targetX, mouse.targetY))
        }
        mouse.moved = false
      }

      // 1. Render dynamic particle effects
      const isParticleTrail = 
        activeCursor === "cursor-sparkles" || 
        activeCursor === "cursor-bubbles" ||
        activeCursor === "cursor-inferno" ||
        activeCursor === "cursor-sakura" ||
        activeCursor === "cursor-lightning" ||
        activeCursor === "cursor-matrix"

      if (isParticleTrail) {
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]
          p.x += p.vx
          p.y += p.vy

          if (activeCursor === "cursor-bubbles") {
            p.vx += Math.sin(p.life / 10) * 0.05
            p.size += 0.02
          } else if (activeCursor === "cursor-inferno") {
            p.vy -= 0.03 // accelerating heat draft
            p.vx += (Math.random() - 0.5) * 0.2
            p.size = Math.max(0.4, p.size * 0.98)
          } else if (activeCursor === "cursor-sakura") {
            p.vx += Math.sin(p.life / 8) * 0.06
            p.angle = (p.angle || 0) + (p.spin || 0.02)
          } else if (activeCursor === "cursor-lightning") {
            p.vx = (Math.random() - 0.5) * 0.6
            p.vy = (Math.random() - 0.5) * 0.6
          } else if (activeCursor === "cursor-matrix") {
            p.vy += 0.02
          } else {
            // Sparkles gravity
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
          } else if (activeCursor === "cursor-bubbles") {
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
          } else if (activeCursor === "cursor-inferno") {
            // Fiery molten ember particle with radiant heat center
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fillStyle = p.color
            ctx.shadowBlur = 9
            ctx.shadowColor = "#f97316"
            ctx.globalAlpha = p.alpha
            ctx.fill()

            if (p.size > 2) {
              ctx.beginPath()
              ctx.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2)
              ctx.fillStyle = "#ffffff"
              ctx.globalAlpha = p.alpha * 0.85
              ctx.fill()
            }
          } else if (activeCursor === "cursor-sakura") {
            // Delicate rotating cherry blossom petal
            ctx.translate(p.x, p.y)
            ctx.rotate(p.angle || 0)
            ctx.beginPath()
            ctx.moveTo(0, -p.size)
            ctx.quadraticCurveTo(p.size * 0.75, -p.size * 0.3, p.size * 0.45, p.size * 0.65)
            ctx.quadraticCurveTo(0, p.size, -p.size * 0.45, p.size * 0.65)
            ctx.quadraticCurveTo(-p.size * 0.75, -p.size * 0.3, 0, -p.size)
            ctx.closePath()
            ctx.fillStyle = p.color
            ctx.shadowBlur = 6
            ctx.shadowColor = "rgba(244, 63, 94, 0.55)"
            ctx.globalAlpha = p.alpha * 0.9
            ctx.fill()
          } else if (activeCursor === "cursor-lightning") {
            // Electric jagged plasma bolt
            if (p.points && p.points.length > 1) {
              ctx.beginPath()
              ctx.moveTo(p.points[0].x, p.points[0].y)
              for (let pt = 1; pt < p.points.length; pt++) {
                ctx.lineTo(p.points[pt].x, p.points[pt].y)
              }
              ctx.strokeStyle = p.color
              ctx.lineWidth = p.size
              ctx.shadowBlur = 10
              ctx.shadowColor = "#00f0ff"
              ctx.globalAlpha = p.alpha
              ctx.stroke()

              // White electric core
              ctx.lineWidth = Math.max(0.6, p.size * 0.45)
              ctx.strokeStyle = "#ffffff"
              ctx.stroke()
            }
          } else if (activeCursor === "cursor-matrix") {
            // Glowing digital matrix character
            ctx.font = `bold ${Math.round(p.size)}px "Courier New", monospace`
            ctx.fillStyle = p.color
            ctx.shadowBlur = 7
            ctx.shadowColor = "#22c55e"
            ctx.globalAlpha = p.alpha
            ctx.fillText(p.char || "1", p.x, p.y)
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
  }, [activeCursor, isPowerSave, isTouchDevice])

  if (isTouchDevice || isPowerSave || !activeCursor) return null

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
