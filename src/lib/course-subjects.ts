export interface TrackDefinition {
  id: string
  code: 'DS' | 'AI' | 'HA' | 'CS' | 'BA' | 'MA'
  name: string
  subjects: string[]
}

export const ACADEMIC_TRACKS: TrackDefinition[] = [
  {
    id: 'DS',
    code: 'DS',
    name: 'Data Science (DS)',
    subjects: [
      'Linear Algebra',
      'Calculus',
      'Programming 1 (C++)',
      'Programming 2 (OOP)',
      'Data Structures & Algorithms',
      'Discrete Mathematics',
      'Probability & Statistics 1',
      'Probability & Statistics 2',
      'Database Systems',
      'Advanced Databases (NoSQL)',
      'Data Mining & Warehousing',
      'Big Data Analytics',
      'Data Visualization',
      'Operating Systems',
      'Computer Networks',
      'Machine Learning Foundations',
      'Deep Learning',
      'Software Engineering'
    ]
  },
  {
    id: 'AI',
    code: 'AI',
    name: 'Artificial Intelligence (AI)',
    subjects: [
      'Introduction to AI',
      'Machine Learning',
      'Deep Learning & Neural Networks',
      'Computer Vision',
      'Natural Language Processing (NLP)',
      'Reinforcement Learning',
      'Knowledge Representation & Reasoning',
      'Pattern Recognition',
      'Expert Systems',
      'Robotics & Autonomous Systems',
      'AI Ethics & Governance',
      'Data Structures & Algorithms',
      'Linear Algebra & Optimization',
      'Probability & Random Processes'
    ]
  },
  {
    id: 'HA',
    code: 'HA',
    name: 'Healthcare Analytics (HA)',
    subjects: [
      'Introduction to Health Informatics',
      'Medical Terminology & Coding',
      'Healthcare Data Systems (EHR/EMR)',
      'Biostatistics & Epidemiology',
      'Clinical Decision Support Systems',
      'Health Data Analytics',
      'Bioinformatics Foundations',
      'Medical Imaging & Diagnostics',
      'Health Information Privacy & Security',
      'Genomics & Precision Medicine Analytics',
      'Public Health Data Science',
      'Database Systems in Healthcare'
    ]
  },
  {
    id: 'CS',
    code: 'CS',
    name: 'Cybersecurity (CS)',
    subjects: [
      'Information Security Fundamentals',
      'Cryptography & Network Security',
      'Ethical Hacking & Penetration Testing',
      'Digital Forensics & Incident Response',
      'Secure Software Development',
      'Malware Analysis & Reverse Engineering',
      'Cloud Security & Virtualization',
      'Operating Systems & System Hardening',
      'Computer Networks & Protocols',
      'Security Operations Center (SOC) Analytics',
      'Cyber Threat Intelligence',
      'Web Application Security'
    ]
  },
  {
    id: 'BA',
    code: 'BA',
    name: 'Business Analytics (BA)',
    subjects: [
      'Business Analytics Fundamentals',
      'Managerial Economics & Decision Making',
      'Marketing Analytics',
      'Financial Analytics & Modeling',
      'Supply Chain & Operations Analytics',
      'Predictive Analytics for Business',
      'Business Intelligence & Dashboards',
      'Accounting for Data Science',
      'Customer Relationship Analytics (CRM)',
      'Strategic Management Analytics',
      'Database Management for Business',
      'Risk Analytics & Management'
    ]
  },
  {
    id: 'MA',
    code: 'MA',
    name: 'Media Analytics (MA)',
    subjects: [
      'Digital Media Analytics',
      'Social Media Mining & Network Analysis',
      'Audience Research & Metrics',
      'Content Analytics & Sentiment Analysis',
      'Digital Marketing & Ad Analytics',
      'Visual Analytics for Media',
      'Multimedia Information Retrieval',
      'Broadcast & Streaming Media Analytics',
      'Media Ethics & Data Law',
      'Web Analytics & SEO Optimization',
      'Storytelling with Data',
      'User Experience (UX) Analytics'
    ]
  }
]

export const ALL_SUBJECTS_LIST = Array.from(
  new Set(ACADEMIC_TRACKS.flatMap(t => t.subjects))
).sort()
