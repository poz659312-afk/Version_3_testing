'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Search,
  Sparkles,
  Plus,
  Coins,
  Heart,
  SlidersHorizontal,
  FolderLock,
  UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Summary, User as UserType } from '@/lib/types'
import { StudentUser } from '@/lib/auth'
import SummaryCard from '@/components/summaries/SummaryCard'

const TRACK_TABS = [
  { id: 'ALL', label: 'All Tracks' },
  { id: 'CDS', label: 'CDS' },
  { id: 'AI', label: 'AI' },
  { id: 'CYS', label: 'CYS' },
  { id: 'MA', label: 'MA' },
  { id: 'BA', label: 'BA' },
  { id: 'HI', label: 'HI' },
  { id: 'GENERAL', label: 'General' },
]

interface SummariesHubClientProps {
  initialSummaries: Summary[]
  session: any
  isAdmin: boolean
}

export default function SummariesHubClient({
  initialSummaries,
  session,
  isAdmin
}: SummariesHubClientProps) {
  const [summaries, setSummaries] = useState<Summary[]>(initialSummaries)
  const [selectedTrack, setSelectedTrack] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'votes' | 'latest'>('votes')
  const [studentCoins, setStudentCoins] = useState<number>(session?.coins || 0)

  // Filter summaries based on search and track
  const filteredSummaries = summaries
    .filter(summary => {
      // Track match
      if (selectedTrack !== 'ALL') {
        const subj = (summary.subject_id || '').toUpperCase()
        if (selectedTrack === 'GENERAL') {
          if (subj && subj !== 'GENERAL' && subj !== 'MATH' && subj !== 'PROG') return false
        } else if (!subj.includes(selectedTrack)) {
          return false
        }
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = summary.title.toLowerCase().includes(q)
        const descMatch = summary.description?.toLowerCase().includes(q) || false
        const authorMatch = summary.authorName?.toLowerCase().includes(q) || false
        const subjectMatch = summary.subject_id?.toLowerCase().includes(q) || false
        if (!titleMatch && !descMatch && !authorMatch && !subjectMatch) return false
      }

      return true
    })
    .sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      return (b.votes || 0) - (a.votes || 0)
    })

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/80 pb-8">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black tracking-wide">
              ✨ SUMMARIES 2.0
            </span>
            {session && (
              <span className="px-3 py-1 rounded-full bg-muted border border-border text-xs font-bold text-foreground flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>Your Balance: {studentCoins.toLocaleString()} Coins</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight font-outfit">
            Academic Summaries & Guides
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Verified study summaries and lecture notes prepared by top students. Support your favorite contributors with Chameleon Coins!
          </p>
        </div>

        {/* Admin Contributor Dashboard Button */}
        {isAdmin && (
          <Button
            asChild
            className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black px-6 py-6 text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <Link href="/summaries/contributor">
              <UserCheck className="w-4 h-4" />
              Contributor Dashboard
            </Link>
          </Button>
        )}
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="space-y-4">
        {/* Track / Major Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TRACK_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTrack(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                selectedTrack === tab.id
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-amber-500/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar + Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, subject, or contributor name..."
              className="pl-10 rounded-2xl border-border bg-card focus:border-amber-500 text-sm h-11"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-muted-foreground font-bold whitespace-nowrap hidden sm:inline">
              Sort by:
            </span>
            <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
              <SelectTrigger className="w-full sm:w-[170px] rounded-2xl border-border bg-card text-xs font-bold h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="votes">❤️ Most Supported</SelectItem>
                <SelectItem value="latest">⏱️ Latest Uploads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summaries Grid */}
      {filteredSummaries.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-card p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">No summaries found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || selectedTrack !== 'ALL'
              ? 'Try changing your search terms or selecting another track.'
              : 'Be the first contributor to upload a summary for this semester!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSummaries.map(summary => (
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
  )
}
