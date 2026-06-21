// lib/drive-tree-data.ts

export interface DriveTreeNode {
  id: string
  name: string
  type: 'root' | 'year' | 'term' | 'department' | 'subject'
  children?: DriveTreeNode[]
}

export const DRIVE_ROOT_ID = '1ILuXgf-4R4ra2EszR8GBWIRG9w8yjOAc'

export const DRIVE_TREE: DriveTreeNode = {
  id: DRIVE_ROOT_ID,
  name: 'Magic of the Faculty of Computer and Data Science',
  type: 'root',
  children: [
    {
      id: '1iEMp8rdTVk3-1stml8Z44p-e6C2Jq3yc',
      name: 'YEAR 1',
      type: 'year',
      children: [
        {
          id: '1j1e7CA6g5t0oPcEXJyjQumaR5vpJrMFj',
          name: 'TERM 1 - 1ST Chameleon',
          type: 'term',
          children: [
            { id: '18z7NsY77hk6xNXqpoEtLK0UdLaUenc2z', name: 'Intro into Computer System', type: 'subject' },
            { id: '1iFyXSGZL_nC3egUyi0NFJdRfpCGbqGCI', name: 'Critical Thinking', type: 'subject' },
            { id: '1om4fp08yvuAMGR8yAZiuQJjuGI1oKQB7', name: 'Programming 1', type: 'subject' },
            { id: '1XIeJGYKVExDbih7jopqkfZKOmIBE1dVc', name: 'Math0', type: 'subject' },
            { id: '1ZCX7v9rmMflHaJM_rvLe_8Z7ZDKCp9F5', name: 'Data Science', type: 'subject' },
            { id: '1_e_gAVnVzTy3fyzHcbB08cieVeKuNyN_', name: 'Calculus', type: 'subject' },
            { id: '1c3QoD0pZNtbLUjS4Gay5EJfnjJNUbmTS', name: 'Linear Algebra', type: 'subject' }
          ]
        },
        {
          id: '1Gf_Z8OKoTGfKFk-C_1qlDmBeOB9O0GC1',
          name: 'TERM 2 - 1ST Chameleon',
          type: 'term',
          children: [
            { id: '1PyLUkLv-03ZjXgEqn_T25jOyfE3W6xR6', name: 'Discrete Structure', type: 'subject' },
            { id: '1vHygfChQU9KmJdrUD6T9L_90wfgQhNct', name: 'Probability and Statistics I', type: 'subject' },
            { id: '1VeYq7PGAhiOQK8DbonWOrn5m6xmr8fK0', name: 'Innovation', type: 'subject' },
            { id: '1FLAyzjWNhMdC-9Hjw9TkQjXZ2UPL-Tc2', name: 'Introduction To AI', type: 'subject' },
            { id: '1t8fGesHUl2cx1HdW2fA572tjd7RiBbp8', name: 'Data Structures and Algorithms', type: 'subject' },
            { id: '1iF7zputxg0zi_Y_J3CnraaHD0jW5dWoV', name: 'Programming II', type: 'subject' }
          ]
        }
      ]
    },
    {
      id: '1H2B2qpGQQccYJtdT9q_k1aW7D40K71re',
      name: 'YEAR 2',
      type: 'year',
      children: [
        {
          id: '1fFud6zcMhQwVn0fB5F4HPRioX5gHHekQ',
          name: 'TERM 1 - 2ND Chameleon',
          type: 'term',
          children: [
            { id: '1-WY58dUDVQTsBlBhXNRkvHsk7SRrNyPt', name: 'GENERAL', type: 'department' },
            { id: '19r6XP6Pd6az8_ziZYxt6waHl8CiKu_7s', name: 'CYBER', type: 'department' },
            { id: '11ldH3sCp0kFM-0Xl9oIFNs5tPzWGwrbT', name: 'AI', type: 'department' },
            { id: '1LMm-2cFbfzRR83K7jg18YSr9xdimQ4rv', name: 'BUSINESS', type: 'department' },
            { id: '1oUcPDdT63GjSJQpZ7mejDv-b34o3I8AJ', name: 'MEDIA', type: 'department' }
          ]
        },
        {
          id: '1HhygcPPmj_o1hKsKjzP-eAJ5jNqFuYHz',
          name: 'TERM 2 - 2ND Chameleon',
          type: 'term',
          children: [
            { id: '1FrAIVSMAmL7vLv9jBdJUhpYhtYxNSftq', name: 'GENERAL', type: 'department' },
            { id: '1grj7koi81E3DO8r2sqCDzrdisZWy6qt0', name: 'MEDIA', type: 'department' },
            { id: '1q3Nc8iBtTf-sWxPbhGSV6FoVpK1A02oM', name: 'CYBER', type: 'department' },
            { id: '1q0dL1h1YVZGmZhZSisztQfjAV51pUjja', name: 'AI', type: 'department' }
          ]
        }
      ]
    },
    {
      id: '120Yz3JJXFx0Kq1yPJAVbp9rEovicMZgy',
      name: 'YEAR 3',
      type: 'year',
      children: [
        {
          id: '1zt7CWaZmkUWUnNHz5lyA9Mv04Gugul99',
          name: 'TERM 1 - 3RD Chameleon',
          type: 'term',
          children: [
            { id: '1cVtwXyzETI162psi30Z-8ua4MsNpzpWn', name: 'GENERAL', type: 'department' },
            { id: '1tJOk37-O5ddTOWeAiWn85M1ZFV7mjfDl', name: 'CYBER', type: 'department' },
            { id: '1HMVFaYKUlVJD62RadiT8auWA2UpFy6W8', name: 'AI', type: 'department' },
            { id: '1FDZUrBjiUhq6_l7yWTLSV8jnoDHM2YD2', name: 'BUSINESS', type: 'department' },
            { id: '1OWaxXeDQV5yn3lMC8gJj7OHybIUxRabm', name: 'MEDIA', type: 'department' }
          ]
        },
        {
          id: '1dmixW8TdQcAL6USW6yfP_k2pBqjBRdTo',
          name: 'TERM 2 - 3RD Chameleon',
          type: 'term',
          children: [
            { id: '1KT9v35YBfm2vQBfOq3LP-bxLz3o757Ps', name: 'GENERAL', type: 'department' },
            { id: '1JBpk0-mmNOzw-jZ4D6laE0Uqze4mJ80-', name: 'CYBER', type: 'department' },
            { id: '1hPx-F9_FlWdFgjpsBDSmXrZYqjVWSsYa', name: 'AI', type: 'department' },
            { id: '1XPfn2wJdp7oCW1wDz72YCIu5g2yzz1X2', name: 'BUSINESS', type: 'department' },
            { id: '1jxOdsWat-Dgde-Y673vcIDwXmfsAHZAC', name: 'MEDIA', type: 'department' }
          ]
        }
      ]
    },
    {
      id: '1Yuz06FUQ10jI5eXbiuYVEVTepA_ynINg',
      name: 'YEAR 4',
      type: 'year',
      children: [
        {
          id: '1Ht365kMJ0rz_yyHQZeJ7t3lXvnPB5gyB',
          name: 'TERM 1 - 4TH Chameleon',
          type: 'term',
          children: [
            { id: '1rh1mRAuJ0tK0_Rc0dlmycxKry1CkkSGL', name: 'GENERAL', type: 'department' },
            { id: '1SAOXqMJncEFZpadggJ_QFTnh5XCDNxCS', name: 'CYBER', type: 'department' },
            { id: '1GE8zvZyQO0s0oWjti_gBW6musCWku9IK', name: 'AI', type: 'department' },
            { id: '1Duf2e9wld9zXDvhZJ46jq-FfkN4cqntv', name: 'BUSINESS', type: 'department' },
            { id: '1JbTgJIlhG3W_MYLrZuXooPvXbnFGSRs6', name: 'MEDIA', type: 'department' }
          ]
        },
        {
          id: '15zbeRxzCeb2MkRjY0mw5FVI8Vw4-onLG',
          name: 'TERM 2 - 4TH Chameleon',
          type: 'term',
          children: [
            { id: '1xyCPhgjbbMz2WD-XoJCmYBsBW09L8iH7', name: 'GENERAL', type: 'department' },
            { id: '118jjq7pMMJDMV34oW5-mMP-PggI80bOp', name: 'CYBER', type: 'department' },
            { id: '1n2bruTs4yAPwavTgLoyJxjibWfTg_sgD', name: 'AI', type: 'department' },
            { id: '1gGeNt-Mj8JidMTDGztOWe2lQg7yoQrgC', name: 'BUSINESS', type: 'department' },
            { id: '12y6-nP-0f2-CUKsw_oscBprnIoZgpnIb', name: 'MEDIA', type: 'department' }
          ]
        }
      ]
    }
  ]
}

