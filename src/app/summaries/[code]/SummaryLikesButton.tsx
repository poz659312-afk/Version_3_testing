'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { toggleLikeSummary } from '../actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SummaryLikesButtonProps {
  code: string
  initialLikes: number
  initialLiked: boolean
  isLoggedIn: boolean
}

export default function SummaryLikesButton({ code, initialLikes, initialLiked, isLoggedIn }: SummaryLikesButtonProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [liked, setLiked] = useState(initialLiked)
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async () => {
    if (!isLoggedIn) {
      toast.error('You must be logged in to like summaries.')
      return
    }

    setIsLiking(true)
    // Optimistic update
    const previousLikes = likes
    const previousLiked = liked

    setLiked(!previousLiked)
    setLikes(prev => previousLiked ? prev - 1 : prev + 1)

    try {
      const result = await toggleLikeSummary(code)
      setLiked(result.liked)
      setLikes(result.likesCount)
    } catch (error: unknown) {
      // Revert on error
      setLiked(previousLiked)
      setLikes(previousLikes)
      const errMsg = error instanceof Error ? error.message : 'Failed to update like status'
      toast.error(errMsg)
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleLike}
      disabled={isLiking}
      className={cn(
        "rounded-full px-6 py-5 border flex items-center gap-2.5 font-bold shadow-lg transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]",
        liked 
          ? "bg-pink-500/10 border-pink-500/30 text-pink-500 hover:bg-pink-500/20" 
          : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
      )}
    >
      <Heart className={cn("w-5 h-5 transition-transform", liked ? "fill-pink-500 scale-110" : "scale-100")} />
      <span>{likes} {likes === 1 ? 'Like' : 'Likes'}</span>
    </Button>
  )
}
