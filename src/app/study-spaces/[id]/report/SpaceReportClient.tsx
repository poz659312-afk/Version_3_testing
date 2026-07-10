'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MessageSquare, Swords, HelpCircle, Users, BarChart3, TrendingUp, Calendar, AlertCircle } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts'

interface SpaceReportClientProps {
  roomName: string
  roomId: string
  reportData: any
}

export default function SpaceReportClient({ roomName, roomId, reportData }: SpaceReportClientProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }

  const { stats, recentActivity, chartData } = reportData

  // Format dates
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push(`/study-spaces/${roomId}`)}
            className="border-border hover:bg-muted cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{roomName}</h1>
              <Badge variant="outline" className="text-[9px] py-0 h-4 border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-semibold">
                Activity Report
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Statistical insights, member activity, and learning charts.</p>
          </div>
        </div>
      </div>

      {/* Grid of Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-450" />
              Active Members
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">{stats.approvedMembers}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card border-border shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-405" />
              Total Messages
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">{stats.totalMessages}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card border-border shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-450" />
              Q&A Doubts
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">{stats.totalQuestions}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card border-border shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-rose-455" />
              Quiz Battles
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">{stats.totalChallenges}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Activity Timeline Chart */}
        <Card className="lg:col-span-8 bg-card border-border shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-450" />
              Weekly Activity Overview
            </CardTitle>
            <CardDescription className="text-[10px]">Comparative trend analysis of messages, Q&A, and battles.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBattles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e35" vertical={false} />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e222b', border: '1px solid #2e323d', borderRadius: '8px' }}
                  labelStyle={{ fontSize: '10px', color: '#9ca3af', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Area type="monotone" name="Chats" dataKey="messages" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorMsgs)" />
                <Area type="monotone" name="Quiz Battles" dataKey="challenges" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorBattles)" />
                <Area type="monotone" name="Q&A Doubts" dataKey="questions" stroke="#eab308" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Member Enrollment Chart */}
        <Card className="lg:col-span-4 bg-card border-border shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-450" />
              Membership Distribution
            </CardTitle>
            <CardDescription className="text-[10px]">Enrollment status breakdown inside the space.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4 flex flex-col justify-between">
            <div className="flex-1 min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Approved', count: stats.approvedMembers },
                  { name: 'Pending', count: stats.pendingMembers }
                ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2e35" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e222b', border: '1px solid #2e323d', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-muted-foreground p-3 bg-muted/20 border border-border rounded-xl mt-4">
              <div className="flex justify-between py-1">
                <span>Approved (Active):</span>
                <span className="font-bold text-foreground">{stats.approvedMembers} users</span>
              </div>
              <div className="flex justify-between py-1 border-t border-border/40">
                <span>Pending Request:</span>
                <span className="font-bold text-foreground">{stats.pendingMembers} users</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-405" />
              Recent Discussion Log
            </CardTitle>
            <CardDescription className="text-[10px]">Real-time message history overview.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {recentActivity.messages.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No recent messages.</p>
            ) : (
              recentActivity.messages.map((m: any, idx: number) => (
                <div key={idx} className="flex justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-foreground">{m.user?.username || 'Student'}</span>
                    <p className="text-muted-foreground leading-normal">{m.content}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium shrink-0 flex items-center">
                    {formatDate(m.created_at)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-md">
          <CardHeader className="pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-rose-455" />
              Recent Quiz Battles Log
            </CardTitle>
            <CardDescription className="text-[10px]">Timeline of launched quiz battles.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {recentActivity.challenges.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No recent challenges.</p>
            ) : (
              recentActivity.challenges.map((c: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-foreground">Quiz Code: {c.quiz_code}</span>
                    <p className="text-[10px] text-muted-foreground">Status: <Badge variant="secondary" className="text-[8px] py-0 px-1 font-semibold">{c.status}</Badge></p>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium shrink-0 flex items-center">
                    {formatDate(c.created_at)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
