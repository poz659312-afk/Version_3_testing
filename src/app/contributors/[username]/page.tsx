import { getContributorPublicProfile } from '@/app/summaries/actions'
import { getServerStudentSession } from '@/lib/auth-server'
import { notFound } from 'next/navigation'
import ContributorProfileClient from './ContributorProfileClient'

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params
  const data = await getContributorPublicProfile(username)

  if (!data) {
    return {
      title: 'Contributor Not Found | Chameleon',
    }
  }

  return {
    title: `${data.contributor.display_name} (@${data.contributor.username}) | Chameleon Contributor`,
    description: data.contributor.bio || `Explore academic summaries prepared by ${data.contributor.display_name} on Chameleon FCDS.`,
  }
}

export default async function ContributorProfilePage({ params }: PageProps) {
  const { username } = await params
  const data = await getContributorPublicProfile(username)
  const session = await getServerStudentSession()

  if (!data) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-16 px-4 md:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <ContributorProfileClient
          contributor={data.contributor}
          initialSummaries={data.summaries}
          initialStudentCoins={session?.coins || 0}
        />
      </div>
    </div>
  )
}
