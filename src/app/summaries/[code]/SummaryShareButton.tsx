'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SummaryShareButtonProps {
  code: string
  title: string
  variant?: 'default' | 'icon'
}

export default function SummaryShareButton({ code, title, variant = 'default' }: SummaryShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/summaries/${code}`

    // Attempt Web Share API first (great for mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this summary: ${title}`,
          url: shareUrl
        })
        toast.success('Shared successfully!')
        return
      } catch (err) {
        // User cancelled or share failed, fallback to copy to clipboard
        console.warn('Web Share failed or cancelled, falling back to copy:', err)
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy link')
    }
  }

  if (variant === 'icon') {
    return (
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleShare}
        className="h-10 w-10 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl border border-white/10 shadow-lg"
        title="Share Summary"
      >
        {copied ? <Check className="w-4.5 h-4.5 text-emerald-400" /> : <Share2 className="w-4.5 h-4.5" />}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      onClick={handleShare}
      className={cn(
        "rounded-full px-6 py-5 border flex items-center gap-2.5 font-bold shadow-lg transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]",
        copied
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
          : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
      )}
    >
      {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
      <span>{copied ? 'Copied!' : 'Share Summary'}</span>
    </Button>
  )
}
