import { getServerStudentSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { getContributorProfile, getMyContributorSummaries, getContributorSubfoldersAction } from '../actions'
import ContributorDashboardClient from './ContributorDashboardClient'
import { Summary } from '@/lib/types'

export const metadata = {
  title: 'Contributor Dashboard | Chameleon Summaries',
  description: 'Manage your contributor profile, personal summaries, and Google Drive folders.'
}

export default async function ContributorDashboardPage() {
  const session = await getServerStudentSession()

  // Only admins can access Contributor Dashboard
  if (!session || (!session.is_admin && !session.is_super_admin) || session.is_banned) {
    redirect('/summaries')
  }

  const contributor = await getContributorProfile(session.auth_id)
  let summaries: Summary[] = []
  let subfolders: Array<{ id: string; name: string }> = []

  if (contributor) {
    summaries = await getMyContributorSummaries()
    subfolders = await getContributorSubfoldersAction()
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-16 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <ContributorDashboardClient
          session={session}
          initialContributor={contributor}
          initialSummaries={summaries}
          initialSubfolders={subfolders}
        />
      </div>
    </div>
  )
}
