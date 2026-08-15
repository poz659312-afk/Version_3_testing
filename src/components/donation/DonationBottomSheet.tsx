"use client"

import React, { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, Copy, Check, ExternalLink, ShieldCheck, Heart } from "lucide-react"
import { QRCodeSVG } from "./QRCodeSVG"
import { InstaPayLogo } from "./InstaPayLogo"
import { DEFAULT_DONATION_CONFIG, type DonationConfig } from "./donation-config"
import { useToast } from "@/components/ToastProvider"

export interface DonationBottomSheetProps {
  /** Controls open/closed visibility state */
  isOpen: boolean
  /** Callback fired when the bottom sheet requests to close */
  onClose: () => void
  /** InstaPay username handle (defaults to config) */
  instapayUsername?: string
  /** InstaPay QR code data payload (defaults to config) */
  instapayQrData?: string
  /** Path to official InstaPay QR image */
  instapayQrImage?: string
  /** Deep-link URL or protocol for InstaPay */
  instapayDeepLink?: string
  /** Mascot image path */
  mascotSrc?: string
  /** Custom copy overrides */
  copy?: Partial<DonationConfig["copy"]["bottomSheet"]>
}

export function DonationBottomSheet({
  isOpen,
  onClose,
  instapayUsername = DEFAULT_DONATION_CONFIG.instapayUsername,
  instapayQrData = DEFAULT_DONATION_CONFIG.instapayQrData,
  instapayQrImage = DEFAULT_DONATION_CONFIG.instapayQrImage,
  instapayDeepLink = DEFAULT_DONATION_CONFIG.instapayDeepLink,
  mascotSrc = "/images/chameleon/18_chameleon_helping.png",
  copy: customCopy,
}: DonationBottomSheetProps) {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const copyConfig = {
    ...DEFAULT_DONATION_CONFIG.copy.bottomSheet,
    ...customCopy,
  }

  // Safe toast accessor
  let addToast: ((msg: string, type?: "success" | "error" | "info") => void) | null = null
  try {
    const toastContext = useToast()
    addToast = toastContext.addToast
  } catch {
    // Graceful fallback
  }

  // Handle keyboard ESC key press & body lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  // Reset copied state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setCopied(false)
    }
  }, [isOpen])

  // Copy username to clipboard with haptic feedback & toast
  const handleCopyUsername = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(instapayUsername)
      setCopied(true)
      if (addToast) {
        addToast(`تم نسخ اسم المستخدم: ${instapayUsername}`, "success")
      }
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
      const textarea = document.createElement("textarea")
      textarea.value = instapayUsername
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      if (addToast) {
        addToast(`تم نسخ اسم المستخدم: ${instapayUsername}`, "success")
      }
      setTimeout(() => setCopied(false), 2500)
    }
  }, [instapayUsername, addToast])

  // Open InstaPay app or deep link
  const handleOpenInstaPay = useCallback(() => {
    if (instapayDeepLink) {
      window.location.href = instapayDeepLink
    } else {
      handleCopyUsername()
    }
  }, [instapayDeepLink, handleCopyUsername])

  if (!mounted || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-hidden"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="donation-sheet-title"
        >
          {/* Backdrop Dim & Blur - Escapes any stacking context to stay in front of navbar */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md z-[99998]"
            aria-hidden="true"
          />

          {/* Compact, Rectangular, Zero-Overflow Theme-Sensitive Modal Window */}
          <motion.div
            key="sheet-content"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 360,
              mass: 0.5,
            }}
            className="relative z-[99999] w-full max-w-[400px] sm:max-w-[420px] bg-white dark:bg-[#0c101c] border border-purple-200/90 dark:border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-950/15 dark:shadow-purple-950/70 backdrop-blur-2xl overflow-hidden flex flex-col text-right select-none"
          >
            {/* Ambient Top Glow Accent */}
            <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-purple-500/10 via-blue-500/5 to-transparent dark:from-purple-600/20 dark:via-blue-600/10 pointer-events-none" />

            {/* Header: Title with 18_chameleon_helping Mascot & Close Button */}
            <div className="relative px-4 pt-3 pb-2 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 shrink-0">
                  <Image
                    src={mascotSrc}
                    alt="Chameleon Helping"
                    fill
                    sizes="40px"
                    className="object-contain drop-shadow-md"
                    priority
                  />
                </div>
                <div>
                  <h2
                    id="donation-sheet-title"
                    className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-normal font-sans"
                  >
                    {copyConfig.heading}
                  </h2>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label={copyConfig.closeAriaLabel}
                className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:bg-white/5 dark:hover:bg-white/10 active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - 100% No Overflow / No Scrollbar */}
            <div className="px-4 py-3 space-y-2.5">
              {/* Short friendly sentence */}
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300/85 leading-relaxed font-sans">
                {copyConfig.subheading}
              </p>

              {/* InstaPay Card Container */}
              <div className="rounded-xl bg-gradient-to-br from-purple-50/80 via-slate-50 to-indigo-50/50 dark:from-purple-950/40 dark:via-slate-900/60 dark:to-purple-950/20 border border-purple-200/80 dark:border-purple-500/25 p-3 space-y-2.5">
                {/* Branding & Status */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-purple-100 dark:border-white/10">
                  <InstaPayLogo size={28} />
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    <span>حساب رسمي</span>
                  </div>
                </div>

                {/* Username Pill with One-Click Copy */}
                <div className="flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-lg bg-white dark:bg-black/50 border border-purple-200/80 dark:border-white/10 shadow-xs">
                  <div
                    className="font-mono text-xs sm:text-sm font-semibold text-purple-900 dark:text-purple-200 tracking-wide select-all text-left truncate pl-1"
                    dir="ltr"
                  >
                    {instapayUsername}
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyUsername}
                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all active:scale-95 ${
                      copied
                        ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                        : "bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 border border-purple-300/60 dark:bg-purple-600/30 dark:hover:bg-purple-600/50 dark:text-purple-200 dark:border-purple-500/30"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                        <span>تم النسخ ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Compact Scannable QR Code */}
                <div className="flex flex-col items-center justify-center pt-0.5 space-y-1">
                  <div className="relative p-2 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                    {instapayQrImage ? (
                      <div className="relative w-[135px] h-[135px] sm:w-[145px] sm:h-[145px] overflow-hidden">
                        <Image
                          src={instapayQrImage}
                          alt="Official InstaPay QR Code"
                          fill
                          sizes="145px"
                          className="object-contain"
                          priority
                        />
                      </div>
                    ) : (
                      <QRCodeSVG
                        value={instapayQrData}
                        size={135}
                        title="InstaPay QR Code"
                      />
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                    {copyConfig.qrScanHint}
                  </span>
                </div>

                {/* Open InstaPay Button */}
                <button
                  type="button"
                  onClick={handleOpenInstaPay}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/25 dark:shadow-purple-900/30 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>{copyConfig.openAppButton}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Footer Appreciation */}
            <div className="px-4 py-2 bg-slate-50/80 dark:bg-black/40 border-t border-slate-100 dark:border-white/5 text-center flex items-center justify-center">
              <span className="text-[11px] sm:text-xs font-medium text-purple-800 dark:text-purple-200/90 flex items-center gap-1">
                <span>{copyConfig.footerThanks}</span>
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
