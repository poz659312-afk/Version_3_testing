// src/components/chameleon-calc/ChameleonLogo.tsx
"use client";

import React from "react";

interface ChameleonLogoProps {
  className?: string;
  size?: number;
}

export default function ChameleonLogo({ className = "", size = 60 }: ChameleonLogoProps) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.35)] transition-all duration-500 hover:scale-105 hover:rotate-3"
      >
        <defs>
          {/* Chameleon Color Shifting Gradient */}
          <linearGradient id="chameleonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="animate-gradient-stop-1" stopColor="#10B981" />
            <stop offset="50%" className="animate-gradient-stop-2" stopColor="#3B82F6" />
            <stop offset="100%" className="animate-gradient-stop-3" stopColor="#8B5CF6" />
          </linearGradient>

          {/* Secondary Shifting Gradient */}
          <linearGradient id="chameleonGradSec" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" className="animate-gradient-stop-3" stopColor="#8B5CF6" />
            <stop offset="50%" className="animate-gradient-stop-2" stopColor="#3B82F6" />
            <stop offset="100%" className="animate-gradient-stop-1" stopColor="#10B981" />
          </linearGradient>

          {/* Grid Pattern */}
          <pattern id="logoGrid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.75" />
          </pattern>
        </defs>

        <style>{`
          .animate-gradient-stop-1 {
            animation: colorMorph1 8s infinite alternate ease-in-out;
          }
          .animate-gradient-stop-2 {
            animation: colorMorph2 8s infinite alternate ease-in-out;
          }
          .animate-gradient-stop-3 {
            animation: colorMorph3 8s infinite alternate ease-in-out;
          }
          @keyframes colorMorph1 {
            0% { stop-color: #10B981; }
            33% { stop-color: #8B5CF6; }
            66% { stop-color: #F59E0B; }
            100% { stop-color: #EC4899; }
          }
          @keyframes colorMorph2 {
            0% { stop-color: #3B82F6; }
            33% { stop-color: #10B981; }
            66% { stop-color: #EF4444; }
            100% { stop-color: #8B5CF6; }
          }
          @keyframes colorMorph3 {
            0% { stop-color: #8B5CF6; }
            33% { stop-color: #EC4899; }
            66% { stop-color: #3B82F6; }
            100% { stop-color: #10B981; }
          }
          .logo-sine {
            stroke-dasharray: 600;
            stroke-dashoffset: 0;
            animation: sineDraw 4s infinite linear;
          }
          .logo-eye {
            transform-origin: 145px 75px;
            animation: lookAround 6s infinite ease-in-out;
          }
          @keyframes lookAround {
            0%, 100% { transform: scale(1) translate(0, 0); }
            20% { transform: scale(1.1) translate(1px, -1px); }
            40% { transform: scale(1) translate(-2px, 0); }
            60% { transform: scale(1.05) translate(0, 2px); }
            80% { transform: scale(1) translate(2px, 1px); }
          }
        `}</style>

        {/* 1. Background Coordinate Circle */}
        <circle cx="100" cy="100" r="90" fill="rgba(15, 23, 42, 0.45)" stroke="url(#chameleonGrad)" strokeWidth="2.5" />
        
        {/* Faint math radial coordinate guidelines */}
        <circle cx="100" cy="100" r="70" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="100" cy="100" r="50" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
        
        {/* Coordinate Axes */}
        <line x1="100" y1="15" x2="100" y2="185" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
        <line x1="15" y1="100" x2="185" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

        {/* 2. Chameleon Body & Tail (Constructed using a mix of grid lines and curves) */}
        {/* Tail: Logarithmic Spiral */}
        <path
          d="M 50 140 C 25 140, 15 110, 25 85 C 35 60, 65 50, 85 65 C 105 80, 105 110, 90 120 C 75 130, 60 115, 65 100 C 70 85, 85 85, 85 95 C 85 100, 80 100, 80 95 C 80 92, 74 92, 73 98 C 72 104, 80 110, 86 104 C 92 98, 92 82, 78 74 C 64 66, 42 74, 35 91 C 28 108, 38 126, 52 127 C 66 128, 77 122, 90 127"
          stroke="url(#chameleonGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Body Base with grid pattern inside */}
        <path
          d="M 90 127 C 98 132, 108 132, 116 127 C 126 121, 133 110, 140 100 C 150 92, 160 92, 170 80 C 160 70, 140 68, 125 75 C 105 85, 95 110, 90 127 Z"
          fill="url(#logoGrid)"
        />

        {/* Body Spine (Styled as a Sine Wave curve: y = sin(x) on Chameleon Back) */}
        <path
          d="M 90 127 C 98 110, 103 100, 110 88 C 117 76, 125 76, 132 82 C 140 88, 147 88, 154 80 C 161 72, 166 70, 172 75"
          stroke="url(#chameleonGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
          className="logo-sine"
        />

        {/* Head: Geometric Polygon */}
        <path
          d="M 148 90 L 175 70 L 180 88 L 165 105 L 148 90 Z"
          fill="url(#chameleonGrad)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />
        
        {/* Jaw */}
        <path
          d="M 148 90 L 155 108 L 165 105 Z"
          fill="url(#chameleonGradSec)"
          opacity="0.8"
        />

        {/* 3. Chameleon Eye (Math Theta/Circle design) */}
        <g className="logo-eye">
          <circle cx="163" cy="85" r="9" fill="#0F172A" stroke="url(#chameleonGrad)" strokeWidth="2" />
          {/* Pupil / Horizontal Theta Line */}
          <circle cx="163" cy="85" r="3.5" fill="url(#chameleonGradSec)" />
          <line x1="157" y1="85" x2="169" y2="85" stroke="url(#chameleonGrad)" strokeWidth="1" />
        </g>

        {/* 4. Chameleon Legs (Styled as right triangles / coordinates symbols) */}
        {/* Front Leg */}
        <path d="M 140 100 L 140 125 L 147 125 Z" fill="url(#chameleonGrad)" strokeLinejoin="round" />
        {/* Back Leg */}
        <path d="M 108 123 L 100 145 L 107 145 Z" fill="url(#chameleonGradSec)" strokeLinejoin="round" />

        {/* 5. Mathematical Function Graph lines floating out of the mouth */}
        <path
          d="M 172 98 Q 185 105, 192 95 T 205 110"
          stroke="url(#chameleonGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}
