'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Plus, Search, Heart, Edit2, Trash2, Calendar, User } from 'lucide-react'
import { deleteSummary } from './actions'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface SummaryItem {
  code: string
  title: string
  likes_count: number
  is_published: boolean
  created_at: string
  authorName: string
}

interface SummariesHubClientProps {
  initialSummaries: SummaryItem[]
  isAdmin: boolean
}

export default function SummariesHubClient({ initialSummaries, isAdmin }: SummariesHubClientProps) {
  const [summaries, setSummaries] = useState<SummaryItem[]>(initialSummaries)
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'published' | 'drafts'>('all')

  const handleDelete = async (code: string) => {
    if (confirm('Are you sure you want to delete this summary? This action cannot be undone.')) {
      try {
        await deleteSummary(code)
        setSummaries(prev => prev.filter(s => s.code !== code))
        toast.success('Summary deleted successfully')
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Failed to delete summary'
        toast.error(errMsg)
      }
    }
  }

  // Filter summaries based on search and tab
  const filteredSummaries = summaries.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false

    if (filterTab === 'published') return s.is_published
    if (filterTab === 'drafts') return !s.is_published
    return true
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-violet-400 animate-pulse" />
            Summaries Hub
          </h1>
          <p className="text-gray-400 mt-2">
            Explore summaries, study notes, formulas, and visual graphics written by experts.
          </p>
        </div>

        {isAdmin && (
          <Button asChild className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border border-violet-500/30 text-white shadow-lg shadow-violet-500/20 px-6 py-5 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Link href="/summaries/console">
              <Plus className="w-5 h-5" />
              Create Summary
            </Link>
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search summaries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 focus:border-violet-500/50 rounded-xl text-white placeholder-gray-400 w-full"
          />
        </div>

        {isAdmin && (
          <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as 'all' | 'published' | 'drafts')} className="w-full md:w-auto">
            <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl w-full grid grid-cols-3 md:w-[350px]">
              <TabsTrigger value="all" className="rounded-lg text-gray-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white">All</TabsTrigger>
              <TabsTrigger value="published" className="rounded-lg text-gray-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white">Published</TabsTrigger>
              <TabsTrigger value="drafts" className="rounded-lg text-gray-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white">Drafts</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Grid of Summaries */}
      {filteredSummaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
          <BookOpen className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-300">No summaries found</h3>
          <p className="text-gray-500 mt-1 max-w-md">
            Try searching for a different keyword or check back later for new uploads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSummaries.map((summary) => (
              <motion.div
                key={summary.code}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full relative overflow-hidden backdrop-blur-md bg-white/5 border-white/10 hover:border-violet-500/30 hover:bg-white/10 transition-all duration-300 flex flex-col group shadow-xl">
                  {/* Glowing background card element */}
                  <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <CardHeader className="relative pb-3 flex-grow">
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <Badge className="bg-white/10 hover:bg-white/15 text-violet-300 border border-white/5 rounded-full px-3">
                        {summary.code}
                      </Badge>
                      {isAdmin && (
                        <Badge className={summary.is_published ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}>
                          {summary.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      )}
                    </div>
                    <Link href={`/summaries/${summary.code}`} className="block group-hover:text-violet-400 transition-colors">
                      <CardTitle className="text-2xl font-bold tracking-tight line-clamp-2">
                        {summary.title}
                      </CardTitle>
                    </Link>
                  </CardHeader>

                  <CardContent className="pb-4 text-gray-400 text-sm space-y-2 relative">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-violet-400" />
                      <span>{summary.authorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{new Date(summary.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-white/5 flex items-center justify-between relative bg-black/20">
                    <div className="flex items-center gap-1.5 text-pink-400">
                      <Heart className="w-4.5 h-4.5 fill-pink-500/20 text-pink-500" />
                      <span className="font-bold text-sm">{summary.likes_count} likes</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="ghost" className="hover:bg-violet-500/20 text-violet-400 hover:text-white rounded-lg">
                        <Link href={`/summaries/${summary.code}`}>
                          Read
                        </Link>
                      </Button>

                      {isAdmin && (
                        <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-1">
                          <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-amber-400 hover:text-white hover:bg-amber-500/20 rounded-lg">
                            <Link href={`/summaries/console/${summary.code}`}>
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(summary.code)} className="h-8 w-8 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
