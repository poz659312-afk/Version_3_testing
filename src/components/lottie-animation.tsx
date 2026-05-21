"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface LottieAnimationProps {
  src: string
  className?: string
  width?: string
  height?: string
}

// To reduce heavy animations we no longer load the dotlottie player by default.
// This component now renders a static image fallback to avoid hydration and expensive animations.
export default function LottieAnimation({
  src,
  className = "w-full h-full",
  width = "100%",
  height = "100%",
}: LottieAnimationProps) {
  // Use a conservative static fallback image (chameleon logo) instead of the animation
  const fallback = "/images/chameleon.png"

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ width, height }}>
      <Image src={fallback} alt="Chameleon" width={120} height={120} className="object-contain mx-auto" />
    </div>
  )
}
