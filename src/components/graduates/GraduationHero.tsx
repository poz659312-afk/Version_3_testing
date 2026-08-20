"use client"

import React from "react"
import { motion } from "framer-motion"
import { GraduationCap, Award, Sparkles, Trophy, Calendar, Compass, ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

import Image from "next/image"

interface GraduationHeroProps {
  username: string
  graduationYear?: number | null
  graduatedAt?: string | null
  specialization?: string
}

export function GraduationHero({
  username,
  graduationYear = 2026,
  graduatedAt,
  specialization = "Computing and Data Sciences",
}: GraduationHeroProps) {
  const displayYear = graduationYear || 2026

  const formattedDate = graduatedAt
    ? new Date(graduatedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : `Class of ${displayYear}`

  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
      {/* Dynamic Background Effects & Large Creative Graduated Mascot */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden flex items-center justify-center">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-amber-500/20 via-primary/20 to-purple-500/20 blur-[130px] rounded-full" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-primary/15 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 bg-amber-500/15 blur-[100px] rounded-full" />

        {/* Large Semi-Transparent Floating Graduated Chameleon Mascot */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative w-[380px] sm:w-[540px] md:w-[700px] lg:w-[860px] h-[380px] sm:h-[540px] md:h-[700px] lg:h-[860px] select-none"
        >
          {/* Subtle Backlight Glow for the Mascot */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/15 via-primary/10 to-transparent blur-[70px] rounded-full" />

          <motion.div
            animate={{
              y: [-10, 10, -10],
              rotate: [-1, 1, -1],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-full h-full relative"
          >
            <Image
              src="/images/chameleon/19_chameleon_graduated.png"
              alt="Chameleon Graduated Mascot"
              fill
              className="object-contain opacity-25 dark:opacity-20 drop-shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              priority
            />
          </motion.div>
        </motion.div>

        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Alumni Prestige Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-primary/10 to-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-semibold shadow-sm backdrop-blur-md"
          >
            <GraduationCap className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>Chameleon Alumni &bull; Class of {displayYear}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </motion.div>

          {/* Main Congratulations Heading */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4 max-w-4xl"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground font-outfit">
              Congratulations,{" "}
              <span className="bg-gradient-to-r from-amber-500 via-primary to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                {username}
              </span>
              !
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              You have officially completed your academic journey at{" "}
              <span className="text-foreground font-semibold">Faculty of Computers & Data Science</span>.
            </p>
          </motion.div>

          {/* Specialization & Graduation Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-2xl bg-card/60 dark:bg-card/40 backdrop-blur-xl border border-border/80 rounded-2xl p-4 sm:p-6 shadow-xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
              <div className="flex flex-col items-center p-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Department
                </span>
                <span className="font-bold text-foreground text-sm sm:text-base text-center line-clamp-1">
                  {specialization}
                </span>
              </div>
              <div className="flex flex-col items-center p-2 pt-3 sm:pt-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Cohort
                </span>
                <span className="font-bold text-amber-500 text-sm sm:text-base">
                  Class of {displayYear}
                </span>
              </div>
              <div className="flex flex-col items-center p-2 pt-3 sm:pt-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Status
                </span>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Graduated</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Inspirational Alumni Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm sm:text-base text-muted-foreground/90 max-w-2xl mx-auto italic font-sans"
          >
            &ldquo;Your journey with Chameleon doesn&apos;t end here. As an alumnus, your accomplishments pave the way for future generations of FCDS engineers and data leaders.&rdquo;
          </motion.p>

          {/* Quick Action Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-3 pt-2"
          >
            <Link href="/profile">
              <Button className="rounded-xl px-6 py-5 bg-gradient-to-r from-amber-500 to-primary hover:from-amber-600 hover:to-primary/90 text-white font-semibold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all cursor-pointer">
                <Trophy className="w-4 h-4 mr-2" />
                View Alumni Profile & History
              </Button>
            </Link>
            <Link href="/study-spaces">
              <Button variant="outline" className="rounded-xl px-6 py-5 border-border/80 hover:bg-muted font-semibold transition-all cursor-pointer">
                <Compass className="w-4 h-4 mr-2" />
                Alumni Study Lounge
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
