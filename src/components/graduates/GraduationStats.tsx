"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Calendar, Flame, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"

interface GraduationStatsProps {
  authId: string
  coins?: number
  createdAt?: string
}

export function GraduationStats({ authId, coins = 0, createdAt }: GraduationStatsProps) {
  const [loading, setLoading] = useState(true)
  const [totalQuizzes, setTotalQuizzes] = useState(0)

  useEffect(() => {
    async function loadGraduateStats() {
      try {
        const supabase = createBrowserClient()
        let totalCount = 0

        // 1. Primary quiz data table (used across Chameleon platform)
        const { count: quizCount, error: quizError } = await supabase
          .from("quiz_data")
          .select("*", { count: "exact", head: true })
          .eq("auth_id", authId)

        if (!quizError && quizCount !== null) {
          totalCount += quizCount
        }

        // 2. Department quiz history table (fallback if department quizzes exist)
        try {
          const { count: deptCount, error: deptError } = await supabase
            .from("quiz_department_history")
            .select("id", { count: "exact", head: true })
            .eq("user_id", authId)

          if (!deptError && deptCount !== null) {
            totalCount += deptCount
          }
        } catch {
          // Optional table
        }

        setTotalQuizzes(totalCount)
      } catch (err) {
        console.error("Failed to load graduate quiz stats:", err)
      } finally {
        setLoading(false)
      }
    }

    if (authId) {
      loadGraduateStats()
    } else {
      setLoading(false)
    }
  }, [authId])

  const formattedJoinDate = React.useMemo(() => {
    if (!createdAt) return "Since Pioneer Days"
    try {
      const date = new Date(createdAt)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Since Pioneer Days"
    }
  }, [createdAt])

  const statCards = [
    {
      title: "Quizzes Completed",
      value: loading ? "..." : totalQuizzes.toString(),
      description: "Throughout academic years",
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Member Since",
      value: formattedJoinDate,
      description: "Journey on Chameleon",
      icon: Calendar,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Chameleon Coins",
      value: coins.toLocaleString(),
      description: "Accumulated prestige balance",
      icon: Zap,
      color: "text-purple-500",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-outfit flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500" />
            Academic Legacy &amp; Stats
          </h2>
          <p className="text-sm text-muted-foreground">
            A comprehensive overview of your achievements, milestones, and contributions on Chameleon.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
          >
            <Card className="h-full bg-card/60 backdrop-blur-md border border-border/70 hover:border-border transition-all shadow-sm hover:shadow-md">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-foreground font-outfit">
                    {card.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{card.description}</p>
                </div>
                <div className={`p-3 rounded-xl border ${card.bg} ${card.color} shrink-0`}>
                  <card.icon className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
