"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Heart,
  ArrowRight,
  Sparkles,
  Server,
  ShieldCheck,
  Code2,
  Users2,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
} from "lucide-react"
import { DonationBanner } from "@/components/donation/DonationBanner"
import { QRCodeSVG } from "@/components/donation/QRCodeSVG"
import { InstaPayLogo } from "@/components/donation/InstaPayLogo"
import { DEFAULT_DONATION_CONFIG } from "@/components/donation/donation-config"
import { useToast } from "@/components/ToastProvider"

export default function SupportChameleonPage() {
  const [copied, setCopied] = useState(false)
  const instapayUsername = DEFAULT_DONATION_CONFIG.instapayUsername
  const instapayQrData = DEFAULT_DONATION_CONFIG.instapayQrData

  let addToast: ((msg: string, type?: "success" | "error" | "info") => void) | null = null
  try {
    const toastContext = useToast()
    addToast = toastContext.addToast
  } catch {}

  const handleCopyUsername = async () => {
    try {
      await navigator.clipboard.writeText(instapayUsername)
      setCopied(true)
      if (addToast) {
        addToast(`تم نسخ اسم المستخدم: ${instapayUsername}`, "success")
      }
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const impactPoints = [
    {
      icon: Server,
      title: "استدامة السيرفرات وقواعد البيانات",
      description:
        "دعم تكاليف الاستضافة السحابية ومصادر البيانات لضمان سرعة واستقرار المنصة للجميع بدون انقطاع.",
      color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400",
    },
    {
      icon: Code2,
      title: "تطوير ميزات وأدوات جديدة",
      description:
        "بناء أدوات ذكية لمساعدة الطلاب في تنظيم المذاكرة والوصول للملخصات والامتحانات السابقة بسهولة.",
      color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400",
    },
    {
      icon: Users2,
      title: "مشروع طلابي للطلاب دائمًا",
      description:
        "الحفاظ على Chameleon كمجتمع مفتوح ومجاني بنسبة 100% لكل زملائنا في الكلية.",
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    },
  ]

  const faqs = [
    {
      q: "هل Chameleon هيفضل مجاني؟",
      a: "نعم تمامًا وبدون أي شك! Chameleon هيفضل متاح لكل طلاب FCDS مجانًا وبدون أي اشتراكات أو قيود.",
    },
    {
      q: "هل المساهمة أو الدعم إجباري بأي شكل؟",
      a: "نهائيًا، المساهمة اختيارية بالكامل. هدفنا هو إتاحة الفرصة لمن يرغب في مساندة تكاليف تشغيل وتطوير المنصة.",
    },
    {
      q: "ازاي أقدر أدعم المشروع؟",
      a: "تقدر تستخدم تطبيق InstaPay وتدخل اسم المستخدم المعتمد أو تمسح الـ QR Code مباشرة من موبايلك.",
    },
  ]

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 dark:bg-[#060810] text-slate-900 dark:text-slate-100 font-sans selection:bg-purple-500 selection:text-white pb-24 pt-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200"
    >
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/80 border border-purple-200 text-purple-800 dark:bg-purple-500/10 dark:border-purple-500/25 dark:text-purple-300 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>مجتمع Chameleon الطلابي</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            ادعم استمرار و نمو{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400">
              Chameleon
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Chameleon بدأ من الطلاب وإلى الطلاب. دعمك بيساعدنا نغطي تكاليف الاستضافة
            ونستمر في تقديم محتوى وأدوات تعليمية مجانية لجميع الطلاب.
          </p>
        </div>

        {/* Live Interactive Donation Banner */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-1">
            <span>معاينة البانر التفاعلي المدمج:</span>
            <span className="text-purple-600 dark:text-purple-400">اضغط على &quot;ادعم Chameleon&quot; لفتح الـ Bottom Sheet</span>
          </div>
          <DonationBanner />
        </div>

        {/* Impact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
          {impactPoints.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-white dark:bg-[#0c101c]/90 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none space-y-3 text-right"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center border`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300/80 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Direct InstaPay Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#f8f9ff] via-[#f3f4fd] to-[#f9f5ff] dark:from-[#0f1426] dark:via-[#0b0e1a] dark:to-[#140c26] border border-purple-200/90 dark:border-purple-500/25 shadow-xl shadow-purple-950/5 dark:shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 dark:border-white/10 pb-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>طريقة الدعم المباشر عبر InstaPay</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                يمكنك التحويل السريع عبر حساب InstaPay المعتمد أو مسح الـ QR Code
              </p>
            </div>
            <InstaPayLogo size={38} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left: Username & Copy details */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                  اسم حساب InstaPay:
                </span>
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-black/40 border border-purple-200/80 dark:border-white/10 shadow-xs">
                  <span
                    className="font-mono text-sm sm:text-base font-bold text-purple-900 dark:text-purple-200 select-all"
                    dir="ltr"
                  >
                    {instapayUsername}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUsername}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      copied
                        ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                        : "bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 border border-purple-300/60 dark:bg-purple-600/30 dark:hover:bg-purple-600/50 dark:text-purple-200 dark:border-purple-500/30"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>تم النسخ ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300/80 leading-relaxed">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>دعم فوري وآمن 100%</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>المساهمة اختيارية بالكامل وبأي مبلغ رمزي</span>
                </div>
              </div>
            </div>

            {/* Right: QR Code */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-black/30 border border-slate-200/80 dark:border-white/5 space-y-3 shadow-xs dark:shadow-none">
              <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                <div className="relative w-[180px] h-[180px] rounded-xl overflow-hidden">
                  <Image
                    src={DEFAULT_DONATION_CONFIG.instapayQrImage || "/images/instapay-qr.jpg"}
                    alt="Official InstaPay QR Code"
                    fill
                    sizes="180px"
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 text-center">
                امسح الـ QR Code من تطبيق InstaPay أو تطبيق البنك
              </span>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2>الأسئلة الشائعة</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-[#0c101c]/80 border border-slate-200/80 dark:border-white/10 space-y-1.5 shadow-xs dark:shadow-none"
              >
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {faq.q}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300/80 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Thanks */}
        <div className="text-center py-8 border-t border-white/5 space-y-2">
          <p className="text-base font-semibold text-white">
            شكرًا لكل طالب ساهم أو نشر Chameleon وشارك في كبر المجتمع ❤️
          </p>
          <p className="text-xs text-slate-400">
            فريق طلاب كلية الحاسبات والذكاء الاصطناعي - FCDS
          </p>
        </div>
      </div>
    </div>
  )
}
