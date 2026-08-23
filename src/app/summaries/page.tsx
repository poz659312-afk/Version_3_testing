import { getServerStudentSession } from '@/lib/auth-server'
import { getPublishedSummaries } from './actions'
import SummariesHubClient from './SummariesHubClient'

export const metadata = {
  title: 'Summaries Hub | Chameleon FCDS',
  description: 'Explore verified student summaries, lecture notes, and study guides prepared by top contributors.',
}

export default async function SummariesPage() {
  const session = await getServerStudentSession()
  const isAdmin = !!(session && (session.is_admin || session.is_super_admin) && !session.is_banned)

  const summaries = await getPublishedSummaries()

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-16 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <SummariesHubClient
          initialSummaries={summaries}
          session={session}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
