import { Metadata } from 'next'
import { getServerStudentSession } from '@/lib/auth-server'
import { getRoomsList } from './actions'
import StudyRoomsDirectoryClient from './StudyRoomsDirectoryClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Collaborative Study Rooms - Chameleon',
  description: 'Study and solve quizzes together with students in your specialization.',
}

export default async function StudyRoomsPage() {
  const session = await getServerStudentSession()

  if (!session || session.is_banned) {
    return (
      <div className="container mx-auto py-20 px-4 min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="bg-card border-border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-destructive" />
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                  <ShieldAlert className="w-7 h-7 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">Access Denied</CardTitle>
              <CardDescription className="text-xs mt-1 text-muted-foreground">
                Please log in to access the study rooms.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 text-center">
              <Link href="/">
                <Button variant="outline" className="border-border hover:bg-muted text-xs cursor-pointer">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Pre-fetch matching rooms on the server
  const initialRooms = await getRoomsList()

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <StudyRoomsDirectoryClient 
        initialRooms={initialRooms} 
        userSpecialization={session.specialization || 'General'} 
        userLevel={session.current_level || 1} 
        isAdmin={!!(session.is_admin || session.is_super_admin)}
      />
    </div>
  )
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
