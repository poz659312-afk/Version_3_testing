/**
 * Lightweight accessor functions for department-data.
 * These functions allow client components to fetch ONLY the data they need,
 * instead of importing the entire 439KB departmentData object.
 * 
 * For server components: import departmentData directly (it stays on the server).
 * For client components: use these accessor functions + dynamic import.
 */

import type { Department, Subject } from './department-data'

// Lazily cache the module so we only import once per process
let _cache: typeof import('./department-data') | null = null

async function getDepartmentModule() {
  if (!_cache) {
    _cache = await import('./department-data')
  }
  return _cache
}

/** Get a single department by slug */
export async function getDepartment(slug: string): Promise<Department | null> {
  const mod = await getDepartmentModule()
  return mod.departmentData[slug] ?? null
}

/** Get all department slugs */
export async function getDepartmentSlugs(): Promise<string[]> {
  const mod = await getDepartmentModule()
  return Object.keys(mod.departmentData)
}

/** Find a quiz by department + subject + quizId */
export async function findQuiz(departmentSlug: string, subjectId: string, quizId: string) {
  try {
    const { createBrowserClient } = await import('@/lib/supabase/client')
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('quiz_department')
      .select('*')
      .eq('department_slug', departmentSlug)
      .eq('subject_id', subjectId)
      .eq('code', quizId)
      .single()

    if (!error && data) {
      const mod = await getDepartmentModule()
      const deptName = mod.departmentData[departmentSlug]?.name || departmentSlug
      
      let subjectName = subjectId
      const dept = mod.departmentData[departmentSlug]
      if (dept) {
        for (const level of Object.values(dept.levels)) {
          const subj = [...level.subjects.term1, ...level.subjects.term2].find(s => s.id === subjectId)
          if (subj) {
            subjectName = subj.name
            break
          }
        }
      }

      return {
        quiz: {
          id: data.code,
          name: data.name,
          code: data.code,
          duration: data.duration === 'OP' ? 'OP' : Number(data.duration),
          questions: data.questions, // Load the raw JSON questions directly
          subjectName,
          departmentName: deptName,
        },
        levelKey: String(data.level_num),
      }
    }
  } catch (dbErr) {
    console.error('Failed to load quiz from database, falling back to static data:', dbErr)
  }

  const mod = await getDepartmentModule()
  const dept = mod.departmentData[departmentSlug]
  if (!dept) return null

  for (const [levelKey, level] of Object.entries(dept.levels)) {
    const allSubjects = [...level.subjects.term1, ...level.subjects.term2]
    const subject = allSubjects.find(s => s.id === subjectId)

    if (subject?.materials?.quizzes) {
      const quiz = subject.materials.quizzes.find((q: any) => q.id === quizId)
      if (quiz) {
        return {
          quiz: {
            ...quiz,
            subjectName: subject.name,
            departmentName: dept.name,
          },
          levelKey,
        }
      }
    }
  }

  return null
}

/** Build search index (for magic search) — returns only the minimal fields needed */
export async function buildSearchIndex() {
  const mod = await getDepartmentModule()
  const results: {
    id: string
    title: string
    description: string
    category: string
    link: string
    code?: string
    creditHours?: number
    specialization?: string
  }[] = []

  Object.entries(mod.departmentData).forEach(([deptId, department]) => {
    Object.entries(department.levels).forEach(([levelNum, level]) => {
      const processSubjects = (subjects: Subject[]) => {
        subjects?.forEach((subject) => {
          results.push({
            id: subject.id,
            title: subject.name,
            description: subject.description,
            category: department.name,
            link: `/specialization/${deptId}/${levelNum}/${subject.id}`,
            code: subject.code,
            creditHours: subject.creditHours,
            specialization: deptId,
          })
        })
      }
      processSubjects(level.subjects.term1)
      processSubjects(level.subjects.term2)
    })
  })

  return results
}

/** Resolve department key from various aliases */
export async function resolveDepartmentKey(input: string): Promise<string | null> {
  const mod = await getDepartmentModule()
  return mod.departmentKeyMap[input.toLowerCase()] ?? null
}
