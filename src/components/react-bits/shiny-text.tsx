"use client"

import { cn } from "@/lib/utils";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export function ShinyText({ text, disabled = false, speed = 5, className = "" }: ShinyTextProps) {
  const animationDuration = `${speed}s`;

  return (
    <>
      <style>{`
        @keyframes shine {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-shiny-text {
          background-size: 200% auto;
          animation: shine var(--shine-speed, 5s) linear infinite;
        }
      `}</style>
      <span
        className={cn(
          "text-foreground/40 bg-clip-text bg-gradient-to-r from-foreground/40 via-foreground to-foreground/40 inline-block text-transparent",
          !disabled && "animate-shiny-text",
          className
        )}
        style={{
          "--shine-speed": animationDuration,
        } as React.CSSProperties}
      >
        {text}
      </span>
    </>
  );
}
