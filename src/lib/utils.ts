import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to calculate percentage correct
export function calculatePercentage(score: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0
  return Math.round((score / totalQuestions) * 100)
}
