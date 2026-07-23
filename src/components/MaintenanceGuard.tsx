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
      // 1. Check if user is bypassing (reads window.location.search internally)
      const hasBypass = checkBypass()
      if (hasBypass) {
        setLoading(false)
        return
      }

      // 2. Fetch platform pause status from DB
      const paused = await isPlatformPaused()

      // 3. If paused and not on homepage, redirect to homepage "/"
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
