"use client"

import React, { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Heart, Sparkles, ChevronLeft } from "lucide-react"
import { DonationBottomSheet } from "./DonationBottomSheet"
import { DEFAULT_DONATION_CONFIG, type DonationConfig } from "./donation-config"

export interface DonationBannerProps {
  /** Custom class name for outer container styling */
  className?: string
  /** Override the InstaPay account username handle */
  instapayUsername?: string
  /** Override the InstaPay QR code payload */
  instapayQrData?: string
  /** Override deep-link URL or protocol */
  instapayDeepLink?: string
  /** Override official InstaPay QR code image */
  instapayQrImage?: string
  /** Path to Chameleon 3D mascot image */
  mascotSrc?: string
  /** Custom copy overrides */
  copy?: Partial<DonationConfig["copy"]["banner"]>
  /** Custom copy overrides for bottom sheet */
  sheetCopy?: Partial<DonationConfig["copy"]["bottomSheet"]>
  /** Callback fired when user clicks CTA button */
  onCtaClick?: () => void
}

export function DonationBanner({
  className = "",
  instapayUsername = DEFAULT_DONATION_CONFIG.instapayUsername,
  instapayQrData = DEFAULT_DONATION_CONFIG.instapayQrData,
  instapayDeepLink = DEFAULT_DONATION_CONFIG.instapayDeepLink,
  instapayQrImage = DEFAULT_DONATION_CONFIG.instapayQrImage,
  mascotSrc = "/images/chameleon/18_chameleon_helping.png",
  copy: customCopy,
  sheetCopy,
  onCtaClick,
}: DonationBannerProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const bannerCopy = {
    ...DEFAULT_DONATION_CONFIG.copy.banner,
    ...customCopy,
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Handle CTA Click
  const handleOpenSheet = useCallback(() => {
    setIsSheetOpen(true)
    if (onCtaClick) {
      onCtaClick()
    }
  }, [onCtaClick])

  if (!isMounted) {
    return null
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        dir="rtl"
        aria-label="رسالة دعم مجتمع Chameleon"
        className={`relative w-full my-6 p-5 sm:p-7 rounded-3xl overflow-hidden border border-purple-200/90 dark:border-purple-500/25 bg-gradient-to-br from-[#f8f9ff] via-[#f3f4fd] to-[#f9f5ff] dark:from-[#0e1222]/90 dark:via-[#0a0d18]/95 dark:to-[#130b24]/90 backdrop-blur-xl shadow-xl shadow-purple-950/10 dark:shadow-purple-950/20 text-right ${className}`}
      >
        {/* Ambient Background Glows */}
        <div
          className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-purple-400/15 dark:bg-purple-600/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-blue-400/15 dark:bg-blue-600/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 dark:via-purple-400/30 to-transparent"
          aria-hidden="true"
        />

        {/* Top Community Badge */}
        <div className="flex items-center justify-start gap-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/80 border border-purple-200 text-purple-800 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>مجتمع Chameleon الطلابي</span>
          </div>
        </div>

        {/* Main Content Layout: Mascot + Copy + CTA */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 lg:gap-8">
          {/* Static 3D Mascot (18_chameleon_helping - Larger, No Animation) */}
          <div className="relative shrink-0 flex items-center justify-center self-center md:self-start">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44">
              {/* Mascot ambient spotlight */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-400/20 to-blue-400/20 dark:from-purple-500/25 dark:to-blue-500/20 blur-xl" />
              <div className="relative w-full h-full">
                <Image
                  src={mascotSrc}
                  alt="Chameleon Helping Mascot"
                  fill
                  sizes="(max-width: 768px) 144px, 176px"
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Text Information Hierarchy */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-right space-y-2.5">
            {/* Main Headline */}
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug font-sans">
              {bannerCopy.headline}
            </h3>

            {/* Supporting Text */}
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200/90 leading-relaxed max-w-2xl font-sans">
              {bannerCopy.supportingText}
            </p>

            {/* Small Secondary Community Text */}
            <p className="text-xs sm:text-sm text-purple-800/85 dark:text-purple-200/70 leading-relaxed font-sans">
              {bannerCopy.secondaryText}
            </p>

            {/* Action CTA Button */}
            <div className="pt-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleOpenSheet}
                className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-purple-900/40 border border-purple-400/30 transition-all outline-none focus-visible:ring-2 focus-visible:ring-purple-400 cursor-pointer"
              >
                <Heart className="w-4 h-4 text-pink-300 fill-pink-300 group-hover:scale-110 transition-transform" />
                <span>{bannerCopy.ctaButton}</span>
                <ChevronLeft className="w-4 h-4 text-purple-200 group-hover:-translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Linked Google Pay-style Rectangular Modal */}
      <DonationBottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        instapayUsername={instapayUsername}
        instapayQrData={instapayQrData}
        instapayQrImage={instapayQrImage}
        instapayDeepLink={instapayDeepLink}
        copy={sheetCopy}
      />
    </>
  )
}
