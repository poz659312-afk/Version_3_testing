import { getServerStudentSession } from '@/lib/auth-server'
import { getRoomDetails, joinStudyRoom } from '../actions'
import StudyRoomClient from './StudyRoomClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface RoomPageProps {
  params: {
    id: string
  }
}

export default async function StudyRoomPage({ params }: RoomPageProps) {
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
                Please log in to access this study room.
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

  try {
    const details = await getRoomDetails(params.id)

    // Guard: If student is not a member of this room (accessed via direct URL)
    const bypassCheck = !!session.is_super_admin;
    if (!details.isMember && !bypassCheck) {
      if (details.isPending) {
        return (
          <div className="container mx-auto py-20 px-4 min-h-[85vh] flex items-center justify-center">
            <div className="w-full max-w-md animate-notif-modal-enter">
              <Card className="bg-card border-border shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-yellow-500" />
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                      <Users className="w-7 h-7 text-yellow-500" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold">Approval Pending</CardTitle>
                  <CardDescription className="text-xs mt-1 text-muted-foreground">
                    Your request to join this study group is waiting for the owner's approval.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    Once approved, you will have full access to <strong>{details.room.name}</strong>.
                  </p>

                  <div className="pt-2 flex flex-col gap-2">
                    <Link href="/study-rooms" className="w-full">
                      <Button variant="outline" className="w-full border-border hover:bg-muted text-xs cursor-pointer">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Directory
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      }

      const joinAction = async () => {
        'use server'
        await joinStudyRoom(params.id)
        redirect(`/study-rooms/${params.id}`)
      }

      const requiresApproval = details.room.join_approval === 'requires_approval';

      return (
        <div className="container mx-auto py-20 px-4 min-h-[85vh] flex items-center justify-center">
          <div className="w-full max-w-md animate-notif-modal-enter">
            <Card className="bg-card border-border shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold">Join Study Room</CardTitle>
                <CardDescription className="text-xs mt-1 text-muted-foreground">
                  You are not currently a member of this study group.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Join <strong>{details.room.name}</strong> to collaborate on summaries, chat with peers, and solve quizzes together.
                </p>

                <div className="pt-2 flex flex-col gap-2">
                  <form action={joinAction} className="w-full">
                    <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90 text-xs font-semibold cursor-pointer">
                      {requiresApproval ? 'Request Access (Approval Required)' : 'Join Group (Immediate)'}
                    </Button>
                  </form>
                  <Link href="/study-rooms" className="w-full">
                    <Button variant="outline" className="w-full border-border hover:bg-muted text-xs cursor-pointer">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Directory
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <StudyRoomClient 
          initialDetails={details} 
          roomId={params.id}
        />
      </div>
    )
  } catch (err: any) {
    return (
      <div className="container mx-auto py-20 px-4 min-h-[85vh] flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="bg-card border-border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-destructive" />
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                  <ShieldAlert className="w-7 h-7 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">Error Loading Room</CardTitle>
              <CardDescription className="text-xs mt-1 text-muted-foreground">
                {err.message || 'An unexpected error occurred.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 text-center">
              <Link href="/study-rooms">
                <Button variant="outline" className="border-border hover:bg-muted text-xs">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Directory
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
