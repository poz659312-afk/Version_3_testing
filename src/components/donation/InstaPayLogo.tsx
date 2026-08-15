"use client"

import React from "react"
import Image from "next/image"

interface InstaPayLogoProps {
  className?: string
  size?: number
  showText?: boolean
}

export function InstaPayLogo({
  className = "",
  size = 34,
  showText = true,
}: InstaPayLogoProps) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      dir="ltr"
    >
      {/* Authentic Official InstaPay Emblem */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-xl bg-white p-1 shadow-xs border border-slate-200/80 dark:border-white/10 overflow-hidden"
        style={{
          width: size,
          height: size,
        }}
      >
        <Image
          src="/images/instapay-logo.png"
          alt="Official InstaPay Logo"
          fill
          sizes={`${size}px`}
          className="object-contain p-0.5"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center tracking-tight font-black text-sm sm:text-base font-sans">
            <span className="text-slate-900 dark:text-white">Insta</span>
            <span className="text-[#ea580c] dark:text-[#F58220]">Pay</span>
          </div>
          <span className="text-[9px] text-purple-700/80 dark:text-purple-300/80 font-semibold tracking-wider uppercase">
            Official IPN
          </span>
        </div>
      )}
    </div>
  )
}
