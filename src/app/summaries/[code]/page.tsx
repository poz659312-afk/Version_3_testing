import Link from 'next/link'
import { getServerStudentSession } from '@/lib/auth-server'
import { getSummary } from '../actions'
import SummaryRenderer from '@/components/SummaryRenderer'
import SummaryLikesButton from './SummaryLikesButton'
import SummaryShareButton from './SummaryShareButton'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit2, Calendar, User, BookOpen } from 'lucide-react'

interface SummaryDetailPageProps {
  params: {
    code: string
  }
}

export async function generateMetadata({ params }: SummaryDetailPageProps) {
  const summary = await getSummary(params.code)
  if (!summary) return { title: 'Summary Not Found | Chameleon' }
  return {
    title: `${summary.title} | Summaries Hub`,
    description: `Read the summary of ${summary.title} on Chameleon.`,
  }
}

export default async function SummaryDetailPage({ params }: SummaryDetailPageProps) {
  const session = await getServerStudentSession()
  const summary = await getSummary(params.code)

  if (!summary) {
    return (
      <div className="container mx-auto py-24 px-4 min-h-screen flex items-center justify-center bg-black text-white">
        <Card className="w-full max-w-md bg-zinc-950 border-white/10 backdrop-blur-md p-6 text-center space-y-6">
          <CardHeader className="p-0">
            <div className="mx-auto w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-black text-white">Summary Not Found</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              The summary with code <code className="text-violet-400 font-bold">{params.code}</code> does not exist, is in draft, or you do not have permission to view it.
            </CardDescription>
          </CardHeader>
          <div className="flex flex-col gap-2.5 pt-4">
            <Button asChild className="bg-white hover:bg-gray-200 text-black font-bold py-3.5 rounded-xl">
              <Link href="/summaries">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Summaries Hub
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const isAdmin = session && (session.is_admin || session.is_super_admin) && !session.is_banned
  const isLoggedIn = !!session

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Admin Actions */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <Button asChild variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-xl px-4">
            <Link href="/summaries">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Hub
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <SummaryShareButton code={summary.code} title={summary.title} variant="icon" />
            {isAdmin && (
              <Button asChild className="bg-amber-600 hover:bg-amber-500 border border-amber-500/30 text-white rounded-xl font-bold flex items-center gap-2">
                <Link href={`/summaries/console/${summary.code}`}>
                  <Edit2 className="w-4 h-4" />
                  Edit Summary
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Article Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-0.5 rounded-full text-xs font-mono">
              Code: {summary.code}
            </Badge>
            {isAdmin && (
              <Badge className={summary.is_published ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}>
                {summary.is_published ? 'Published' : 'Draft'}
              </Badge>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
            {summary.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-gray-400 text-sm pt-2">
            <div className="flex items-center gap-2">
              {summary.authorImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={summary.authorImage} alt={summary.authorName} className="w-6 h-6 rounded-full object-cover border border-white/10" />
              ) : (
                <User className="w-4 h-4 text-violet-400" />
              )}
              <span className="font-semibold text-white">{summary.authorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>Published on {new Date(summary.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-zinc-950/40 border border-white/10 p-6 md:p-10 rounded-2xl shadow-2xl relative select-text">
          {/* Subtle glowing elements */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-fuchsia-600/5 rounded-full blur-[100px] pointer-events-none" />

          <SummaryRenderer content={summary.content} />
        </div>

        <div className="flex flex-col items-center justify-center gap-4 py-8 border-t border-white/10">
          <p className="text-gray-400 text-sm">Did you find this summary helpful? Show your support!</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <SummaryLikesButton
              code={summary.code}
              initialLikes={summary.likes_count}
              initialLiked={summary.userLiked}
              isLoggedIn={isLoggedIn}
            />
            <SummaryShareButton
              code={summary.code}
              title={summary.title}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
