"use client"

import { ReactLenis } from "lenis/react"
<<<<<<< HEAD
import { ReactNode } from "react"
=======
import { ReactNode, useEffect, useState } from "react"
>>>>>>> 16d5d685 (Performance optimizations)

/**
 * SmoothScrollProvider component that wraps the application with Lenis smooth scrolling.
 * Provides a buttery-smooth scrolling experience consistent across all browsers.
 * Native touch scrolling is preserved on mobile by default for better performance.
 */
export default function SmoothScrollProvider({ children }: { children: ReactNode }) {
<<<<<<< HEAD
=======
  const [isLowEnd, setIsLowEnd] = useState(true)

  useEffect(() => {
    // Disable smooth scrolling on low-end devices or mobile devices to prevent stuttering
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const isLowPower = hardwareConcurrency < 4;
    
    // Check if the user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setIsLowEnd(isMobile || isLowPower || prefersReducedMotion);
  }, []);

  if (isLowEnd) {
    return <>{children}</>
  }

>>>>>>> 16d5d685 (Performance optimizations)
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
