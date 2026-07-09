import { getServerStudentSession } from '@/lib/auth-server'
import SummaryConsoleClient from './SummaryConsoleClient'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Create Summary | Summaries Hub',
  description: 'Write, preview and publish summaries for students.',
}

export default async function CreateSummaryPage() {
  const session = await getServerStudentSession()

  // Guard: If not logged in or not admin, show Access Denied
  if (!session || (!session.is_admin && !session.is_super_admin) || session.is_banned) {
    return (
      <div className="container mx-auto py-24 px-4 min-h-screen flex items-center justify-center bg-black text-white">
        <Card className="w-full max-w-md bg-zinc-950 border-rose-500/20 backdrop-blur-md p-6 text-center space-y-6">
          <CardHeader className="p-0">
            <div className="mx-auto w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-black text-white">Access Denied</CardTitle>
            <CardDescription className="text-gray-400 mt-2">
              You do not have the required administrative permissions to create or edit summaries.
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

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <SummaryConsoleClient />
      </div>
    </div>
  )
}
