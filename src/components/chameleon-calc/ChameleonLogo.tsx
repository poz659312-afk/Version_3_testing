"use client";

import React from "react";

interface ChameleonLogoProps {
  className?: string;
  size?: number;
}

export default function ChameleonLogo({ className = "", size = 56 }: ChameleonLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center select-none rounded-full bg-primary/20 p-1 border-2 border-primary/40 shadow-lg shadow-primary/20 backdrop-blur transition-all duration-300 hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-primary"
        style={{
          boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <img
          src="/images/chameleon.png"
          alt="Chameleon Logo"
          className="w-full h-full object-cover rounded-full select-none"
        />
      </div>
    </div>
  );
}
