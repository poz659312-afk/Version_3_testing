"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { isPlatformPaused, checkBypass } from "@/lib/maintenance"

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMaintenance = async () => {
      // 1. Check if the current user is the owner (owner always bypasses maintenance mode)
      const { getStudentSession } = await import('@/lib/auth')
      const session = await getStudentSession()
      const isOwner = session?.email === 'tokyo9900777@gmail.com'

      // 2. Check if user has bypass (local override key)
      const hasBypass = checkBypass() || isOwner
      if (hasBypass) {
        setLoading(false)
        return
      }

      // 3. Fetch platform pause status from DB
      const paused = await isPlatformPaused()

      // 4. If paused and not on homepage, redirect to homepage "/"
      if (paused && pathname !== "/") {
        router.push("/")
      } else {
        setLoading(false)
      }
    }

    checkMaintenance()
  }, [pathname, router])

  return <>{children}</>
}
