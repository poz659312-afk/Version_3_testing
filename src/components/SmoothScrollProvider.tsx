"use client"

import { ReactLenis } from "lenis/react"
import { ReactNode } from "react"

/**
 * SmoothScrollProvider component that wraps the application with Lenis smooth scrolling.
 * Provides a buttery-smooth scrolling experience consistent across all browsers.
 * Native touch scrolling is preserved on mobile by default for better performance.
 */
export default function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis 
      root 
      options={{
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Power 4 easing
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
      }}
    >
      {children}
    </ReactLenis>
  )
}
