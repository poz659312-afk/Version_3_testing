'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getServerStudentSession } from '@/lib/auth-server'
import { UserReport, ReportCategory, ReportPriority, ReportStatus } from '@/lib/types'
import { revalidatePath } from 'next/cache'

/**
 * Validates admin access
 */
async function checkAdminOrSuperAdmin() {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin) || session.is_banned) {
    throw new Error('Unauthorized. Admin access required.')
  }
  return session
}

export interface SubmitReportInput {
  user_id?: string | null
  username: string
  user_email?: string | null
  user_phone?: string | null
  category: ReportCategory
  title: string
  description: string
  priority?: ReportPriority
  page_url?: string | null
  screenshot_url?: string | null
}

/**
 * Submit a new user report / complaint
 */
export async function submitReport(input: SubmitReportInput) {
  try {
    const supabase = createAdminClient()

    if (!input.title || input.title.trim().length < 3) {
      return { success: false, error: 'Issue title must be at least 3 characters long.' }
    }

    if (!input.description || input.description.trim().length < 10) {
      return { success: false, error: 'Please provide a clear description (at least 10 characters).' }
    }

    const reportData = {
      user_id: input.user_id || null,
      username: input.username ? input.username.trim() : 'Anonymous',
      user_email: input.user_email ? input.user_email.trim() : null,
      user_phone: input.user_phone ? input.user_phone.trim() : null,
      category: input.category || 'bug',
      title: input.title.trim(),
      description: input.description.trim(),
      priority: input.priority || 'normal',
      page_url: input.page_url ? input.page_url.trim() : null,
      screenshot_url: input.screenshot_url ? input.screenshot_url.trim() : null,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('reports')
      .insert(reportData)
      .select()
      .single()

    if (error) {
      console.error('Error submitting report:', error)
      return { success: false, error: error.message || 'Failed to submit report. Please try again.' }
    }

    revalidatePath('/profile')
    revalidatePath('/admin')
    revalidatePath('/report')

    return { success: true, report: data as UserReport }
  } catch (err: any) {
    console.error('Error submitting report caught:', err)
    return { success: false, error: err.message || 'Failed to submit report.' }
  }
}

/**
 * Fetch reports submitted by a specific user
 */
export async function getUserReports(userId: string) {
  try {
    if (!userId) return []
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user reports:', error)
      return []
    }

    return (data || []) as UserReport[]
  } catch (err) {
    console.error('Error fetching user reports:', err)
    return []
  }
}

/**
 * Get count of unresolved reports (status: open or in_progress)
 * Used for admin navigation/tab badge
 */
export async function getUnresolvedReportsCount(): Promise<number> {
  try {
    const supabase = createAdminClient()

    const { count, error } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress'])

    if (error) {
      return 0
    }

    return count || 0
  } catch (err) {
    return 0
  }
}

/**
 * Fetch all reports with filters, pagination, and statistics for Admins
 */
export async function getAllReports(params?: {
  status?: string
  category?: string
  priority?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  await checkAdminOrSuperAdmin()
  const supabase = createAdminClient()

  const page = params?.page || 1
  const pageSize = params?.pageSize || 15
  const status = params?.status || 'all'
  const category = params?.category || 'all'
  const priority = params?.priority || 'all'
  const search = params?.search || ''

  // 1. Fetch statistics
  const { data: allStats, error: statsError } = await supabase
    .from('reports')
    .select('status')

  let totalCount = 0
  let openCount = 0
  let inProgressCount = 0
  let resolvedCount = 0
  let closedCount = 0

  if (!statsError && allStats) {
    totalCount = allStats.length
    openCount = allStats.filter((r: any) => r.status === 'open').length
    inProgressCount = allStats.filter((r: any) => r.status === 'in_progress').length
    resolvedCount = allStats.filter((r: any) => r.status === 'resolved').length
    closedCount = allStats.filter((r: any) => r.status === 'closed').length
  }

  // 2. Build filtered paginated query
  let query = supabase
    .from('reports')
    .select('*', { count: 'exact' })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (category !== 'all') {
    query = query.eq('category', category)
  }

  if (priority !== 'all') {
    query = query.eq('priority', priority)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,username.ilike.%${search}%,user_email.ilike.%${search}%`)
  }

  query = query.order('created_at', { ascending: false })

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching all reports:', error)
    throw new Error(error.message)
  }

  return {
    reports: (data || []) as UserReport[],
    totalFiltered: count || 0,
    stats: {
      total: totalCount,
      open: openCount,
      inProgress: inProgressCount,
      resolved: resolvedCount,
      closed: closedCount,
      unresolved: openCount + inProgressCount
    }
  }
}

/**
 * Update report status and add an administrative reply
 */
export async function updateReportStatusAndReply(input: {
  reportId: string
  status: ReportStatus
  adminReply?: string
  adminAuthId?: string
  adminName?: string
}) {
  const session = await checkAdminOrSuperAdmin()
  const supabase = createAdminClient()

  const adminId = input.adminAuthId || session.auth_id
  const adminName = input.adminName || session.username || 'System Admin'

  const updatePayload: Record<string, any> = {
    status: input.status,
    admin_reply: input.adminReply !== undefined ? input.adminReply : null,
    admin_id: adminId,
    admin_name: adminName,
    updated_at: new Date().toISOString()
  }

  if (input.status === 'resolved') {
    updatePayload.resolved_at = new Date().toISOString()
  }

  const { data: updatedReport, error } = await supabase
    .from('reports')
    .update(updatePayload)
    .eq('id', input.reportId)
    .select()
    .single()

  if (error) {
    console.error('Error updating report status:', error)
    return { success: false, error: error.message }
  }

  // If report has a linked user, send a notification to their notification box
  if (updatedReport && updatedReport.user_id) {
    try {
      const statusLabels: Record<ReportStatus, string> = {
        open: 'Under Review',
        in_progress: 'In Progress',
        resolved: 'Resolved 🎉',
        closed: 'Closed'
      }

      const statusLabel = statusLabels[input.status] || input.status
      let messageContent = `Your report ("${updatedReport.title}") status has been updated to: ${statusLabel}.`
      if (input.adminReply && input.adminReply.trim()) {
        messageContent += `\nAdmin note: ${input.adminReply.trim()}`
      }

      await supabase.from('Notifications').insert({
        auth_id: updatedReport.user_id,
        title: `Report Update: ${updatedReport.title.slice(0, 30)}`,
        message_content: messageContent,
        type: 'report_update',
        provider: 'chameleon_support',
        seen: 'false',
        created_at: new Date().toISOString()
      })
    } catch (notifErr) {
      console.warn('Could not dispatch user notification for report update:', notifErr)
    }
  }

  revalidatePath('/admin')
  revalidatePath('/profile')
  revalidatePath('/report')

  return { success: true, report: updatedReport as UserReport }
}

/**
 * Delete a report
 */
export async function deleteReport(reportId: string) {
  await checkAdminOrSuperAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId)

  if (error) {
    console.error('Error deleting report:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/profile')
  revalidatePath('/report')

  return { success: true }
}
