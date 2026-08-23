'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FileText,
  Heart,
  ExternalLink,
  Coins,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  User as UserIcon,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Summary } from '@/lib/types'
import { toast } from 'sonner'
import { supportSummaryAction } from '@/app/summaries/actions'

interface SummaryCardProps {
  summary: Summary
  currentStudentCoins?: number
  onBalanceUpdated?: (newBalance: number) => void
}

export default function SummaryCard({
  summary,
  currentStudentCoins = 0,
  onBalanceUpdated
}: SummaryCardProps) {
  const [votes, setVotes] = useState(summary.votes || 0)
  const [isSupporting, setIsSupporting] = useState(false)
  const [justSupported, setJustSupported] = useState(false)

  // Format file size
  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes === 0) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSupport = async () => {
    if (currentStudentCoins < 100) {
      toast.error('You need at least 100 Coins to support this summary.', {
        description: `Your current balance is ${currentStudentCoins} Coins.`,
      })
      return
    }

    setIsSupporting(true)
    try {
      const res = await supportSummaryAction(summary.id)
      if (res.success) {
        setVotes(res.votes)
        setJustSupported(true)
        if (onBalanceUpdated) {
          onBalanceUpdated(res.newBalance)
        }
        toast.success(`🎉 Supported "${summary.title}"! (+60 Coins to ${summary.authorName})`, {
          description: `100 Coins deducted. New balance: ${res.newBalance} Coins.`,
        })

        setTimeout(() => {
          setJustSupported(false)
        }, 2000)
      }
    } catch (err: any) {
      console.error('Support error:', err)
      toast.error(err?.message || 'Failed to support summary. Please try again.')
    } finally {
      setIsSupporting(false)
    }
  }

  const authorUsername = summary.authorUsername || (summary.contributor ? summary.contributor.username : '')

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col justify-between rounded-3xl bg-card border border-border/80 hover:border-primary/50 transition-all duration-300 p-5 shadow-lg hover:shadow-xl hover:shadow-primary/5"
    >
      {/* Top Section: Subject Badge + File Meta */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          {summary.subject_id ? (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              {summary.subject_id}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[11px] font-medium px-2.5 py-0.5 rounded-full">
              General
            </Badge>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
            <span className="uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-muted/60 border border-border/50">
              {summary.file_type || 'PDF'}
            </span>
            {summary.file_size ? (
              <span>{formatFileSize(summary.file_size)}</span>
            ) : null}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-black text-foreground tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
          {summary.title}
        </h3>

        {/* Description */}
        {summary.description && (
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {summary.description}
          </p>
        )}
      </div>

      {/* Middle: Contributor info */}
      <div className="my-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        {authorUsername ? (
          <Link
            href={`/contributors/${authorUsername}`}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-8 h-8 border border-primary/40">
              <AvatarImage src={summary.authorAvatar || undefined} alt={summary.authorName} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-black">
                {summary.authorName ? summary.authorName.charAt(0).toUpperCase() : 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <span className="text-xs font-bold text-foreground block line-clamp-1 hover:text-primary">
                {summary.authorName}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                @{authorUsername}
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              <AvatarImage src={summary.authorAvatar || undefined} />
              <AvatarFallback className="bg-muted text-xs">
                <UserIcon className="w-3.5 h-3.5" />
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-bold text-foreground">
              {summary.authorName || 'Contributor'}
            </span>
          </div>
        )}

        {/* Supports Counter */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black">
          <Heart className="w-3.5 h-3.5 fill-primary text-primary" />
          <span>{votes}</span>
        </div>
      </div>

      {/* Bottom Actions: Support Button & Open Drive Link */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* Support Button */}
        <Button
          onClick={handleSupport}
          disabled={isSupporting}
          size="sm"
          className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 h-9"
        >
          {isSupporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : justSupported ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Supported!</span>
            </>
          ) : (
            <>
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Support (100 🪙)</span>
            </>
          )}
        </Button>

        {/* Open / Download from Google Drive */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full rounded-xl border-border hover:border-primary/50 hover:bg-muted/80 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 h-9"
        >
          <a
            href={summary.drive_url || `https://drive.google.com/file/d/${summary.drive_file_id}/view`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Open File</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground ml-0.5" />
          </a>
        </Button>
      </div>
    </motion.div>
  )
}
