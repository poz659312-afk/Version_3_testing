"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CertificateItem } from "@/lib/certificates"
import { useColorTheme, ColorTheme } from "@/components/color-theme-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Award, Download, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface CertificateModalProps {
  certificate: CertificateItem | null
  isOpen: boolean
  onClose: () => void
}

export interface CertThemePalette {
  bgColor: string
  bgGradient: string
  borderColor: string
  innerBorderColor: string
  cornerColor: string
  accentColor: string
  accentBg: string
  accentBorder: string
  studentNameColor: string
  titleColor: string
  gradeColor: string
  textColor: string
  subtextColor: string
}

export function getCertificateThemePalette(theme: ColorTheme | string): CertThemePalette {
  // Deep 90% Black Obsidian Base (#08080a)
  const baseBgColor = "#08080a"

  switch (theme) {
    case "matrix":
      return {
        bgColor: baseBgColor,
        bgGradient: `radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.08) 0%, ${baseBgColor} 90%)`,
        borderColor: "rgba(16, 185, 129, 0.5)",
        innerBorderColor: "rgba(16, 185, 129, 0.2)",
        cornerColor: "#10b981",
        accentColor: "#10b981",
        accentBg: "rgba(16, 185, 129, 0.15)",
        accentBorder: "rgba(16, 185, 129, 0.4)",
        studentNameColor: "#6ee7b7",
        titleColor: "#34d399",
        gradeColor: "#a7f3d0",
        textColor: "#d1fae5",
        subtextColor: "#6ee7b7",
      }
    case "cyberpunk":
      return {
        bgColor: baseBgColor,
        bgGradient: `radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.09) 0%, ${baseBgColor} 90%)`,
        borderColor: "rgba(236, 72, 153, 0.5)",
        innerBorderColor: "rgba(6, 182, 212, 0.2)",
        cornerColor: "#ec4899",
        accentColor: "#06b6d4",
        accentBg: "rgba(6, 182, 212, 0.15)",
        accentBorder: "rgba(236, 72, 153, 0.4)",
        studentNameColor: "#67e8f9",
        titleColor: "#f43f5e",
        gradeColor: "#a5f3fc",
        textColor: "#e0f2fe",
        subtextColor: "#a5f3fc",
      }
    case "nightowl":
    case "ocean":
    case "skyblue":
      return {
        bgColor: baseBgColor,
        bgGradient: `radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08) 0%, ${baseBgColor} 90%)`,
        borderColor: "rgba(56, 189, 248, 0.5)",
        innerBorderColor: "rgba(56, 189, 248, 0.2)",
        cornerColor: "#38bdf8",
        accentColor: "#38bdf8",
        accentBg: "rgba(56, 189, 248, 0.15)",
        accentBorder: "rgba(56, 189, 248, 0.4)",
        studentNameColor: "#93c5fd",
        titleColor: "#60a5fa",
        gradeColor: "#34d399",
        textColor: "#e0f2fe",
        subtextColor: "#93c5fd",
      }
    case "rose":
    case "crimson":
    case "coral":
    case "volcano":
      return {
        bgColor: baseBgColor,
        bgGradient: `radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.08) 0%, ${baseBgColor} 90%)`,
        borderColor: "rgba(244, 63, 94, 0.5)",
        innerBorderColor: "rgba(244, 63, 94, 0.2)",
        cornerColor: "#f43f5e",
        accentColor: "#fb7185",
        accentBg: "rgba(244, 63, 94, 0.15)",
        accentBorder: "rgba(244, 63, 94, 0.4)",
        studentNameColor: "#fecdd3",
        titleColor: "#fb7185",
        gradeColor: "#f43f5e",
        textColor: "#ffe4e6",
        subtextColor: "#fecdd3",
      }
    case "lavender":
    case "indigo":
    case "nebula":
      return {
        bgColor: baseBgColor,
        bgGradient: `radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.09) 0%, ${baseBgColor} 90%)`,
        borderColor: "rgba(168, 85, 247, 0.5)",
        innerBorderColor: "rgba(168, 85, 247, 0.2)",
        cornerColor: "#a855f7",
        accentColor: "#c084fc",
        accentBg: "rgba(168, 85, 247, 0.15)",
        accentBorder: "rgba(168, 85, 247, 0.4)",
        studentNameColor: "#e9d5ff",
        titleColor: "#c084fc",
        gradeColor: "#34d399",
        textColor: "#f3e8ff",
        subtextColor: "#e9d5ff",
      }
    case "diamond":
    case "glacier":
      return {
        bgColor: baseBgColor,
        bgGradient: `radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.08) 0%, ${baseBgColor} 90%)`,
        borderColor: "rgba(34, 211, 238, 0.5)",
        innerBorderColor: "rgba(34, 211, 238, 0.2)",
        cornerColor: "#22d3ee",
        accentColor: "#06b6d4",
        accentBg: "rgba(34, 211, 238, 0.15)",
        accentBorder: "rgba(34, 211, 238, 0.4)",
        studentNameColor: "#a5f3fc",
        titleColor: "#22d3ee",
        gradeColor: "#67e8f9",
        textColor: "#ecfeff",
        subtextColor: "#a5f3fc",
      }
    case "emerald":
    case "forest":
    case "mint":
      return {
        bgColor: baseBgColor,
        bgGradient: `radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.08) 0%, ${baseBgColor} 90%)`,
        borderColor: "rgba(16, 185, 129, 0.5)",
        innerBorderColor: "rgba(16, 185, 129, 0.2)",
        cornerColor: "#10b981",
        accentColor: "#34d399",
        accentBg: "rgba(16, 185, 129, 0.15)",
        accentBorder: "rgba(16, 185, 129, 0.4)",
        studentNameColor: "#a7f3d0",
        titleColor: "#34d399",
        gradeColor: "#6ee7b7",
        textColor: "#d1fae5",
        subtextColor: "#a7f3d0",
      }
    case "sunset":
      return {
        bgColor: baseBgColor,
        bgGradient: `radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.09) 0%, ${baseBgColor} 90%)`,
        borderColor: "rgba(249, 115, 22, 0.5)",
        innerBorderColor: "rgba(249, 115, 22, 0.2)",
        cornerColor: "#f97316",
        accentColor: "#fb923c",
        accentBg: "rgba(249, 115, 22, 0.15)",
        accentBorder: "rgba(249, 115, 22, 0.4)",
        studentNameColor: "#fed7aa",
        titleColor: "#fb923c",
        gradeColor: "#f97316",
        textColor: "#ffedd5",
        subtextColor: "#fed7aa",
      }
    case "luxury":
    case "solaris":
    case "amber":
    case "default":
    default:
      return {
        bgColor: baseBgColor,
        bgGradient: `radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.08) 0%, ${baseBgColor} 90%)`,
        borderColor: "rgba(245, 158, 11, 0.5)",
        innerBorderColor: "rgba(245, 158, 11, 0.2)",
        cornerColor: "#f59e0b",
        accentColor: "#f59e0b",
        accentBg: "rgba(245, 158, 11, 0.15)",
        accentBorder: "rgba(245, 158, 11, 0.4)",
        studentNameColor: "#fde68a",
        titleColor: "#fbbf24",
        gradeColor: "#34d399",
        textColor: "#d4d4d8",
        subtextColor: "#a1a1aa",
      }
  }
}

