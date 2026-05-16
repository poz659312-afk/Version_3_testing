// [PERF] Lazy wrapper for NotificationProvider
// This prevents Supabase (~25kB) from being included in the shared chunk.
// The actual NotificationProvider only mounts after the component loads client-side.
"use client"

import { NotificationProvider } from "@/hooks/use-notifications"
import { ReactNode } from "react"

export default function LazyNotificationProvider({ children }: { children: ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>
}
