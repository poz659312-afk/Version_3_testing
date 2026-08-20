"use client"

import React from "react"
import { motion } from "framer-motion"
import { Award, CheckCircle2, FileCheck, FolderArchive, Layers, Star, ExternalLink, ShieldCheck, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface GraduationAchievementsProps {
  specialization?: string
  graduationYear?: number | null
}

export function GraduationAchievements({
  specialization = "Computing and Data Sciences",
  graduationYear = 2026,
}: GraduationAchievementsProps) {
  const achievements = [
    {
      title: "Bachelor of Science in Data Science",
      subtitle: `Faculty of Computers & Data Science • ${graduationYear}`,
      description: "Successfully completed four-year core academic syllabus, hands-on lab sessions, and graduation criteria.",
      badge: "Major Degree",
      badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/30",
      icon: Award,
      status: "Conferred",
    },
    {
      title: "Chameleon Pioneer Milestone",
      subtitle: "Lifetime Platform Contributor",
      description: "Active participation in study spaces, knowledge sharing, and peer academic engagement.",
      badge: "Honor",
      badgeColor: "bg-primary/10 text-primary border-primary/30",
      icon: Star,
      status: "Unlocked",
    },
    {
      title: "Full Curriculum Mastery",
      subtitle: `${specialization} Department`,
      description: "Completed Level 1 through Level 4 subject domains, foundational algorithms, and specialized electives.",
      badge: "Curriculum",
      badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
      icon: ShieldCheck,
      status: "Verified",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-outfit flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Alumni Honors &amp; Verified Badges
          </h2>
          <p className="text-sm text-muted-foreground">
            Accreditations and permanent milestones associated with your FCDS graduate profile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {achievements.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.15 }}
          >
            <Card className="h-full bg-card/60 backdrop-blur-md border border-border/70 hover:border-primary/40 transition-all flex flex-col justify-between shadow-sm hover:shadow-md">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="outline" className={`${item.badgeColor} font-semibold text-xs`}>
                    {item.badge}
                  </Badge>
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {item.status}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-foreground font-outfit">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground">
                  {item.subtitle}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
