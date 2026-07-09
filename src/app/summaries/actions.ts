'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerStudentSession } from '@/lib/auth-server'
import { revalidatePath } from 'next/cache'

// Helper to generate a unique random code for summaries (e.g. sum_8ae92b8d)
function generateUniqueCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = 'sum_'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Creates a new summary (Admin only)
 */
export async function createSummary(title: string, content: string, isPublished: boolean = false) {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin) || session.is_banned) {
    throw new Error('Unauthorized. Admin access required.')
  }

  if (!title.trim() || !content.trim()) {
    throw new Error('Title and content are required.')
  }

  const supabase = await createServerSupabaseClient()
  let code = generateUniqueCode()
  
  // Ensure unique code
  let attempts = 0
  while (attempts < 5) {
    const { data } = await supabase
      .from('summaries')
      .select('code')
      .eq('code', code)
      .single()
    if (!data) break
    code = generateUniqueCode()
    attempts++
  }

  const { data, error } = await supabase
    .from('summaries')
    .insert({
      code,
      title: title.trim(),
      content: content.trim(),
      creator_id: session.auth_id,
      is_published: isPublished,
      likes_count: 0
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating summary:', error)
    throw new Error(`Failed to create summary: ${error.message}`)
  }

  revalidatePath('/summaries')
  return data
}

/**
 * Updates an existing summary (Admin only)
 */
export async function updateSummary(
  code: string,
  updates: { title?: string; content?: string; is_published?: boolean }
) {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin) || session.is_banned) {
    throw new Error('Unauthorized. Admin access required.')
  }

  const supabase = await createServerSupabaseClient()
  
  // Verify the summary exists
  const { data: existing, error: fetchError } = await supabase
    .from('summaries')
    .select('code, creator_id')
    .eq('code', code)
    .single()

  if (fetchError || !existing) {
    throw new Error('Summary not found.')
  }

  const updatePayload: {
    title?: string
    content?: string
    is_published?: boolean
    updated_at: string
  } = {
    updated_at: new Date().toISOString()
  }
  if (updates.title !== undefined) updatePayload.title = updates.title.trim()
  if (updates.content !== undefined) updatePayload.content = updates.content.trim()
  if (updates.is_published !== undefined) updatePayload.is_published = updates.is_published

  const { data, error } = await supabase
    .from('summaries')
    .update(updatePayload)
    .eq('code', code)
    .select()
    .single()

  if (error) {
    console.error('Error updating summary:', error)
    throw new Error(`Failed to update summary: ${error.message}`)
  }

  revalidatePath('/summaries')
  revalidatePath(`/summaries/${code}`)
  return data
}

/**
 * Deletes a summary (Admin only)
 */
export async function deleteSummary(code: string) {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin) || session.is_banned) {
    throw new Error('Unauthorized. Admin access required.')
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('summaries')
    .delete()
    .eq('code', code)

  if (error) {
    console.error('Error deleting summary:', error)
    throw new Error(`Failed to delete summary: ${error.message}`)
  }

  revalidatePath('/summaries')
  return { success: true }
}

/**
 * Fetches a single summary by its code.
 * If draft, only admins can view it.
 */
export async function getSummary(code: string) {
  const session = await getServerStudentSession()
  const supabase = await createServerSupabaseClient()

  // Query summary and creator details
  const { data: summary, error } = await supabase
    .from('summaries')
    .select(`
      code,
      title,
      content,
      likes_count,
      is_published,
      created_at,
      updated_at,
      creator_id
    `)
    .eq('code', code)
    .single()

  if (error || !summary) {
    return null
  }

  // If not published, only admins can view
  const isAdmin = session && (session.is_admin || session.is_super_admin) && !session.is_banned
  if (!summary.is_published && !isAdmin) {
    return null
  }

  // Fetch author details
  const { data: author } = await supabase
    .from('chameleons')
    .select('username, profile_image')
    .eq('auth_id', summary.creator_id)
    .single()

  // Check if current user liked it
  let userLiked = false
  if (session) {
    const { data: like } = await supabase
      .from('summary_likes')
      .select('created_at')
      .eq('summary_code', code)
      .eq('user_id', session.auth_id)
      .single()
    if (like) userLiked = true
  }

  return {
    ...summary,
    authorName: author?.username || 'Unknown Author',
    authorImage: author?.profile_image || null,
    userLiked
  }
}

