import { getRoomReportData, getRoomDetails } from '../../actions'
import RoomReportClient from './RoomReportClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ReportPageProps {
  params: {
    id: string
  }
}

export default async function RoomReportPage({ params }: ReportPageProps) {
  const details = await getRoomDetails(params.id)
  const report = await getRoomReportData(params.id)

  if (!report.success) {
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
              <CardTitle className="text-xl font-bold">Access Denied</CardTitle>
              <CardDescription className="text-xs mt-1 text-muted-foreground">
                {report.error || 'Failed to load report data.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 text-center">
              <Link href={`/study-rooms/${params.id}`}>
                <Button variant="outline" className="border-border hover:bg-muted text-xs cursor-pointer">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Study Room
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <RoomReportClient 
        roomName={details.room.name} 
        roomId={params.id} 
        reportData={report} 
      />
    </div>
  )
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
