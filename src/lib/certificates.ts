export interface CertificateItem {
  id: string
  title: string
  titleEn: string
  description: string
  category: "subject" | "achievement" | "honor"
  courseName?: string
  studentName?: string
  issueDate?: string
  serialCode: string
  badgeColor: string
  accentColor: string
  isUnlocked: boolean
  progress: number // 0 - 100
  criteriaText: string
  instructorName?: string
  founderName?: string
  grade?: string
}

export function generateSerialCode(certId: string, studentId?: string): string {
  const cleanCert = certId.replace("cert-", "").toUpperCase()
  const hash = Math.floor(1000 + Math.random() * 9000)
  return `CHAM-2026-${cleanCert.slice(0, 4)}-${hash}`
}

export function getUserCertificates(userData: any): CertificateItem[] {
  const solvedCount = userData?.solvedQuizzesCount || (Array.isArray(userData?.solvedQuizzes) ? userData.solvedQuizzes.length : 0) || 0
  const coins = userData?.coins || 0
  const inventory = Array.isArray(userData?.inventory) ? userData.inventory : []
  const studentName = userData?.username || userData?.fullName || userData?.name || (userData?.email ? userData.email.split('@')[0] : "Academic Student")

  const nowStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })

  return [
    {
      id: "cert-first-step",
      title: "Academic Pioneer Milestone",
      titleEn: "Academic Pioneer Milestone",
      description: "Awarded in recognition of initiating the academic journey and successfully passing the first quiz on Chameleon Platform.",
      category: "achievement",
      courseName: "Foundational Academic Journey",
      studentName,
      issueDate: nowStr,
      serialCode: generateSerialCode("first-step", userData?.id),
      badgeColor: "from-emerald-400 to-teal-600",
      accentColor: "emerald",
      isUnlocked: solvedCount >= 1 || coins >= 50,
      progress: Math.min(100, solvedCount >= 1 ? 100 : Math.round((coins / 50) * 100)),
      criteriaText: "Complete at least 1 quiz on the platform",
      instructorName: "Dr. Erwin Smith",
      founderName: "Levi Ackerman",
      grade: "First-Class Distinction"
    },
    {
      id: "cert-pro-solver",
      title: "Pro Solver Excellence Honor",
      titleEn: "Pro Solver Excellence Honor",
      description: "Certificate of Honor awarded to the student for demonstrating superior problem-solving efficiency across advanced quizzes.",
      category: "honor",
      courseName: "Advanced Quiz Mastery & Analysis",
      studentName,
      issueDate: nowStr,
      serialCode: generateSerialCode("pro-solver", userData?.id),
      badgeColor: "from-purple-500 via-indigo-600 to-blue-500",
      accentColor: "purple",
      isUnlocked: solvedCount >= 5 || inventory.includes("badge-pro-solver") || coins >= 500,
      progress: Math.min(100, Math.round((Math.max(solvedCount, Math.floor(coins / 5)) / 5) * 100)),
      criteriaText: "Solve 5 quizzes or earn 500 coins",
      instructorName: "Dr. Erwin Smith",
      founderName: "Levi Ackerman",
      grade: "High Distinction (Summa Cum Laude)"
    },
    {
      id: "cert-subject-cism",
      title: "CISM Subject Mastery Certificate",
      titleEn: "Certificate of Subject Mastery - CISM",
      description: "Chameleon Academy certifies that the student has successfully fulfilled all academic computations and evaluation modules for CISM.",
      category: "subject",
      courseName: "Computing-Intensive Statistical Methods",
      studentName,
      issueDate: nowStr,
      serialCode: generateSerialCode("cism-mastery", userData?.id),
      badgeColor: "from-amber-400 via-orange-500 to-rose-600",
      accentColor: "amber",
      isUnlocked: solvedCount >= 10 || coins >= 1000,
      progress: Math.min(100, Math.round((solvedCount / 10) * 100)),
      criteriaText: "Complete 10 CISM course quizzes",
      instructorName: "Dr. Erwin Smith",
      founderName: "Levi Ackerman",
      grade: "First-Class Honors A+"
    },
    {
      id: "cert-speed-demon",
      title: "Speed & Accuracy Legend Award",
      titleEn: "Speed & Accuracy Legend Award",
      description: "Awarded to the extraordinary student who completed timed assessment modules with record efficiency and flawless precision.",
      category: "achievement",
      courseName: "Rapid Analytical Reasoning & Speed Metrics",
      studentName,
      issueDate: nowStr,
      serialCode: generateSerialCode("speed-demon", userData?.id),
      badgeColor: "from-cyan-400 via-blue-500 to-indigo-600",
      accentColor: "cyan",
      isUnlocked: inventory.includes("badge-speed-demon") || coins >= 1500,
      progress: Math.min(100, Math.round((coins / 1500) * 100)),
      criteriaText: "Unlock Speed Demon badge or earn 1,500 coins",
      instructorName: "Dr. Erwin Smith",
      founderName: "Levi Ackerman",
      grade: "1st Rank Speed Champion"
    },
    {
      id: "cert-academy-titan",
      title: "Chameleon Academy Titan Honor",
      titleEn: "Chameleon Academy Titan Honor",
      description: "The highest academic honor bestowed upon elite scholars for exceptional dedication, platform leadership, and academic mastery.",
      category: "honor",
      courseName: "Chameleon Academy Titan Elite Honor",
      studentName,
      issueDate: nowStr,
      serialCode: generateSerialCode("titan-elite", userData?.id),
      badgeColor: "from-amber-300 via-yellow-500 via-orange-500 to-amber-600",
      accentColor: "gold",
      isUnlocked: coins >= 3000 || inventory.includes("theme-solaris"),
      progress: Math.min(100, Math.round((coins / 3000) * 100)),
      criteriaText: "Earn 3,000 coins or equip Solaris Supernova theme",
      instructorName: "Dr. Erwin Smith",
      founderName: "Levi Ackerman",
      grade: "Titan Elite Medal of Excellence"
    }
  ]
}
