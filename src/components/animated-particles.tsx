"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  color: string
}

export default function AnimatedParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const colors = [
<<<<<<< HEAD
      "rgba(139, 92, 246, 0.6)",  // purple
      "rgba(236, 72, 153, 0.6)",  // pink
      "rgba(59, 130, 246, 0.6)",  // blue
      "rgba(16, 185, 129, 0.5)",  // emerald
      "rgba(245, 158, 11, 0.5)", // amber
=======
      { r: 139, g: 92, b: 246 },  // purple
      { r: 236, g: 72, b: 153 },  // pink
      { r: 59, g: 130, b: 246 },  // blue
      { r: 16, g: 185, b: 129 },  // emerald
      { r: 245, g: 158, b: 11 },  // amber
>>>>>>> 16d5d685 (Performance optimizations)
    ]

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const createParticles = () => {
      const particleCount = Math.min(100, Math.floor((window.innerWidth * window.innerHeight) / 15000))
      particlesRef.current = []

      for (let i = 0; i < particleCount; i++) {
<<<<<<< HEAD
=======
        const color = colors[Math.floor(Math.random() * colors.length)];
>>>>>>> 16d5d685 (Performance optimizations)
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.2,
<<<<<<< HEAD
          color: colors[Math.floor(Math.random() * colors.length)]
=======
          color: `rgba(${color.r}, ${color.g}, ${color.b}, ` // Store base without opacity
>>>>>>> 16d5d685 (Performance optimizations)
        })
      }
    }

    const drawParticle = (particle: Particle) => {
      if (!ctx) return

      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
<<<<<<< HEAD
      ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${particle.opacity})`)
      ctx.fill()

      // Add glow effect
      ctx.shadowBlur = 15
      ctx.shadowColor = particle.color
      ctx.fill()
      ctx.shadowBlur = 0
=======
      ctx.fillStyle = `${particle.color}${particle.opacity})`
      ctx.fill()
      
      // Draw a highly transparent larger circle for glow instead of using expensive shadowBlur
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size * 2.5, 0, Math.PI * 2)
      ctx.fillStyle = `${particle.color}${particle.opacity * 0.2})`
      ctx.fill()
>>>>>>> 16d5d685 (Performance optimizations)
    }

    const connectParticles = () => {
      if (!ctx) return

      const particles = particlesRef.current
<<<<<<< HEAD
=======
      const maxDistSq = 120 * 120;
>>>>>>> 16d5d685 (Performance optimizations)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
<<<<<<< HEAD
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 120) {
=======
          const distSq = dx * dx + dy * dy

          if (distSq < maxDistSq) {
            const distance = Math.sqrt(distSq)
>>>>>>> 16d5d685 (Performance optimizations)
            const opacity = (1 - distance / 120) * 0.15
            ctx.beginPath()
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

<<<<<<< HEAD
=======
      const now = Date.now() * 0.001
      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const w = canvas.width
      const h = canvas.height

>>>>>>> 16d5d685 (Performance optimizations)
      particlesRef.current.forEach((particle) => {
        // Move particle
        particle.x += particle.speedX
        particle.y += particle.speedY

        // Mouse interaction - subtle attraction
<<<<<<< HEAD
        const dx = mouseRef.current.x - particle.x
        const dy = mouseRef.current.y - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 200) {
=======
        const dx = mx - particle.x
        const dy = my - particle.y
        const distSq = dx * dx + dy * dy
        
        if (distSq < 40000) { // 200 * 200
          const distance = Math.sqrt(distSq)
>>>>>>> 16d5d685 (Performance optimizations)
          const force = (200 - distance) / 200
          particle.speedX += (dx / distance) * force * 0.02
          particle.speedY += (dy / distance) * force * 0.02
        }

        // Apply friction
        particle.speedX *= 0.99
        particle.speedY *= 0.99

        // Boundary check with wrap-around
<<<<<<< HEAD
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Subtle opacity pulsing
        particle.opacity = 0.3 + Math.sin(Date.now() * 0.001 + particle.x * 0.01) * 0.2
=======
        if (particle.x < 0) particle.x = w
        if (particle.x > w) particle.x = 0
        if (particle.y < 0) particle.y = h
        if (particle.y > h) particle.y = 0

        // Subtle opacity pulsing
        particle.opacity = 0.3 + Math.sin(now + particle.x * 0.01) * 0.2
>>>>>>> 16d5d685 (Performance optimizations)

        drawParticle(particle)
      })

      connectParticles()
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    resizeCanvas()
    createParticles()
    animate()

<<<<<<< HEAD
    window.addEventListener("resize", () => {
      resizeCanvas()
      createParticles()
    })
=======
    const handleResize = () => {
      resizeCanvas()
      createParticles()
    }

    window.addEventListener("resize", handleResize)
>>>>>>> 16d5d685 (Performance optimizations)
    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
<<<<<<< HEAD
      window.removeEventListener("resize", resizeCanvas)
=======
      window.removeEventListener("resize", handleResize)
>>>>>>> 16d5d685 (Performance optimizations)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ background: "transparent" }}
    />
  )
}