export function CertificateModal({ certificate, isOpen, onClose }: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const { colorTheme } = useColorTheme()

  if (!certificate) return null

  const palette = getCertificateThemePalette(colorTheme)

  const handleDownloadPDF = async () => {
    if (!certRef.current) return
    setDownloading(true)
    const toastId = toast.loading("Generating high-resolution official PDF certificate...")

    try {
      // 1. Capture certificate DOM using html2canvas with 90% black background
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: palette.bgColor,
        logging: false,
        windowWidth: 1280,
        onclone: (clonedDoc) => {
          const container = clonedDoc.querySelector("[data-cert-container]") as HTMLElement
          if (container) {
            container.style.transform = "none"
            container.style.boxShadow = "none"
            container.style.backgroundColor = palette.bgColor
            container.style.backgroundImage = palette.bgGradient

            const allElements = [container, ...Array.from(container.querySelectorAll("*"))] as HTMLElement[]
            allElements.forEach((node) => {
              const comp = clonedDoc.defaultView?.getComputedStyle(node)
              if (comp) {
                const color = comp.color
                const bg = comp.backgroundColor
                const border = comp.borderColor

                if (color && (color.includes("oklch") || color.includes("oklab"))) {
                  node.style.color = palette.textColor
                }
                if (bg && (bg.includes("oklch") || bg.includes("oklab"))) {
                  node.style.backgroundColor = node === container ? palette.bgColor : "transparent"
                }
                if (border && (border.includes("oklch") || border.includes("oklab"))) {
                  node.style.borderColor = palette.innerBorderColor
                }
              }
            })
          }
        }
      })

      const imgData = canvas.toDataURL("image/png", 1.0)

      // 2. Initialize jsPDF in landscape (l) format (A4 dimensions: 297mm x 210mm)
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Chameleon_Certificate_${certificate.serialCode}.pdf`)

      toast.success("Certificate downloaded successfully!", { id: toastId })
    } catch (error) {
      console.error("PDF generation error:", error)
      const errMsg = error instanceof Error ? error.message : "Unknown error"
      toast.error(`Failed to generate PDF: ${errMsg}`, { id: toastId })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onWheel={(e) => e.stopPropagation()}
        className="custom-cert-modal-scroll max-w-5xl bg-zinc-950/95 text-foreground p-4 sm:p-6 md:p-8 backdrop-blur-2xl max-h-[90vh] overflow-y-auto overflow-x-auto border-2 shadow-2xl"
        style={{
          borderColor: palette.borderColor,
          scrollbarWidth: "thin",
          scrollbarColor: `${palette.accentColor} rgba(18, 18, 24, 0.9)`,
        }}
      >
        {/* Custom Webkit Scrollbar Styling matching active theme */}
        <style dangerouslySetInnerHTML={{ __html: `
          .custom-cert-modal-scroll::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .custom-cert-modal-scroll::-webkit-scrollbar-track {
            background: rgba(18, 18, 24, 0.9);
            border-radius: 8px;
          }
          .custom-cert-modal-scroll::-webkit-scrollbar-thumb {
            background: ${palette.accentColor};
            border-radius: 8px;
            border: 2px solid rgba(18, 18, 24, 0.9);
          }
          .custom-cert-modal-scroll::-webkit-scrollbar-thumb:hover {
            background: ${palette.studentNameColor};
          }
        ` }} />

        <DialogHeader className="mb-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-bold font-outfit flex items-center gap-2" style={{ color: palette.titleColor }}>
                <Award className="size-6 animate-pulse" style={{ color: palette.accentColor }} />
                {certificate.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-400">
                Official Accredited Certificate issued by Chameleon Academy & Levi Ackerman
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadPDF}
                disabled={downloading}
                style={{ backgroundColor: palette.accentColor, color: "#000000" }}
                className="font-bold shadow-lg hover:brightness-110"
              >
                {downloading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="size-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Certificate Rendering Container for PDF (16:9 Landscape Aspect Ratio) */}
        <div className="w-full py-4 flex justify-center items-center min-w-max">
          <div
            ref={certRef}
            data-cert-container="true"
            className="relative w-[900px] h-[600px] min-w-[900px] min-h-[600px] text-white rounded-xl border-8 p-10 flex flex-col justify-between overflow-hidden shadow-2xl select-none"
            style={{
              backgroundColor: palette.bgColor,
              color: "#ffffff",
              borderColor: palette.borderColor,
              backgroundImage: palette.bgGradient,
            }}
          >
            {/* Ornate Corner Accent Decorations */}
            <div className="absolute top-3 left-3 size-12 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: palette.cornerColor }} />
            <div className="absolute top-3 right-3 size-12 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: palette.cornerColor }} />
            <div className="absolute bottom-3 left-3 size-12 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: palette.cornerColor }} />
            <div className="absolute bottom-3 right-3 size-12 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: palette.cornerColor }} />
            <div className="absolute inset-4 border rounded-lg pointer-events-none" style={{ borderColor: palette.innerBorderColor }} />

            {/* Header: Official Site Logo & Academy Branding */}
            <div className="flex justify-between items-center z-10 w-full px-2">
              <div className="flex items-center gap-3.5">
                {/* Styled Circular Logo Badge matching Navigation Component */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "46px",
                    height: "46px",
                    borderRadius: "9999px",
                    backgroundColor: palette.accentColor,
                    padding: "2px",
                    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
                    overflow: "hidden"
                  }}
                >
                  {/* Official Site Mascot Logo (/images/chameleon.png) */}
                  <img
                    src={typeof window !== "undefined" ? `${window.location.origin}/images/chameleon.png` : "/images/chameleon.png"}
                    alt="Chameleon Academy Logo"
                    crossOrigin="anonymous"
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "9999px", display: "block" }}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-wider uppercase font-outfit" style={{ color: palette.accentColor, lineHeight: "1.2" }}>CHAMELEON ACADEMY</h3>
                  <p className="text-[10px] tracking-widest uppercase font-mono" style={{ color: palette.subtextColor, lineHeight: "1.2" }}>Official Certificate of Achievement & Honor</p>
                </div>
              </div>

              <div className="text-right">
                <div
                  style={{
                    color: palette.accentColor,
                    fontSize: "11px",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    letterSpacing: "1px",
                    lineHeight: "1.2"
                  }}
                >
                  VERIFIED: {certificate.serialCode}
                </div>
              </div>
            </div>

            {/* Body: Certificate Main Statement */}
            <div className="text-center my-auto space-y-4 z-10 py-2 flex flex-col items-center justify-center">
              {/* Centered Honor Heading */}
              <div
                style={{
                  color: palette.accentColor,
                  fontSize: "11px",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  lineHeight: "1.2"
                }}
              >
                ACCREDITED ACADEMIC HONOR
              </div>

              {/* Certificate Title */}
              <h1 className="text-3xl sm:text-4xl font-black font-outfit uppercase tracking-wider" style={{ color: palette.titleColor, lineHeight: "1.2" }}>
                {certificate.title}
              </h1>

              <p className="text-[11px] font-outfit uppercase tracking-widest font-semibold" style={{ color: palette.subtextColor, lineHeight: "1" }}>
                This is to certify that
              </p>

              {/* Student Name */}
              <div className="py-1">
                <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-wide" style={{ color: palette.studentNameColor, lineHeight: "1.2" }}>
                  {certificate.studentName || "Academic Scholar"}
                </h2>
              </div>

              {/* Achievement Sentence */}
              <p className="text-sm max-w-2xl mx-auto leading-relaxed font-outfit px-4" style={{ color: palette.textColor, lineHeight: "1.6" }}>
                has successfully fulfilled all academic evaluations and criteria for <span className="font-bold" style={{ color: palette.accentColor }}>"{certificate.courseName || certificate.title}"</span> and is hereby awarded the academic grade of <span className="font-bold" style={{ color: palette.gradeColor }}>{certificate.grade || "First-Class Distinction"}</span>.
              </p>
            </div>

            {/* Footer: Date of Issuance (Left), Official Seal (Center), Levi Ackerman Signature (Right) */}
            <div className="flex justify-between items-end z-10 pt-4 border-t w-full px-2" style={{ borderColor: palette.innerBorderColor }}>
              {/* Left Column: Date of Issuance */}
              <div className="text-center w-52 flex flex-col items-center">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", lineHeight: "1.2", color: palette.studentNameColor, fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>
                  {certificate.issueDate}
                </div>
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: palette.subtextColor, lineHeight: "1" }}>Date of Issuance</p>
                <div className="mt-2 h-0.5 w-24 mx-auto" style={{ background: `linear-gradient(to right, transparent, ${palette.accentColor}, transparent)` }} />
              </div>

              {/* Center Column: Official Seal Text */}
              <div className="text-center w-52 flex flex-col items-center">
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: palette.accentColor, lineHeight: "1.2" }}>CHAMELEON</span>
                <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: palette.studentNameColor, lineHeight: "1.2" }}>OFFICIAL SEAL</span>
                <div className="mt-2 h-0.5 w-20 mx-auto" style={{ background: `linear-gradient(to right, transparent, ${palette.accentColor}, transparent)` }} />
              </div>

              {/* Right Column: Levi Ackerman Signature & Role */}
              <div className="text-center w-52 flex flex-col items-center">
                <div className="font-serif italic text-xl tracking-wide mb-2 font-bold" style={{ color: palette.studentNameColor, lineHeight: "1" }}>
                  {certificate.founderName || "Levi Ackerman"}
                </div>
                <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: palette.subtextColor, lineHeight: "1" }}>Founder & Platform Owner</p>
                <div className="mt-2 h-0.5 w-24 mx-auto" style={{ background: `linear-gradient(to right, transparent, ${palette.accentColor}, transparent)` }} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
