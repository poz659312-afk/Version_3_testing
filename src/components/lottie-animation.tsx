"use client"

import { useEffect, useRef, useState } from "react"
<<<<<<< HEAD
=======
import Script from "next/script"
>>>>>>> 16d5d685 (Performance optimizations)
import { cn } from "@/lib/utils"

interface LottieAnimationProps {
  src: string
  className?: string
  loop?: boolean
  autoplay?: boolean
  speed?: number
  background?: string
  width?: string
  height?: string
  renderer?: "canvas" | "svg"
  playOnHover?: boolean
}

export default function LottieAnimation({
  src,
  className = "w-full h-full",
  loop = true,
  autoplay = true,
  speed = 1,
  background = "transparent",
  width = "100%",
  height = "100%",
  renderer = "canvas",
  playOnHover = false,
}: LottieAnimationProps) {
  const [mounted, setMounted] = useState(false)

  // Proxy the URL if it's from lottie.host to bypass CORS
  const proxiedSrc = src.startsWith("https://lottie.host/")
    ? src.replace("https://lottie.host/", "/lottie-proxy/")
    : src

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn("relative overflow-hidden bg-primary/5 animate-pulse rounded-2xl", className)} style={{ width, height }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
<<<<<<< HEAD
    <div className={cn("relative overflow-hidden", className)} style={{ width, height }}>
      <dotlottie-player
        src={proxiedSrc}
        background={background}
        speed={speed}
        renderer={renderer}
        style={{ width, height }}
        {...(loop ? { loop: true } : {})}
        {...(autoplay && !playOnHover ? { autoplay: true } : {})}
        {...(playOnHover ? { interactMode: "hover" } : {})}
      />
    </div>
=======
    <>
      <Script 
        src="https://cdn.jsdelivr.net/npm/@dotlottie/player-component@2.7.12/dist/dotlottie-player.js" 
        strategy="lazyOnload"
      />
      <div className={cn("relative overflow-hidden", className)} style={{ width, height }}>
        <dotlottie-player
          src={proxiedSrc}
          background={background}
          speed={speed}
          renderer={renderer}
          style={{ width, height }}
          {...(loop ? { loop: true } : {})}
          {...(autoplay && !playOnHover ? { autoplay: true } : {})}
          {...(playOnHover ? { interactMode: "hover" } : {})}
        />
      </div>
    </>
>>>>>>> 16d5d685 (Performance optimizations)
  )
}