/**
 * Fetch all published summaries
 */
export async function getPublishedSummaries() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('summaries')
    .select(`
      code,
      title,
      likes_count,
      is_published,
      created_at,
      creator_id
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching published summaries:', error)
    return []
  }

  // Fetch author names
  const authorIds = Array.from(new Set(data.map(item => item.creator_id)))
  const { data: authors } = await supabase
    .from('chameleons')
    .select('auth_id, username')
    .in('auth_id', authorIds)

  const authorMap = new Map(authors?.map(a => [a.auth_id, a.username]) || [])

  return data.map(item => ({
    ...item,
    authorName: authorMap.get(item.creator_id) || 'Unknown Author'
  }))
}

/**
 * Fetch all summaries (Admin only, shows both drafts & published)
 */
export async function getAllSummariesForAdmin() {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin) || session.is_banned) {
    throw new Error('Unauthorized. Admin access required.')
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('summaries')
    .select(`
      code,
      title,
      likes_count,
      is_published,
      created_at,
      updated_at,
      creator_id
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admin summaries:', error)
    return []
  }

  const authorIds = Array.from(new Set(data.map(item => item.creator_id)))
  const { data: authors } = await supabase
    .from('chameleons')
    .select('auth_id, username')
    .in('auth_id', authorIds)

  const authorMap = new Map(authors?.map(a => [a.auth_id, a.username]) || [])

  return data.map(item => ({
    ...item,
    authorName: authorMap.get(item.creator_id) || 'Unknown Author'
  }))
}

/**
 * Toggles the like on a summary
 */
export async function toggleLikeSummary(code: string) {
  const session = await getServerStudentSession()
  if (!session || session.is_banned) {
    throw new Error('You must be logged in to like summaries.')
  }

  const supabase = await createServerSupabaseClient()
  
  // Check if like exists
  const { data: existingLike } = await supabase
    .from('summary_likes')
    .select('created_at')
    .eq('summary_code', code)
    .eq('user_id', session.auth_id)
    .single()

  let liked = false

  if (existingLike) {
    // Unlike
    const { error: deleteError } = await supabase
      .from('summary_likes')
      .delete()
      .eq('summary_code', code)
      .eq('user_id', session.auth_id)

    if (deleteError) {
      console.error('Error removing like:', deleteError)
      throw new Error('Failed to remove like')
    }
    liked = false
  } else {
    // Like
    const { error: insertError } = await supabase
      .from('summary_likes')
      .insert({
        summary_code: code,
        user_id: session.auth_id
      })

    if (insertError) {
      console.error('Error adding like:', insertError)
      throw new Error('Failed to add like')
    }
    liked = true
  }

  // Fetch updated count
  const { data: summary } = await supabase
    .from('summaries')
    .select('likes_count')
    .eq('code', code)
    .single()

  revalidatePath(`/summaries/${code}`)
  revalidatePath('/summaries')
  return {
    liked,
    likesCount: summary?.likes_count || 0
  }
}

/**
 * Uploads an image to the summaries storage bucket.
 * Falls back to Base64 if storage is not set up or fails.
 */
export async function uploadSummaryImage(base64Data: string, fileName: string): Promise<string> {
  const session = await getServerStudentSession()
  if (!session || (!session.is_admin && !session.is_super_admin) || session.is_banned) {
    throw new Error('Unauthorized. Admin access required.')
  }

  try {
    const supabase = await createServerSupabaseClient()
    
    // Parse the base64 string
    const match = base64Data.match(/^data:([^;]+);base64,(.*)$/)
    if (!match) {
      // Not a data URL, return original
      return base64Data
    }

    const mimeType = match[1]
    const base64Body = match[2]
    const buffer = Buffer.from(base64Body, 'base64')

    // Generate unique file path
    const fileExt = fileName.split('.').pop() || 'png'
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const filePath = `images/${Date.now()}_${cleanFileName}.${fileExt}`

    const { error } = await supabase.storage
      .from('summaries')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true
      })

    if (error) {
      console.warn('Supabase storage upload error, falling back to base64:', error.message)
      return base64Data
    }

    const { data: { publicUrl } } = supabase.storage
      .from('summaries')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error: unknown) {
    console.error('Image upload failed, falling back to base64:', error)
    return base64Data
  }
}
