export type UserStatus = 'student' | 'graduated'

export interface Graduate {
  student_id: string
  graduation_year: number
  graduated_at: string
}

export interface User {
  auth_id: string
  username: string
  phone_number: string
  specialization: string
  age: number
  current_level: number | null
  status?: UserStatus
  is_admin: boolean
  is_banned: boolean
  created_at: string
  profile_image?: string
  email?: string
  coins?: number
  inventory?: string[]
  is_super_admin: boolean
}

export interface Contributor {
  id: string
  admin_id: string
  display_name: string
  username: string
  bio?: string | null
  avatar_url?: string | null
  drive_folder_id: string
  created_at: string
  updated_at: string
  // Optional computed / join fields
  summaries_count?: number
  total_votes?: number
  total_earned_coins?: number
}

export interface Summary {
  id: string
  contributor_id: string
  title: string
  description?: string | null
  subject_id?: string | null
  drive_file_id: string
  drive_folder_id?: string | null
  drive_url?: string | null
  file_name: string
  file_type?: string | null
  file_size?: number | null
  votes: number
  earned_coins: number
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  // Optional join fields
  contributor?: Contributor | null
  authorName?: string
  authorAvatar?: string | null
  authorUsername?: string
}

export interface Quiz {
  id: number
  title: string
  description: string
  questions: QuizQuestion[]
  max_score: number
  created_at: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct: number
}

export interface QuizAttempt {
  id: number
  auth_id: string
  phone_number: string
  quiz_id: number
  score: number
  created_at: string
}

export interface Notification {
  id: number
  created_at: string
  title: string | null
  auth_id: string | null
  seen: string | null
  provider: string | null
  type: string | null
  message_content: string | null
}

export interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (notificationId: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => Promise<void>
  deleteNotification: (notificationId: number) => Promise<void>
  refreshNotifications: () => Promise<void>
  fetchNotificationsOnLogin: (authId: string) => Promise<void>
}
