"use client"

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TiltedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  maxRotate?: number;
  perspective?: number;
  scale?: number;
}

export function TiltedCard({
  children,
  className,
  maxRotate = 8,
  perspective = 1000,
  scale = 1.015,
  ...props
}: TiltedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    const rotateX = (-mouseY / (height / 2)) * maxRotate;
    const rotateY = (mouseX / (width / 2)) * maxRotate;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  const transformStyle = isHovered
    ? `perspective(${perspective}px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${scale}, ${scale}, ${scale})`
    : `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "transition-transform duration-200 ease-out will-change-transform",
        className
      )}
      style={{
        transform: transformStyle,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
