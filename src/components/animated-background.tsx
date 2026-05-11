"use client"

<<<<<<< HEAD
import Iridescence from './Iridescence'
=======
import dynamic from "next/dynamic"

const Iridescence = dynamic(() => import('./Iridescence'), { 
  ssr: false 
})
>>>>>>> 16d5d685 (Performance optimizations)

interface AnimatedBackgroundProps {
  color?: [number, number, number];
  mouseReact?: boolean;
  amplitude?: number;
  speed?: number;
  className?: string;
}

export default function AnimatedBackground({
  color = [0.5, 0.6, 0.8],
  mouseReact = false,
  amplitude = 0.1,
  speed = 1.0,
  className = "",
}: AnimatedBackgroundProps) {
  return (
    <div className={`absolute inset-0 w-full h-full -z-10 ${className}`}>
      <Iridescence
        color={color}
        mouseReact={mouseReact}
        amplitude={amplitude}
        speed={speed}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent pointer-events-none" />
    </div>
  )
}