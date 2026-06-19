import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerStudentSession } from '@/lib/auth-server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminDashboardClient from './AdminDashboardClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Super Admin Management - Chameleon',
  description: 'Configure and monitor system permissions and Google Drive sync access.',
}

export default async function AdminPage() {
  const session = await getServerStudentSession()

  // Guard: If not logged in or not a super admin, show Access Denied UI
  if (!session || !session.is_super_admin || session.is_banned) {
    return (
      <div className="container mx-auto py-20 px-4 min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-md animate-notif-modal-enter">
          <Card className="bg-card border-border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-destructive" />
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                  <ShieldAlert className="w-7 h-7 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">Access Denied</CardTitle>
              <CardDescription className="text-muted-foreground text-xs mt-1">
                You do not have the required permissions to view this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-destructive/10 border-destructive/20 text-destructive-foreground text-sm">
                <AlertDescription className="text-muted-foreground text-center">
                  Only authenticated users with <strong>super admin privileges</strong> are authorized to access the System Admin Console.
                </AlertDescription>
              </Alert>

              <div className="pt-2">
                <Link href="/">
                  <Button variant="outline" className="w-full border-border hover:bg-muted">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Server-side pre-fetching of initial data
  const supabase = createAdminClient()

  // 1. Fetch Users (Page 1, Size 10, Sorted by created_at desc)
  const { data: users, count: totalCount } = await supabase
    .from('chameleons')
    .select('auth_id, username, email, specialization, current_level, is_admin, is_super_admin, is_banned, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 9)

  // 2. Fetch Access Rules
  const { data: rules } = await supabase
    .from('drive_access_rules')
    .select('*')
    .order('created_at', { ascending: false })

  // 3. Fetch Audit Logs
  const { data: logs } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <AdminDashboardClient
        initialUsers={users || []}
        initialTotalCount={totalCount || 0}
        initialRules={rules || []}
        initialLogs={logs || []}
        adminAuthId={session.auth_id}
      />
    </div>
  )
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
