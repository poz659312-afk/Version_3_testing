import { getServerStudentSession } from '@/lib/auth-server'
import { getPublishedSummaries, getAllSummariesForAdmin } from './actions'
import SummariesHubClient from './SummariesHubClient'

export const metadata = {
  title: 'Summaries Hub | Chameleon',
  description: 'Explore premium summaries with formulas and visual elements created by experts.',
}

export default async function SummariesPage() {
  const session = await getServerStudentSession()
  const isAdmin = session && (session.is_admin || session.is_super_admin) && !session.is_banned

  // Fetch summaries based on role
  let summaries: {
    code: string
    title: string
    likes_count: number
    is_published: boolean
    created_at: string
    creator_id: string
    authorName: string
  }[] = []
  try {
    if (isAdmin) {
      summaries = await getAllSummariesForAdmin()
    } else {
      summaries = await getPublishedSummaries()
    }
  } catch (error) {
    console.error('Failed to load summaries:', error)
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <SummariesHubClient 
          initialSummaries={summaries} 
          isAdmin={!!isAdmin} 
        />
      </div>
    </div>
  )
}
