/**
 * Maps subject IDs across all departments to their canonical and quiz_department subject_ids.
 * Ensures college compulsory (shared) courses and department courses like Machine Learning
 * (shared across Data Science, AI, Cyber, etc.) display all available quizzes.
 */

export const SHARED_QUIZ_CLUSTERS: Record<string, string[]> = {
  'machine-learning': [
    'machine-learning',
    'machine-learning-is',
    'machine-learning-cs',
    'machine-learning-ba',
    'machine-learning-ma',
    'machine-learning-hi'
  ],
  'cloud-computing': [
    'cloud-computing',
    'cloud-computing-is',
    'cloud-computing-cs',
    'cloud-computing-ba',
    'cloud-computing-ma',
    'cloud-computing-hi'
  ],
  'data-mining': [
    'data-mining',
    'data-mining-analytics',
    'data-mining-analytics-is',
    'data-mining-analytics-cs',
    'data-mining-analytics-ba',
    'data-mining-analytics-ma',
    'data-mining-analytics-hi'
  ],
  'data-structures': [
    'data-structures',
    'data-structures-algorithms',
    'data-structures-algorithms-is',
    'data-structures-algorithms-cs',
    'data-structures-algorithms-ba',
    'data-structures-algorithms-ma',
    'data-structures-algorithms-hi'
  ],
  'discrete-mathematics': [
    'discrete-mathematics',
    'discrete-structures',
    'discrete-structures-is',
    'discrete-structures-cs',
    'discrete-structures-ba',
    'discrete-structures-ma',
    'discrete-structures-hi'
  ],
  'programming-1': [
    'programming-1',
    'programming-1-is',
    'programming-1-cs',
    'programming-1-ba',
    'programming-1-ma',
    'programming-1-hi'
  ],
  'programming-2': [
    'programming-2',
    'programming-2-is',
    'programming-2-cs',
    'programming-2-ba',
    'programming-2-ma',
    'programming-2-hi'
  ],
  'intro-computer-systems': [
    'intro-computer-systems',
    'intro-computer-systems-is',
    'intro-computer-systems-cs',
    'intro-computer-systems-ba',
    'intro-computer-systems-ma',
    'intro-computer-systems-hi'
  ],
  'intro-data-sciences': [
    'intro-data-sciences',
    'intro-data-sciences-is',
    'intro-data-sciences-cs',
    'intro-data-sciences-ba',
    'intro-data-sciences-ma',
    'intro-data-sciences-hi'
  ],
  'computer-networks': [
    'computer-networks',
    'Computer-Networks',
    'computer-networks-cs'
  ],
  'advanced-databases': [
    'advanced-databases',
    'advanced-database-systems'
  ],
  'cism': [
    'cism',
    'computing-intensive-statistical-methods'
  ],
  'economics': [
    'economics',
    'Economic-science',
    'economic-sciences',
    'health-policy-economics'
  ],
  'first-aids': [
    'first-aids',
    'First-Aids',
    'first-aid'
  ],
  'data-science-tools-software': [
    'data-science-tools-software'
  ],
  'design-analysis-experiments': [
    'design-analysis-experiments'
  ],
  'Web-Programming': [
    'Web-Programming',
    'web-programming'
  ],
  'System-Analysis-Design': [
    'System-Analysis-Design',
    'system-analysis-design',
    'systems-analysis-design'
  ],
  'survey-methodology': [
    'survey-methodology'
  ],
  'data-visualization': [
    'data-visualization',
    'data-visualization-tools',
    'data-visualization-ba',
    'infographics-data-visualization'
  ]
}

// Pre-built reverse map from any subject_id to all candidate subject_ids in the cluster
const ID_TO_CLUSTER = new Map<string, string[]>()
for (const [canonical, aliases] of Object.entries(SHARED_QUIZ_CLUSTERS)) {
  const allInGroup = Array.from(new Set([canonical, ...aliases]))
  for (const id of allInGroup) {
    ID_TO_CLUSTER.set(id.toLowerCase(), allInGroup)
  }
}

const KNOWN_DEPARTMENT_SUFFIXES = ['', '-is', '-cs', '-ba', '-ma', '-hi']

/**
 * Returns all candidate subject_ids to query in quiz_department.
 * Fully dynamic: handles any brand new subject created for the first time
 * by generating all department suffix permutations (-is, -cs, -ba, -ma, -hi)
 * as well as matching against known clusters and name slugs.
 */
export function getQuizSubjectCandidates(subjectId: string, subjectName?: string): string[] {
  if (!subjectId) return []

  const candidates = new Set<string>()
  candidates.add(subjectId)

  // 1. Direct cluster lookup if in known historical clusters
  const cluster = ID_TO_CLUSTER.get(subjectId.toLowerCase())
  if (cluster) {
    cluster.forEach(c => candidates.add(c))
  }

  // 2. Strip department suffix (-is, -cs, -ba, -ma, -hi) to get base subject ID
  const baseId = subjectId.replace(/-(ba|is|cs|ma|hi)$/i, '')
  if (baseId) {
    // Generate all department permutations automatically for this baseId
    for (const suffix of KNOWN_DEPARTMENT_SUFFIXES) {
      candidates.add(`${baseId}${suffix}`)
    }

    const baseCluster = ID_TO_CLUSTER.get(baseId.toLowerCase())
    if (baseCluster) {
      baseCluster.forEach(c => candidates.add(c))
    }
  }

  // 3. Dynamic slug generation from subjectName (e.g. "Deep Learning" -> "deep-learning")
  if (subjectName) {
    const slugName = subjectName
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (slugName) {
      for (const suffix of KNOWN_DEPARTMENT_SUFFIXES) {
        candidates.add(`${slugName}${suffix}`)
      }
    }

    // Historical cluster matching by normalized name
    const cleanName = subjectName.toLowerCase().replace(/[^a-z0-9]/g, '')
    for (const [canonical, aliases] of Object.entries(SHARED_QUIZ_CLUSTERS)) {
      const normCanonical = canonical.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (cleanName === normCanonical || cleanName.includes(normCanonical) || normCanonical.includes(cleanName)) {
        candidates.add(canonical)
        aliases.forEach(a => candidates.add(a))
      }
    }
  }

  return Array.from(candidates)
}
