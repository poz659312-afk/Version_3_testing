"use client"

// Animated background simplified — no dynamic imports required
interface AnimatedBackgroundProps {
  color?: [number, number, number];
  mouseReact?: boolean;
  amplitude?: number;
  speed?: number;
  className?: string;
}

export default function AnimatedBackground({ className = "" }: AnimatedBackgroundProps) {
  return (
    <div className={`absolute inset-0 w-full h-full -z-10 ${className}`}>
      {/* Static background fallback to avoid continuous shader/canvas animation */}
      <div className="absolute inset-0 bg-linear-to-t from-[#030303] via-transparent to-transparent pointer-events-none" />
    </div>
  )
}