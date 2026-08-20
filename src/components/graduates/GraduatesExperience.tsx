"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { GraduationHero } from "./GraduationHero"
import { GraduationStats } from "./GraduationStats"
import { GraduationAchievements } from "./GraduationAchievements"
import { AlumniResources } from "./AlumniResources"
import { User, Graduate } from "@/lib/types"
import { StudentUser } from "@/lib/auth"
import { createBrowserClient } from "@/lib/supabase/client"

interface GraduatesExperienceProps {
  user: User | StudentUser
}

export function GraduatesExperience({ user }: GraduatesExperienceProps) {
  const [graduateData, setGraduateData] = useState<Graduate | null>(null)

  useEffect(() => {
    async function loadGraduateInfo() {
      if (!user?.auth_id) return
      try {
        const supabase = createBrowserClient()
        const { data } = await supabase
          .from("graduates")
          .select("student_id, graduation_year, graduated_at")
          .eq("student_id", user.auth_id)
          .maybeSingle()
        if (data) {
          setGraduateData(data as Graduate)
        }
      } catch (err) {
        console.error("Failed to fetch graduate record:", err)
      }
    }
    loadGraduateInfo()
  }, [user?.auth_id])

  const gradYear = graduateData?.graduation_year || new Date().getFullYear()

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 pb-20">
      {/* 1. Hero Section */}
      <GraduationHero
        username={user.username || "Chameleon Graduate"}
        graduationYear={gradYear}
        graduatedAt={graduateData?.graduated_at}
        specialization={user.specialization}
      />

      {/* 2. Main Content Container */}
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
        {/* Academic Legacy Stats */}
        <GraduationStats
          authId={user.auth_id}
          coins={user.coins || 0}
          createdAt={user.created_at}
        />

        {/* Alumni Honors & Verified Badges */}
        <GraduationAchievements
          specialization={user.specialization}
          graduationYear={gradYear}
        />

        {/* Continuous Learning & Alumni Hub */}
        <AlumniResources />
      </div>
    </div>
  )
}
export default GraduatesExperience
