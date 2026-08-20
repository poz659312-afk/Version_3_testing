"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Award, BookOpen, CheckCircle, Flame, Star, TrendingUp, Trophy, Zap, Clock, Bookmark } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createBrowserClient } from "@/lib/supabase/client"

interface GraduationStatsProps {
  authId: string
  coins?: number
}

export function GraduationStats({ authId, coins = 0 }: GraduationStatsProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalQuizzesTaken: 0,
    averageScore: 0,
    highestScore: 0,
    perfectScores: 0,
    departmentsExplored: 0,
  })

  useEffect(() => {
    async function loadGraduateStats() {
      try {
        const supabase = createBrowserClient()
        // Query user's quiz attempts history
        const { data: attempts, error } = await supabase
          .from("quiz_department_history")
          .select("score, questions_count, department_slug, quiz_code")
          .eq("user_id", authId)

        if (!error && attempts && attempts.length > 0) {
          const totalAttempts = attempts.length
          const totalPercentage = attempts.reduce((acc: number, curr: any) => {
            const count = curr.questions_count || 1
            const percentage = Math.min(100, Math.round(((curr.score || 0) / count) * 100))
            return acc + percentage
          }, 0)
          const avg = Math.round(totalPercentage / totalAttempts)
          const highest = Math.max(...attempts.map((a: any) => a.score || 0))
          const perfect = attempts.filter((a: any) => (a.score || 0) >= (a.questions_count || 1)).length
          const uniqueDepts = new Set(attempts.map((a: any) => a.department_slug)).size

          setStats({
            totalQuizzesTaken: totalAttempts,
            averageScore: avg,
            highestScore: highest,
            perfectScores: perfect,
            departmentsExplored: uniqueDepts || 1,
          })
        }
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

  const statCards = [
    {
      title: "Quizzes Completed",
      value: loading ? "..." : stats.totalQuizzesTaken.toString(),
      description: "Throughout academic years",
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Average Score",
      value: loading ? "..." : `${stats.averageScore}%`,
      description: "Lifetime academic performance",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Perfect Scores",
      value: loading ? "..." : stats.perfectScores.toString(),
      description: "100% Mastery achievements",
      icon: Trophy,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
