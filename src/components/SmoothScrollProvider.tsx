"use client"

import { ReactLenis } from "lenis/react"
import { ReactNode, useEffect, useState } from "react"

/**
 * SmoothScrollProvider component that wraps the application with Lenis smooth scrolling.
 * Provides a buttery-smooth scrolling experience consistent across all browsers.
 * Native touch scrolling is preserved on mobile by default for better performance.
 */
export default function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [isLowEnd, setIsLowEnd] = useState(true)

  useEffect(() => {
    // Check local preferences first
    const checkSettings = () => {
      const isEnabled = localStorage.getItem('chameleon_smooth_scroll') !== 'false'
      const isPowerSave = localStorage.getItem('chameleon_perf_mode') === 'power-save'
      const isGlassmorphismOff = localStorage.getItem('chameleon_glassmorphism') === 'false'
      
      const root = document.documentElement;
      if (isPowerSave) {
        root.classList.add('power-save-mode');
      } else {
        root.classList.remove('power-save-mode');
      }
      
      if (isGlassmorphismOff || isPowerSave) {
        root.classList.add('no-glassmorphism');
      } else {
        root.classList.remove('no-glassmorphism');
      }

      // Hardware heuristics
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const isLowPower = hardwareConcurrency < 4;
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Disable if the user explicitly turned it off, is in power-save mode, or if hardware constraints apply
      setIsLowEnd(!isEnabled || isPowerSave || isMobile || isLowPower || prefersReducedMotion);
    }
    
    checkSettings()
    window.addEventListener('chameleon_visual_settings_changed', checkSettings)
    window.addEventListener('storage', checkSettings)
    
    return () => {
      window.removeEventListener('chameleon_visual_settings_changed', checkSettings)
      window.removeEventListener('storage', checkSettings)
    }
  }, []);

  if (isLowEnd) {
    return <>{children}</>
  }

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
