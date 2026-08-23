'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Heart,
  BookOpen,
  ArrowLeft,
  Coins,
  Sparkles,
  Calendar,
  UserCheck,
  FileText
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Contributor, Summary } from '@/lib/types'
import SummaryCard from '@/components/summaries/SummaryCard'

interface ContributorProfileClientProps {
  contributor: Contributor
  initialSummaries: Summary[]
  initialStudentCoins: number
}

export default function ContributorProfileClient({
  contributor,
  initialSummaries,
  initialStudentCoins
}: ContributorProfileClientProps) {
  const [studentCoins, setStudentCoins] = useState(initialStudentCoins)
  const summaries = initialSummaries

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="rounded-full gap-1.5 text-xs font-bold">
          <Link href="/summaries">
            <ArrowLeft className="w-4 h-4" />
            Back to Summaries
          </Link>
        </Button>
      </div>

      {/* Contributor Profile Hero Card */}
      <Card className="rounded-3xl border-2 border-border bg-card p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-amber-500 shadow-xl">
            <AvatarImage src={contributor.avatar_url || undefined} alt={contributor.display_name} />
            <AvatarFallback className="bg-amber-500/20 text-amber-500 text-3xl font-black">
              {contributor.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-outfit">
                {contributor.display_name}
              </h1>
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-black">
                Verified Contributor
              </Badge>
            </div>

            <p className="text-sm font-bold text-muted-foreground">
              @{contributor.username}
            </p>

            {contributor.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {contributor.bio}
              </p>
            )}

            {/* Metrics Chips */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
              <div className="px-3.5 py-1.5 rounded-2xl bg-muted/60 border border-border flex items-center gap-2 text-xs font-bold">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>{contributor.summaries_count || summaries.length} Published Summaries</span>
              </div>

              <div className="px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Heart className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{contributor.total_votes || 0} Total Supports</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Summaries by this Contributor */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-foreground font-outfit flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            Summaries by {contributor.display_name} ({summaries.length})
          </h2>
        </div>

        {summaries.length === 0 ? (
          <Card className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground">
            No published summaries available from this contributor yet.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summaries.map(summary => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                currentStudentCoins={studentCoins}
                onBalanceUpdated={newBal => setStudentCoins(newBal)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
