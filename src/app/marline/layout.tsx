import type React from "react"
import type { Metadata } from "next"
import { Rubik } from "next/font/google"
import "../globals.css"

const rubik = Rubik({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-rubik",
})

export const metadata: Metadata = {
  title: "Marline AI - The Intelligent Companion",
  description: "Your smart academic companion for Chameleon FCDS to answer queries, explain code, and assist with your studies.",
  generator: "Chameleon v3.0",
}

export default function MarlineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div lang="ar" dir="rtl" className={`${rubik.variable} font-[var(--font-rubik)] antialiased min-h-screen bg-background text-foreground`}>
      {children}
    </div>
  )
}