/**
 * Map Supabase user specialization values to tree department names.
 */
export function mapSpecializationToDeptCode(specialization: string | null): string {
  if (!specialization) return 'GENERAL'
  const spec = specialization.toLowerCase()
  if (spec.includes('data science') || spec.includes('computing')) return 'GENERAL'
  if (spec.includes('cyber')) return 'CYBER'
  if (spec.includes('intelligent') || spec.includes('ai') || spec.includes('artificial')) return 'AI'
  if (spec.includes('business')) return 'BUSINESS'
  if (spec.includes('media')) return 'MEDIA'
  return 'GENERAL'
}

/**
 * Traverses the tree to find all sub-folders of a node.
 */
export function getAllChildFolderIds(node: DriveTreeNode): string[] {
  const ids = [node.id]
  if (node.children) {
    for (const child of node.children) {
      ids.push(...getAllChildFolderIds(child))
    }
  }
  return ids
}

/**
 * Retrieves the folders suggested for a specific level and specialization.
 */
export function getSuggestedFolderIds(level: number | null, specialization: string | null): string[] {
  const folderIds: string[] = []
  
  if (!level) return []

  const yearNode = DRIVE_TREE.children?.find(
    child => child.name === `YEAR ${level}`
  )

  if (!yearNode) return []

  // Suggested folders include the Year parent folder
  folderIds.push(yearNode.id)

  if (level === 1) {
    // Level 1 gets Year 1 folders and Term folders, and all subjects
    if (yearNode.children) {
      for (const term of yearNode.children) {
        folderIds.push(term.id)
        if (term.children) {
          for (const sub of term.children) {
            folderIds.push(sub.id)
          }
        }
      }
    }
  } else {
    // Level 2, 3, 4 gets the specific department folders and their term folders
    const deptCode = mapSpecializationToDeptCode(specialization)
    if (yearNode.children) {
      for (const term of yearNode.children) {
        folderIds.push(term.id)
        
        // Find matching department folder
        const deptFolder = term.children?.find(
          c => c.name.toUpperCase() === deptCode.toUpperCase()
        )
        if (deptFolder) {
          folderIds.push(deptFolder.id)
        }
      }
    }
  }

  return folderIds
}

/**
 * Find folder name by ID in the tree
 */
export function findFolderNameById(node: DriveTreeNode, id: string): string | null {
  if (node.id === id) return node.name
  if (node.children) {
    for (const child of node.children) {
      const name = findFolderNameById(child, id)
      if (name) return name
    }
  }
  return null
}
