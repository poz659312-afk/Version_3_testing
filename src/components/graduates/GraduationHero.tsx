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

  return (
    <section className="relative overflow-hidden pt-12 sm:pt-16 md:pt-20 lg:pt-24 pb-14 md:pb-18">
      {/* Lightweight Dynamic Aura Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-10 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-10 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14 pt-4 sm:pt-6">
          
          {/* Left Column: Text, Badges, and Details */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-7 sm:space-y-8 mt-2 lg:mt-0">
            {/* Alumni Prestige Badge */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-primary/10 to-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-semibold shadow-sm backdrop-blur-md"
            >
              <GraduationCap className="w-4 h-4 text-amber-500" />
              <span>Chameleon Alumni &bull; Class of {displayYear}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </motion.div>

            {/* Main Congratulations Heading */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-3.5 max-w-2xl"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground font-outfit leading-[1.15]">
                Congratulations,{" "}
                <span className="bg-gradient-to-r from-amber-500 via-primary to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                  {username}
                </span>
                !
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
                You have officially completed your academic journey at{" "}
                <span className="text-foreground font-semibold">Faculty of Computers & Data Science</span>.
              </p>
            </motion.div>

            {/* Specialization & Graduation Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full max-w-xl bg-card/70 dark:bg-card/50 backdrop-blur-md border border-border/80 rounded-2xl p-4 sm:p-5 shadow-lg"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
                <div className="flex flex-col items-center lg:items-start p-1.5 sm:px-3">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    Department
                  </span>
                  <span className="font-bold text-foreground text-sm line-clamp-1">
                    {specialization}
                  </span>
                </div>
                <div className="flex flex-col items-center lg:items-start p-1.5 pt-2.5 sm:pt-1.5 sm:px-3">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    Cohort
                  </span>
                  <span className="font-bold text-amber-500 text-sm">
                    Class of {displayYear}
                  </span>
                </div>
                <div className="flex flex-col items-center lg:items-start p-1.5 pt-2.5 sm:pt-1.5 sm:px-3">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    Status
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
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
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-xs sm:text-sm text-muted-foreground/90 max-w-xl italic font-sans"
            >
              &ldquo;Your journey with Chameleon doesn&apos;t end here. As an alumnus, your accomplishments pave the way for future generations of FCDS engineers and data leaders.&rdquo;
            </motion.p>

            {/* Quick Action Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2"
            >
              <Link href="/profile">
                <Button className="rounded-xl px-5 py-5 bg-gradient-to-r from-amber-500 to-primary hover:from-amber-600 hover:to-primary/90 text-white font-semibold shadow-md shadow-amber-500/20 transition-all cursor-pointer text-sm">
                  <Trophy className="w-4 h-4 mr-2" />
                  View Alumni Profile & History
                </Button>
              </Link>
              <Link href="/study-spaces">
                <Button variant="outline" className="rounded-xl px-5 py-5 border-border/80 hover:bg-muted font-semibold transition-all cursor-pointer text-sm">
                  <Compass className="w-4 h-4 mr-2" />
                  Alumni Study Lounge
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Prominent Large 3D Graduated Mascot Avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-[440px] xl:w-[500px] flex-shrink-0 flex items-center justify-center select-none"
          >
            <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] lg:w-[440px] lg:h-[440px] xl:w-[480px] xl:h-[480px] flex items-center justify-center">
              {/* Backlight Ambient Glow Ring */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/25 via-primary/25 to-purple-500/20 rounded-full blur-[65px] scale-95" />
              
              <Image
                src="/images/chameleon/19_chameleon_graduated.png"
                alt="Chameleon Graduated Mascot"
                width={480}
                height={480}
                className="w-full h-full object-contain drop-shadow-[0_16px_40px_rgba(0,0,0,0.25)] select-none transition-transform hover:scale-105 duration-300"
                priority
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
