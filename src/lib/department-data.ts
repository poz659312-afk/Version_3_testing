export interface Subject {
  id: string
  name: string
  description: string
  creditHours: number
  code: string
  prerequisites?: string[]
  materials: {
    lectures?: string | string[]
    sections?: string
    videos?: string | string[]
    summaries?: string
    quizzes?: {
      id: string
      name: string
      code: string
      duration: string | number
      questions: number
      jsonFile: string
    }[]
    exams?: string
  }
}

export interface Level {
  subjects: {
    term1: Subject[]
    term2: Subject[]
  }
}

export interface Department {
  name: string
  description: string
  levels: {
    [key: number]: Level
  }
  facultyElectives?: Subject[]
  programElectives?: Subject[]
}

export * from './electives-data'

export const departmentKeyMap: { [key: string]: string } = {
  'computing and data sciences': 'computing-data-sciences',
  'data science': 'computing-data-sciences',
  'computing & data sciences': 'computing-data-sciences',
  'fcds': 'computing-data-sciences',
  'computing': 'computing-data-sciences',
  
  'business-analytics': 'business-analytics',
  'business analytics': 'business-analytics',
  'ba': 'business-analytics',
  
  'artificial-intelligence': 'artificial-intelligence',
  'artificial intelligence': 'artificial-intelligence',
  'intelligent systems': 'artificial-intelligence',
  'ai': 'artificial-intelligence',
  
  'media-analytics': 'media-analytics',
  'media analytics': 'media-analytics',
  'ma': 'media-analytics',
  
  // Healthcare Informatics
  'healthcare-informatics': 'healthcare-informatics',
  'healthcare informatics': 'healthcare-informatics',
  'hi': 'healthcare-informatics',
  
  // Cybersecurity
  'cybersecurity': 'cybersecurity',
  'cyber security': 'cybersecurity',
  'cs': 'cybersecurity'
}

export const departmentData: { [key: string]: Department } = {
  "computing-data-sciences": {
    name: "Computing and Data Sciences",
    description: "Advanced computing and data science methodologies for modern analytics",
    levels: {
      1: {
        subjects: {
          term1: [
            {
              id: "linear-algebra",
              name: "Linear Algebra",
              code: "02-24-00101",
              description: "Mathematical foundations of linear algebra for data science applications",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yFYYS37ERUHG6Ft_HnC17Jmgo-Zsrg06?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/191trjdbwAtjG6yz65q-C1Hd3gigqoti7?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLvuToPs04FnD1lFBolGr4ROQaxQ_zyC1c&si=6IWNZY0eY_ymFdAq"],
                summaries: "https://drive.google.com/drive/folders/150zP5Dc9vDKzazlm37IRttDG-_b-opK1?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1vUbUjWsbexiPgjDbJOuh-N43PVDc9hjc?usp=drive_link"
              }
            },
            {
              id: "calculus",
              name: "Calculus",
              code: "02-24-00102",
              description: "Differential and integral calculus with applications in computing",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1LsWVrCXpwVsL7YhGL_QFQhyryvpc_Yon?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1U2LbrtWkf-X8DL3c7Yo12kgV8bbZ0Wb6?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1UkJQ6mJmcSb_MTbzT_8liJZTUMCOLARt?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1Uf7LaRzQyqxEbTVG0dfmWFzTxmZNHLvB?usp=drive_link"
              }
            },
            {
              id: "intro-computer-systems",
              name: "Introduction to Computer Systems",
              code: "02-24-00103",
              description: "Fundamentals of computer architecture and system organization",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yQK4QiXQ7e7Ui6DLMAGYQa3aTuQp0v9O?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1q0iRgXguAaa2zZTSA9J1smnCwN2PwCAn?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLskaQRgiRMYb0SqvJ-wKx2n4Q3CB5uQ8e&si=wXANl6gRLW404zuP"],
                summaries: "https://drive.google.com/drive/folders/1RFPXNiitr2yiHr1AyCsZWuTX0rYyOwIL?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1hTVXduWW2Icy8HY-uOc5lEiUUM42RSkB?usp=drive_link"
              }
            },
            {
              id: "intro-data-sciences",
              name: "Introduction to Data Sciences",
              code: "02-24-00104",
              description: "Overview of data science concepts, tools, and methodologies",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/10SsZONPzWccvjTQB4ZcHmT0j_FU8b981?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/14IwWgXRgD8G2IPJ2op1RdBIj9pgs77LJ?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLNVsyemi1cQyXLWT3vm4GbWzVxAK_4nbR&si=Q7kxeMYT4iXhr2uC"],
                summaries: "https://drive.google.com/drive/folders/13IFz-O_64Ga8y9TyFe13CSovw0xzxdUQ?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1adpsd15n6hieC29aQECkrftCHNz20U9c?usp=drive_link"
              }
            },
            {
              id: "programming-1",
              name: "Programming I",
              code: "02-24-00105",
              description: "Introduction to programming concepts and problem-solving techniques",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1VDUvvvKoRcBfdCAgdO5GUa8ourGzEj43?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/14-W3wcsn8gw2ym8CnIo_L6jh0RfQW-mR?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLCInYL3l2AajYlZGzU_LVrHdoouf8W6ZN&si=_3EUjHYYQd7xAuGr","https://youtube.com/playlist?list=PL1DUmTEdeA6K7rdxKiWJq6JIxTvHalY8f&si=wl8ryBAWTyTatxTw"],
                summaries: "https://drive.google.com/drive/folders/19GRYDzueyRIB45_CJGn9Qh3_3JkIgfQH?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1wT8Ad9IGifK4NMgE71xXzLhXs4FF0wuc?usp=drive_link"
              }
            },
            {
              id: "critical-thinking",
              name: "Critical Thinking",
              code: "02-00-000XX",
              description: "Development of analytical and critical thinking skills",
              creditHours: 2,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1mGHqF_BIXdX-S6BipXm942CsOvr6WHTG?usp=drive_link",
                sections: "",
                videos: ["https://youtube.com/playlist?list=PL2y4AZEEnQLmigukmMl5lD0CkewT1pBQ3&si=GijvUZQgn4vO1gdR"],
                summaries: "https://drive.google.com/drive/folders/1He5H59nOzExcoG5GYaujPWQVnKTZwD2Z?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1ZfnkRMneHYU5wYlq4738XZt1NvGlRbt6?usp=drive_link"
              }
            },
            {
              id: "math-0",
              name: "Math 0",
              code: "02-00-000XX",
              description: "A special material for science students in high school",
              creditHours: 0,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1YrNrKQC_tGwSoNuESo8xx31dpJNL7Kat?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1bGm1W2on979HuF1b618GI4S7UJ8ngkFK?usp=drive_link",
                videos: [""],
                summaries: "https://drive.google.com/drive/folders/1mQ6p7lVfmr_fKKYOYP9aBWwVeGEVGa4N?usp=drive_link",
                exams: ""
              }
            }
          ],
          term2: [
            {
              id: "probability-statistics-1",
              name: "Probability and Statistics I",
              code: "02-24-00106",
              description: "Fundamental concepts of probability theory and statistical analysis",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/14WxYDv-3V5hBNF2FTrLEKkZpPQJjwyUb?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1yy9aqzmJsEDZasn2VT1nfzIdJoajEf6F?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PL7snZ0LSsq3g9NUio7xFDtC9IVIj649GV","https://youtube.com/playlist?list=PLXCWPoTuIpYbXgbNuQkBHlMwjK6DpnQ3l"],
                summaries: "https://drive.google.com/drive/folders/1CmL8lOIlbHdYCAhNa5cJSbDSTGEJVdMt?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1reVZYtR8aOBqpHY8PSn2vmwVwNCS_nQC?usp=drive_link"
              }
            },
            {
              id: "discrete-structures",
              name: "Discrete Structures",
              code: "02-24-00107",
              description: "Mathematical structures and logic for computer science",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/12dEJoHHZhCBjBG1KiV2T92HLsGRtDIn8?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1KnWe1Ciq3ETioGCIApu89Sc3Y1FvEgIO?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PLxIvc-MGOs6gZlMVYOOEtUHJmfUquCjwz",
                summaries: "https://drive.google.com/drive/folders/1sqiDSQMkoYZCehzIgdyxZcNRSYpIkLnX?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1SgzQqrBfbam-yqOw8xOdq9SKXPlScR2k?usp=drive_link"
              }
            },
            {
              id: "data-structures-algorithms",
              name: "Data Structures and Algorithms",
              code: "02-24-00108",
              description: "Fundamental data structures and algorithmic problem-solving",
              creditHours: 3,
              prerequisites: ["programming-1"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1U2vmhFrPOs46SZk-rNdzE4yrCIPL5Qow?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1nr2Og9PqyiRYGl7jFJOtgZx1LGZfeHvY?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PLCInYL3l2AajqOUW_2SwjWeMwf4vL4RSp",
                summaries: "https://drive.google.com/drive/folders/1Oiki77OjApABjz0z7D3j2g-Kxc7-hN59?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1IADSkBhDhvgjpDJecfTf9VlvdoJ9P2hD?usp=drive_link"
              }
            },
            {
              id: "intro-artificial-intelligence",
              name: "Introduction to Artificial Intelligence",
              code: "02-24-00109",
              description: "Basic concepts and applications of artificial intelligence",
              creditHours: 3,
              prerequisites: ["intro-computer-systems"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1tp-If4eJhcAY4dIzgSieKIj3YVdSF-8m?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1HYXjZlFJL8FfAKoyhDbshpwwLVBN700R?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1RaS9fI4MaHKg_Bxs_GgyYE_LVuaG3kaJ?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1jjGy4TJ8EbON_k0hf2exQNQtQx2KR4wr?usp=drive_link"
              }
            },
            {
              id: "programming-2",
              name: "Programming II",
              code: "02-24-00110",
              description: "Advanced programming concepts and software development",
              creditHours: 3,
              prerequisites: ["programming-1"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yiF9hcqLqa-wyKfEzdiWDF0bR4A_VtK2?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1geGGbmFKJYIN1yvyIskEeRyI0Y8zWhpU?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLCInYL3l2AagY7fFlhCrjpLiIFybW3yQv","https://youtube.com/playlist?list=PL1DUmTEdeA6Icttz-O9C3RPRF8R8Px5vk"],
                summaries: "https://drive.google.com/drive/folders/1VGGZWwQmZdVD8LWI6piI_RzQqdwKq_st?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1dxwniB91RAEtAu0hKLt5cWqb3t1Q0FLI?usp=drive_link"
              }
            },
            {
              id: "innovation-entrepreneurship",
              name: "Innovation & Entrepreneurship",
              code: "02-00-000XX",
              description: "Principles of innovation and entrepreneurial thinking",
              creditHours: 2,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1aEPdYTJoeTy0QhS3j1YE3GnJsjIs_8ij?usp=drive_link",
                sections: "",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1n1AWZVhnH-Hr_8xmF8PiHdzTHYLGIsRa?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1MxzGEcFlQuweR0XHi7zuBMDuIfn00tcZ?usp=drive_link"
              }
            }
          ]
        }
      },
      2: {
        subjects: {
          term1: [
            {
              id: "probability-statistics-2",
              name: "Probability and Statistics II",
              code: "02-24-00201",
              description: "Advanced statistical methods and probability distributions",
              creditHours: 3,
              prerequisites: ["probability-statistics-1"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Cat1L5ibgjDAx3qcU8XpKuM2Sp0jIWdA?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/17m-plzdlLyhkjM_TFmcYw5AZyC61yNrx?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PL7snZ0LSsq3g6KzD6pdqwU3_Do8WPY4M8&si=1ZMtkTPNNIX7q31M","https://youtube.com/playlist?list=PLtK59GunEou_TMg812_orrEE3H8UbUSta&si=zISZN1TFNbmCSoXn"],
                summaries: "https://drive.google.com/drive/folders/1z2c94GAfxG4TdX63ZY_rZSicvEZlrRHS?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1QRMaP_UgieJRGo5ebwvD_bIu9EMF0SYs?usp=drive_link"
              }
            },
            {
              id: "intro-databases",
              name: "Introduction to Databases",
              code: "02-24-00202",
              description: "Database design, implementation, and management principles",
              creditHours: 3,
              prerequisites: ["programming-1"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/10DIqel1WkLIg5YZ1qbT604vRdpVPyLZ6?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1a78X1gWfKKui7qrsGkHvwycayAssG8Le?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PL37D52B7714788190&si=9Qkf5KQWLTXqYKt1",
                summaries: "https://drive.google.com/drive/folders/1vMRqmZ7ID3YIT920N6loq_yJKOQSOG65?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1luaj1L4qB2T3hTcQvwra667abVRXOx9c?usp=drive_link"
              }
            },
            {
              id: "numerical-computations",
              name: "Numerical Computations",
              code: "02-24-00203",
              description: "Numerical methods and computational techniques",
              creditHours: 3,
              prerequisites: ["linear-algebra"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1YerbhXBHp9cLVhuBlsp337xKVS_01139?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1K4WIBD41wo7MP_GwXpo6yfEg-93c2wVM?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1WbNyHrPMQg8aBKK3pEUvBplv7gxzsxHS?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/14RRGt31M6KSQAxypsDQ2sMI_DR939Wy5?usp=drive_link"
              }
            },
            {
              id: "advanced-calculus",
              name: "Advanced Calculus",
              code: "02-24-01201",
              description: "Multivariable calculus and advanced mathematical analysis",
              creditHours: 3,
              prerequisites: ["calculus"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1kMuGgdNfirnO_HP6CYKL02-LRJXjpgfh?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/19elXC7fQOQASSTk2cG9pa2GVU1i4gFW3?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1iGMlitjUbTAe-PAr1Gm7ftOqMQjbmjvV?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1NlpAB2MaIloRaoBeiNG2qiZagRn8EYPU?usp=drive_link"
              }
            },
            {
              id: "data-science-methodology",
              name: "Data Science Methodology",
              code: "02-24-01202",
              description: "Systematic approaches to data science projects and research",
              creditHours: 3,
              prerequisites: ["intro-data-sciences"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1euOjkcK23yHHMKwvx6zOJiPgrj7-m09k?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1C14zdESIjWhVfxFXP5eDsGY5D290Mu6Z?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1G_XU_TmlwWBKyhFUOj0L055GBsTfniJT?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1_PCpSjwGN8wHeO_uB0bthGi6iDcI5AsI?usp=drive_link"
              }
            }
          ],
          term2: [
            {
              id: "cloud-computing",
              name: "Cloud Computing",
              code: "02-24-00204",
              description: "Cloud platforms, services, and distributed computing concepts",
              creditHours: 3,
              prerequisites: ["data-structures-algorithms"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1P37WAFRKgkokNwr6R5MZNOFEpff5dUIB?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1ny-TP92zjTZrctHIBx_QmsTfl52bSP1Q?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/11QHqhN6G_OmTNZTPdR_OVWzUZ5fEMO8X?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1ICXoWQy7-nas1_KaLNCA_fHKXEVvRqw2?usp=drive_link"
              }
            },
            {
              id: "machine-learning",
              name: "Machine Learning",
              code: "02-24-00205",
              description: "Supervised and unsupervised learning algorithms and applications",
              creditHours: 3,
              prerequisites: ["intro-artificial-intelligence"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1CCeA8VUvw__jCBmZ-5Y1J3ujOyir4HSr?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1hO_vvmFpCD9zw4rlK77HIIeNVWpjgM2K?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1XdboKP5n65WZCznnqiCrE0BZfiarSl4Z?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1WI08MEt_kVSuMITdlqqgPaVpTUPwiqgK?usp=drive_link"
              }
            },
            {
              id: "data-mining-analytics",
              name: "Data Mining and Analytics",
              code: "02-24-00206",
              description: "Techniques for extracting knowledge from large datasets",
              creditHours: 3,
              prerequisites: ["probability-statistics-2"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Ex-VAzuroLcg0fmSmg-Zd-x6KXCY7P1H?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1yRLzmfdAksXPomOZCRLQLG48sWnkQIDc?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1HRedV6Iu8Djd_f0AE0MigL8nKoq8Yb8-?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1mrKwfr3Mgi9p3zp7VdIVLmsUiPYhJYCX?usp=drive_link"
              }
            },
            {
              id: "data-science-tools-software",
              name: "Data Science Tools and Software",
              code: "02-24-01203",
              description: "Practical tools and software for data science workflows",
              creditHours: 3,
              prerequisites: ["programming-1","probability-statistics-2","data-science-methodology"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1CScYtfu-JWA5llL4EQAu46pZgL1lQNui?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1_kQzyyVVwFmFhbyewAgs3PZgfw7SZoVt?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1-E0rOdeA_1463gM9sg93srLn-apu3_fV?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1XJqxJZOjQCzXnEpeyQQQRRc8HOvEwyJ6?usp=drive_link"
              }
            },
            {
              id: "regression-analysis",
              name: "Regression Analysis",
              code: "02-24-01204",
              description: "Linear and nonlinear regression modeling techniques",
              creditHours: 3,
              prerequisites: ["probability-statistics-2"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Pr__JjKf-CRVGV7BeV1tkrQZfen4YRJO?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1aTANc8wnepGacHG4YjoXxXbEoZu5TBT3?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1sRjognRSht3yw_Qxf-O9NLM9YNsJ5UPJ?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1TkHizwhqFL2uaHUU5Wy06SvdxlY8yCis?usp=drive_link"
              }
            }
          ]
        }
      },
      3: {
        subjects: {
          term1: [
            {
              id: "stochastic-processes",
              name: "Stochastic Processes",
              code: "02-24-01301",
              description: "Random processes and their applications in data science",
              creditHours: 3,
              prerequisites: ["linear-algebra","probability-statistics-2"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1PKWYRXoXWqGpom2A64o1xZvKJZtEuPD1?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1OK_hd7pcqWv_8pm9dXTR4xYx9axAtDcD?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PLAtIITWfkz9AquTyThwz7mkg6dGqIXKI3&si=MvjBbLZEfmuJ3BKu",
                summaries: "https://drive.google.com/drive/folders/1ffKJxpEG86cFWOtlDa42CcQSECLlCVeg?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1k6L4jQgzqFxLMFdcPvm3kJp6m8B2bzUc?usp=drive_link"
              }
            },
            {
              id: "design-analysis-experiments",
              name: "Design and Analysis of Experiments",
              code: "02-24-01302",
              description: "Experimental design principles and statistical analysis",
              creditHours: 3,
              prerequisites: ["probability-statistics-2"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Dbp5JfaMcYG9DoJxOlgwL7eTw3n5v2_H?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1vKXnF7anmsn_vUMUCmL8geYGVFwWpz9R?usp=drive_link",
                videos: [""],
                summaries: "https://drive.google.com/drive/folders/1q6Wct_XlOa-vcL5oZQmOh-M4DShs79pm?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1yalskt-sOK3_0envMxfdiVtTXD7OfV-k?usp=drive_link"
              }
            },
            {
              id: "data-visualization-tools",
              name: "Data Visualization Tools",
              code: "02-24-01303",
              description: "Tools and techniques for effective data visualization",
              creditHours: 3,
              prerequisites: ["data-science-methodology","data-science-tools-software"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1cPdkERtei3lc_XCT_5flekoJuYPWZ29Q?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1akup2XLHU9HNVhNrRoVPXGjoJGS_b7xH?usp=drive_link",
                videos: " ",
                summaries: "https://drive.google.com/drive/folders/152JzhYGQ9AiMksjks4mIIoULsYBNQ0Jt?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1g8MeUv89wUc5meya3zO5_DBIIVvc4xu7?usp=drive_link"
              }
            },
          ],
          term2: [
            {
              id: "data-computation-analysis",
              name: "Data Computation and Analysis",
              code: "02-24-01304",
              description: "Advanced computational methods for data analysis",
              creditHours: 3,
              prerequisites: ["machine-learning","data-mining-analytics"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1DyWdkx1w4_8I-3jWEBU78r5AJtukFqaR?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1mdMcLznO8KyNs91IWodCpdN8rdgIeV10?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1Je3MNYuv6V7HIj7dtQp87lt-i0IZ8OR5?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1_xO3Y7VY4qqYUdhncxq8D5IG10xvtN0t?usp=drive_link"
              }
            },
            {
              id: "survey-methodology",
              name: "Survey Methodology",
              code: "02-24-01305",
              description: "Design and implementation of survey research methods",
              creditHours: 3,
              prerequisites: ["probability-statistics-2"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/10Q55FC9PkoQYlV2DiFlwYQqLUn7c0Hvs?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1NwcCR9EQyYjtEqshFechfDzQJwERAr8-?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1AKHPJXp9VVhYGUutKPP7XqgPjfTbrkIf?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1vgvf18-SQ8zlkhFk_HyNQVl6HhzlbtC4?usp=drive_link"
              }
            },
            {
              id: "computing-intensive-statistical-methods",
              name: "Computing Intensive Statistical Methods",
              code: "02-24-01306",
              description: "Computational approaches to complex statistical problems",
              creditHours: 3,
              prerequisites: ["probability-statistics-2"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1rLxUL06kYDhdBrGfB1H-F_s1zomdjqd1?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/149t4EDeg2uQkt97V_m94S6aJYPqCaekY?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PL7snZ0LSsq3ghVGnrH2n6jIdY40wFrKcl&si=fRZbzfepWYhW7xGJ",
                summaries: "https://drive.google.com/drive/folders/1KJuTX2s7cXjBiX9al646SbgwfGXRLBXf?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1FVBJtarizr-5ZQbTRMZ3CQ5YaQlyusOV?usp=drive_link"
              }
            },
          ]
        }
      },
      4: {
        subjects: {
          term1: [
            {
              id: "big-data-analytics",
              name: "Big Data Analytics",
              code: "02-24-01401",
              description: "Processing and analyzing large-scale datasets",
              creditHours: 3,
              prerequisites: ["programming-1","machine-learning","data-mining-analytics"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1XCDa4h8-updjGudG12oSDSvmwD5-bLlV",
                sections: "https://drive.google.com/drive/folders/1zvDWYTK9JZMebXdatLRWvdQIdw02e3V4",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1cOdJfBRveI3eu32-23c5rWGAQ4aVWPjb",
                exams: "https://drive.google.com/drive/folders/1QEgss5XshLKu8zy_7_6UOz0evEUiOFK7"
              }
            },
            {
              id: "intro-social-networks",
              name: "Introduction to Social Networks",
              code: "02-24-01402",
              description: "Analysis of social network structures and dynamics",
              creditHours: 3,
              prerequisites: ["probability-statistics-2"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1_65rVBclWbNMIkD2IFdb8E-fVoXtNela",
                sections: "https://drive.google.com/drive/folders/1QQJf4G0l0QOyTNS00XXCuckWzuz0qaJ-",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1f30BL2yOEenLm7eJPp1x-bET81fECeaO",
                exams: "https://drive.google.com/drive/folders/1Dvq4nBeoavTE0KQwym1O_mjscNfBFUrp"
              }
            },
            {
              id: "simulations",
              name: "Simulations",
              code: "02-24-01403",
              description: "Monte Carlo methods and simulation techniques",
              creditHours: 3,
              prerequisites: ["programming-1","probability-statistics-1"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1l5ZPoIvEehAF8K0JEVNhQ3ns4NRndm7u",
                sections: "https://drive.google.com/drive/folders/1iSN9XQ1-l_sFJxuOI9frRZ7IowrNoTDU",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1ZtyTVQe6I4n9-s-aHul-WNt8uAVF8dWA",
                exams: "https://drive.google.com/drive/folders/1m9oZxLuNlQyHR5y9DXk-jMUearFu2v4X"
              }
            }
          ],
          term2: [
            {
              id: "social-data-analytics",
              name: "Social Data Analytics",
              code: "02-24-01405",
              description: "Analysis of social media and behavioral data",
              creditHours: 3,
              prerequisites: ["linear-algebra","probability-statistics-2","machine-learning","intro-social-networks"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1oSgnG2Q-rf3mV-cmFQlqZRza889ReqeE",
                sections: "https://drive.google.com/drive/folders/1qhHVTrfR0NOAHQ7LO7yonpklE1FBPUMM",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1Umbq7j05iHfo-Q7xCu9g142jA5HBrLyN",
                exams: "https://drive.google.com/drive/folders/1DP6gqmyFU-E6n-IUgDgkFZUACwr__m87"
              }
            },
            {
              id: "distributed-data-analysis",
              name: "Distributed Data Analysis",
              code: "02-24-01406",
              description: "Parallel and distributed computing for data analysis",
              creditHours: 3,
              prerequisites: ["intro-databases","cloud-computing","data-mining-analytics"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1WJxABPSaiv-pukYsdc-mBDWbjkMAICbk",
                sections: "https://drive.google.com/drive/folders/178pB4K_IPE4ttuYzDV8V1lHJ5LSWSPcK",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1dp5U9cGlKNZvohGkPK00pXrJJY2Hm7xG",
                exams: "https://drive.google.com/drive/folders/1z3MG9hf0PPMJ7KmwwrMwPG2aqp196_s8"
              }
            },
            {
              id: "stream-processing",
              name: "Stream Processing",
              code: "02-24-01407",
              description: "Real-time data processing and streaming analytics",
              creditHours: 3,
              prerequisites: ["data-structures-algorithms","data-mining-analytics"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/19sE6SSdSOlv5C0PUJh9TLNNOB0Qen9TJ",
                sections: "https://drive.google.com/drive/folders/10Rq6XFVlRgjnMSlsG-Q_gI_8Zzc3wXW9",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1CamzrjeiXMhFHEQiq0Isr_N-M-bEQ3yo",
                exams: "https://drive.google.com/drive/folders/18qtouIWhwaAzzKCyrzynn6tV6RSe2wde"
              }
            }
          ]
        }
      },
    }
  },
  "business-analytics": {
    name: "Business Analytics",
    description: "Data-driven business intelligence and analytics for strategic decision making",
    levels: {
      1: {
        subjects: {
          term1: [
            {
              id: "linear-algebra-ba",
              name: "Linear Algebra",
              code: "02-24-00101",
              description: "Mathematical foundations of linear algebra for data science applications",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yFYYS37ERUHG6Ft_HnC17Jmgo-Zsrg06?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/191trjdbwAtjG6yz65q-C1Hd3gigqoti7?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLvuToPs04FnD1lFBolGr4ROQaxQ_zyC1c&si=6IWNZY0eY_ymFdAq"],
                summaries: "https://drive.google.com/drive/folders/150zP5Dc9vDKzazlm37IRttDG-_b-opK1?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1vUbUjWsbexiPgjDbJOuh-N43PVDc9hjc?usp=drive_link"
              }
            },
            {
              id: "calculus-ba",
              name: "Calculus",
              code: "02-24-00102",
              description: "Differential and integral calculus with applications in computing",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1LsWVrCXpwVsL7YhGL_QFQhyryvpc_Yon?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1U2LbrtWkf-X8DL3c7Yo12kgV8bbZ0Wb6?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1UkJQ6mJmcSb_MTbzT_8liJZTUMCOLARt?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1Uf7LaRzQyqxEbTVG0dfmWFzTxmZNHLvB?usp=drive_link"
              }
            },
            {
              id: "intro-computer-systems-ba",
              name: "Introduction to Computer Systems",
              code: "02-24-00103",
              description: "Fundamentals of computer architecture and system organization",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yQK4QiXQ7e7Ui6DLMAGYQa3aTuQp0v9O?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1q0iRgXguAaa2zZTSA9J1smnCwN2PwCAn?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLskaQRgiRMYb0SqvJ-wKx2n4Q3CB5uQ8e&si=wXANl6gRLW404zuP"],
                summaries: "https://drive.google.com/drive/folders/1RFPXNiitr2yiHr1AyCsZWuTX0rYyOwIL?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1hTVXduWW2Icy8HY-uOc5lEiUUM42RSkB?usp=drive_link"
              }
            },
            {
              id: "intro-data-sciences-ba",
              name: "Introduction to Data Sciences",
              code: "02-24-00104",
              description: "Overview of data science concepts, tools, and methodologies",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/10SsZONPzWccvjTQB4ZcHmT0j_FU8b981?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/14IwWgXRgD8G2IPJ2op1RdBIj9pgs77LJ?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLNVsyemi1cQyXLWT3vm4GbWzVxAK_4nbR&si=Q7kxeMYT4iXhr2uC"],
                summaries: "https://drive.google.com/drive/folders/13IFz-O_64Ga8y9TyFe13CSovw0xzxdUQ?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1adpsd15n6hieC29aQECkrftCHNz20U9c?usp=drive_link"
              }
            },
            {
              id: "programming-1-ba",
              name: "Programming I",
              code: "02-24-00105",
              description: "Introduction to programming concepts and problem-solving techniques",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1VDUvvvKoRcBfdCAgdO5GUa8ourGzEj43?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/14-W3wcsn8gw2ym8CnIo_L6jh0RfQW-mR?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLCInYL3l2AajYlZGzU_LVrHdoouf8W6ZN&si=_3EUjHYYQd7xAuGr","https://youtube.com/playlist?list=PL1DUmTEdeA6K7rdxKiWJq6JIxTvHalY8f&si=wl8ryBAWTyTatxTw"],
                summaries: "https://drive.google.com/drive/folders/19GRYDzueyRIB45_CJGn9Qh3_3JkIgfQH?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1wT8Ad9IGifK4NMgE71xXzLhXs4FF0wuc?usp=drive_link"
              }
            },
            {
              id: "critical-thinking-ba",
              name: "Critical Thinking",
              code: "02-00-000XX",
              description: "Development of analytical and critical thinking skills",
              creditHours: 2,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1mGHqF_BIXdX-S6BipXm942CsOvr6WHTG?usp=drive_link",
                sections: "",
                videos: ["https://youtube.com/playlist?list=PL2y4AZEEnQLmigukmMl5lD0CkewT1pBQ3&si=GijvUZQgn4vO1gdR"],
                summaries: "https://drive.google.com/drive/folders/1He5H59nOzExcoG5GYaujPWQVnKTZwD2Z?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1ZfnkRMneHYU5wYlq4738XZt1NvGlRbt6?usp=drive_link"
              }
            }
          ],
          term2: [
            {
              id: "probability-statistics-1-ba",
              name: "Probability and Statistics I",
              code: "02-24-00106",
              description: "Fundamental concepts of probability theory and statistical analysis",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/14WxYDv-3V5hBNF2FTrLEKkZpPQJjwyUb?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1yy9aqzmJsEDZasn2VT1nfzIdJoajEf6F?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PL7snZ0LSsq3g9NUio7xFDtC9IVIj649GV","https://youtube.com/playlist?list=PLXCWPoTuIpYbXgbNuQkBHlMwjK6DpnQ3l"],
                summaries: "https://drive.google.com/drive/folders/1CmL8lOIlbHdYCAhNa5cJSbDSTGEJVdMt?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1reVZYtR8aOBqpHY8PSn2vmwVwNCS_nQC?usp=drive_link"
              }
            },
            {
              id: "discrete-structures-ba",
              name: "Discrete Structures",
              code: "02-24-00107",
              description: "Mathematical structures and logic for computer science",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/12dEJoHHZhCBjBG1KiV2T92HLsGRtDIn8?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1KnWe1Ciq3ETioGCIApu89Sc3Y1FvEgIO?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PLxIvc-MGOs6gZlMVYOOEtUHJmfUquCjwz",
                summaries: "https://drive.google.com/drive/folders/1sqiDSQMkoYZCehzIgdyxZcNRSYpIkLnX?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1SgzQqrBfbam-yqOw8xOdq9SKXPlScR2k?usp=drive_link"
              }
            },
            {
              id: "data-structures-algorithms-ba",
              name: "Data Structures and Algorithms",
              code: "02-24-00108",
              description: "Fundamental data structures and algorithmic problem-solving",
              creditHours: 3,
              prerequisites: ["programming-1-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1U2vmhFrPOs46SZk-rNdzE4yrCIPL5Qow?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1nr2Og9PqyiRYGl7jFJOtgZx1LGZfeHvY?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PLCInYL3l2AajqOUW_2SwjWeMwf4vL4RSp",
                summaries: "https://drive.google.com/drive/folders/1Oiki77OjApABjz0z7D3j2g-Kxc7-hN59?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1IADSkBhDhvgjpDJecfTf9VlvdoJ9P2hD?usp=drive_link"
              }
            },
            {
              id: "intro-artificial-intelligence-ba",
              name: "Introduction to Artificial Intelligence",
              code: "02-24-00109",
              description: "Basic concepts and applications of artificial intelligence",
              creditHours: 3,
              prerequisites: ["intro-computer-systems-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1tp-If4eJhcAY4dIzgSieKIj3YVdSF-8m?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1HYXjZlFJL8FfAKoyhDbshpwwLVBN700R?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1RaS9fI4MaHKg_Bxs_GgyYE_LVuaG3kaJ?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1jjGy4TJ8EbON_k0hf2exQNQtQx2KR4wr?usp=drive_link"
              }
            },
            {
              id: "programming-2-ba",
              name: "Programming II",
              code: "02-24-00110",
              description: "Advanced programming concepts and software development",
              creditHours: 3,
              prerequisites: ["programming-1-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yiF9hcqLqa-wyKfEzdiWDF0bR4A_VtK2?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1geGGbmFKJYIN1yvyIskEeRyI0Y8zWhpU?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLCInYL3l2AagY7fFlhCrjpLiIFybW3yQv","https://youtube.com/playlist?list=PL1DUmTEdeA6Icttz-O9C3RPRF8R8Px5vk"],
                summaries: "https://drive.google.com/drive/folders/1VGGZWwQmZdVD8LWI6piI_RzQqdwKq_st?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1dxwniB91RAEtAu0hKLt5cWqb3t1Q0FLI?usp=drive_link"
              }
            },
            {
              id: "innovation-entrepreneurship-ba",
              name: "Innovation & Entrepreneurship",
              code: "02-00-000XX",
              description: "Principles of innovation and entrepreneurial thinking",
              creditHours: 2,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1aEPdYTJoeTy0QhS3j1YE3GnJsjIs_8ij?usp=drive_link",
                sections: "",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1n1AWZVhnH-Hr_8xmF8PiHdzTHYLGIsRa?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1MxzGEcFlQuweR0XHi7zuBMDuIfn00tcZ?usp=drive_link"
              }
            }
          ]
        }
      },
      2: {
        subjects: {
          term1: [
            {
              id: "probability-statistics-2-ba",
              name: "Probability and Statistics II",
              code: "02-24-00201",
              description: "Advanced statistical methods and probability distributions",
              creditHours: 3,
              prerequisites: ["probability-statistics-1-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Cat1L5ibgjDAx3qcU8XpKuM2Sp0jIWdA?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/17m-plzdlLyhkjM_TFmcYw5AZyC61yNrx?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PL7snZ0LSsq3g6KzD6pdqwU3_Do8WPY4M8&si=1ZMtkTPNNIX7q31M","https://youtube.com/playlist?list=PLtK59GunEou_TMg812_orrEE3H8UbUSta&si=zISZN1TFNbmCSoXn"],
                summaries: "https://drive.google.com/drive/folders/1z2c94GAfxG4TdX63ZY_rZSicvEZlrRHS?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1QRMaP_UgieJRGo5ebwvD_bIu9EMF0SYs?usp=drive_link"
              }
            },
            {
              id: "intro-databases-ba",
              name: "Introduction to Databases",
              code: "02-24-00202",
              description: "Database design, implementation, and management principles",
              creditHours: 3,
              prerequisites: ["programming-1-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/10DIqel1WkLIg5YZ1qbT604vRdpVPyLZ6?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1a78X1gWfKKui7qrsGkHvwycayAssG8Le?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PL37D52B7714788190&si=9Qkf5KQWLTXqYKt1",
                summaries: "https://drive.google.com/drive/folders/1vMRqmZ7ID3YIT920N6loq_yJKOQSOG65?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1luaj1L4qB2T3hTcQvwra667abVRXOx9c?usp=drive_link"
              }
            },
            {
              id: "numerical-computations-ba",
              name: "Numerical Computations",
              code: "02-24-00203",
              description: "Numerical methods and computational techniques",
              creditHours: 3,
              prerequisites: ["linear-algebra-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1YerbhXBHp9cLVhuBlsp337xKVS_01139?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1K4WIBD41wo7MP_GwXpo6yfEg-93c2wVM?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1WbNyHrPMQg8aBKK3pEUvBplv7gxzsxHS?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/14RRGt31M6KSQAxypsDQ2sMI_DR939Wy5?usp=drive_link"
              }
            },
            {
              id: "advanced-calculus-ba",
              name: "Advanced Calculus",
              code: "02-24-01201",
              description: "Multivariable calculus and advanced mathematical analysis",
              creditHours: 3,
              prerequisites: ["calculus-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1kMuGgdNfirnO_HP6CYKL02-LRJXjpgfh?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/19elXC7fQOQASSTk2cG9pa2GVU1i4gFW3?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1iGMlitjUbTAe-PAr1Gm7ftOqMQjbmjvV?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1NlpAB2MaIloRaoBeiNG2qiZagRn8EYPU?usp=drive_link"
              }
            },
            {
              id: "data-science-methodology-ba",
              name: "Data Science Methodology",
              code: "02-24-01202",
              description: "Systematic approaches to data science projects and research",
              creditHours: 3,
              prerequisites: ["intro-data-sciences-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1euOjkcK23yHHMKwvx6zOJiPgrj7-m09k?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1C14zdESIjWhVfxFXP5eDsGY5D290Mu6Z?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1G_XU_TmlwWBKyhFUOj0L055GBsTfniJT?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1_PCpSjwGN8wHeO_uB0bthGi6iDcI5AsI?usp=drive_link"
              }
            },
            {
              id: "intro-business",
              name: "Introduction to Business",
              code: "02-24-02201",
              description: "Fundamentals of business operations and management",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1EHeFukmbY41Byh0ICRdOYeGEGlRFOjre?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1t4KpjfxW5gbLGby0sIB-q8jQwUHFP4N0?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1hn-uMnhuaCRvLBDRrgzr4MIHEH6m-K0H?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1gzE-EwAi10rdxc6WIUYrrZR-tLOAnvid?usp=drive_link"
              }
            },
            {
              id: "accounting-information-systems",
              name: "Accounting as an Information Systems",
              code: "02-24-02202",
              description: "Accounting principles and information systems integration",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/16Ky0uBqcK_qLTTwt4H2kLR_OuqgqvQv-?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/17rp47Vi0r6ORxAjsaHNnGBFqoeez0J_I?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/11GR8XB5TldP3B9S07T6V70-LURnmTAv2?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/18f3nr-TvK01abgOtBZ1lZDwgrMf1E832?usp=drive_link"
              }
            }
          ],
          term2: [
            {
              id: "cloud-computing-ba",
              name: "Cloud Computing",
              code: "02-24-00204",
              description: "Cloud platforms, services, and distributed computing concepts",
              creditHours: 3,
              prerequisites: ["data-structures-algorithms-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1P37WAFRKgkokNwr6R5MZNOFEpff5dUIB?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1ny-TP92zjTZrctHIBx_QmsTfl52bSP1Q?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/11QHqhN6G_OmTNZTPdR_OVWzUZ5fEMO8X?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1ICXoWQy7-nas1_KaLNCA_fHKXEVvRqw2?usp=drive_link"
              }
            },
            {
              id: "machine-learning-ba",
              name: "Machine Learning",
              code: "02-24-00205",
              description: "Supervised and unsupervised learning algorithms and applications",
              creditHours: 3,
              prerequisites: ["intro-artificial-intelligence-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1CCeA8VUvw__jCBmZ-5Y1J3ujOyir4HSr?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1hO_vvmFpCD9zw4rlK77HIIeNVWpjgM2K?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1XdboKP5n65WZCznnqiCrE0BZfiarSl4Z?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1WI08MEt_kVSuMITdlqqgPaVpTUPwiqgK?usp=drive_link"
              }
            },
            {
              id: "data-mining-analytics-ba",
              name: "Data Mining and Analytics",
              code: "02-24-00206",
              description: "Techniques for extracting knowledge from large datasets",
              creditHours: 3,
              prerequisites: ["probability-statistics-2-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Ex-VAzuroLcg0fmSmg-Zd-x6KXCY7P1H?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1yRLzmfdAksXPomOZCRLQLG48sWnkQIDc?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1HRedV6Iu8Djd_f0AE0MigL8nKoq8Yb8-?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1mrKwfr3Mgi9p3zp7VdIVLmsUiPYhJYCX?usp=drive_link"
              }
            },
            {
              id: "system-analysis-design",
              name: "System Analysis & Design",
              code: "02-24-02203",
              description: "Business system analysis and design methodologies",
              creditHours: 3,
              prerequisites: ["intro-databases-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1XCk9YrAfo70uV9hfybNmvLvJn69lHFiZ",
                sections: "https://drive.google.com/drive/folders/10ttM9_EA2sEAPEj6_fsyKEaxP2AItRcP",
                videos: "https://youtube.com/playlist?list=system-analysis-design-videos",
                summaries: "https://drive.google.com/drive/folders/1-TUMlZnHgD5NSahx8Ab5v8tR4gBZ_bGy",
                exams: "https://drive.google.com/drive/folders/1bYzfL7z6ce132wz5wAEYxWP29khFj81k"
              }
            },
            {
              id: "financial-planning-analysis",
              name: "Financial Planning and Analysis",
              code: "02-24-02204",
              description: "Financial planning and analytical techniques",
              creditHours: 3,
              prerequisites: ["intro-business"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=financial-planning-analysis-videos",
                summaries: "",
                exams: ""
              }
            }
          ]
        }
      },
      3: {
        subjects: {
          term1: [
            {
              id: "business-process-modeling",
              name: "Business Process Modeling and Integration",
              code: "02-24-02301",
              description: "Business process analysis and integration strategies",
              creditHours: 3,
              prerequisites: ["system-analysis-design"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1QKcsyn3CRJC48qfF42wyFITdTVKdia_W",
                sections: "https://drive.google.com/drive/folders/1Z_8uBwlBi1XmSv4i3zX-_g6T2aWgiCaN",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1nNKwTX7uz_62EildtA5EC-JMd5cz9rkL",
                exams: "https://drive.google.com/drive/folders/1qXR1N2yaAL1dQKoso0PKRbdPFwvJhG-S"
              }
            },
            {
              id: "quantitative-analysis",
              name: "Quantitative Analysis",
              code: "02-24-02302",
              description: "Quantitative methods for business decision making",
              creditHours: 3,
              prerequisites: ["calculus-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1gKcKZS4Wqn_Sl4Xn6rI6gqqzEekhm9_m",
                sections: "https://drive.google.com/drive/folders/15FZ0zidfiGWHbKuwBalfvmUH25bM9D74",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1dGcCFP1hlpjbA8sjWk7Sbou68Wb_p1cA",
                exams: "https://drive.google.com/drive/folders/1rtSlR7xzXhC-qQVXyXXcVZFS9mVTXCvJ"
              }
            },
            {
              id: "data-warehousing-bi",
              name: "Data Warehousing & Business Intelligence",
              code: "02-24-02303",
              description: "Data warehousing and business intelligence systems",
              creditHours: 3,
              prerequisites: ["intro-databases-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/16UbTJJctK4CsF8oyg0SAd8xXeSHOONN1",
                sections: "https://drive.google.com/drive/folders/1LrAfAH1mBWqdVx5q4Q4ih10p5uS7hkwM",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/11aWXDahbIM4OT9R8qVgY_9Ny3bjXdJMg",
                exams: "https://drive.google.com/drive/folders/1hY_CGSou9ftbycUxMgeKPqt5MdLRugUN"
              }
            }
          ],
          term2: [
            {
              id: "data-visualization-ba",
              name: "Data Visualization",
              code: "02-24-02304",
              description: "Advanced data visualization techniques for business",
              creditHours: 3,
              prerequisites: ["intro-databases-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1cPdkERtei3lc_XCT_5flekoJuYPWZ29Q",
                sections: "https://drive.google.com/drive/folders/1akup2XLHU9HNVhNrRoVPXGjoJGS_b7xH",
                videos: "https://youtube.com/playlist?list=data-visualization-ba-videos",
                summaries: "https://drive.google.com/drive/folders/152JzhYGQ9AiMksjks4mIIoULsYBNQ0Jt",
                exams: "https://drive.google.com/drive/folders/1g8MeUv89wUc5meya3zO5_DBIIVvc4xu7"
              }
            },
            {
              id: "enterprise-information-systems",
              name: "Enterprise Information Systems",
              code: "02-24-02305",
              description: "Enterprise-level information system design and management",
              creditHours: 3,
              prerequisites: ["business-process-modeling"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=enterprise-information-systems-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "data-driven-marketing",
              name: "Data Driven Marketing",
              code: "02-24-02306",
              description: "Marketing analytics and data-driven marketing strategies",
              creditHours: 3,
              prerequisites: ["data-mining-analytics-ba"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=data-driven-marketing-videos",
                summaries: "",
                exams: ""
              }
            }
          ]
        }
      },
      4: {
        subjects: {
          term1: [
            {
              id: "leadership-people-analytics",
              name: "Leadership and People Analytics",
              code: "02-24-02401",
              description: "Analytics for human resources and leadership development",
              creditHours: 3,
              prerequisites: ["data-mining-analytics-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1MYRZzhVTKl7O3q4CsN0sPS0MkRcVSH2b",
                sections: "https://drive.google.com/drive/folders/1BG4XS8h0H2QOzpUKSixYkeMOURk3rNMT",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1NH5nC89K7o0XLETziaJGqB05g-s06_vp",
                exams: "https://drive.google.com/drive/folders/1s2-TVGPFUo8YWhw11CF-aQu3KXLUx29E"
              }
            },
            {
              id: "data-it-governance",
              name: "Data and IT Governance",
              code: "02-24-02402",
              description: "Governance frameworks for data and IT management",
              creditHours: 3,
              prerequisites: ["intro-business"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1KSm0LY51y2muMNtgdXujq-956X29K04y",
                sections: "https://drive.google.com/drive/folders/11Bb-pno434CjpSIKf1EfsMtLgfMuiOOp",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1fVhsb6iAr7htke2UtGMqbBv7br_t-yV1",
                exams: "https://drive.google.com/drive/folders/1k8RdV9E534AQieICjv1oP3aa4qSVP28O"
              }
            },
            {
              id: "information-retrieval",
              name: "Information Retrieval",
              code: "02-24-02403",
              description: "Information retrieval systems and search technologies",
              creditHours: 3,
              prerequisites: ["data-structures-algorithms-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1bJqQYd2fcQ8mMxV8cjD0ntuJGcae854-",
                sections: "https://drive.google.com/drive/folders/15IEyjPSHxu3qYNHD8Ie_gHrEvxkmYde0",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1rla3Hu9s8er_iQY8UpPwOjoFOoLZWhVj",
                exams: "https://drive.google.com/drive/folders/12sTWIY853fm1c8u9_hioMXCdoZs6VC5f"
              }
            }
          ],
          term2: [
            {
              id: "text-social-media-mining",
              name: "Text and Social Media Mining",
              code: "02-24-02405",
              description: "Mining and analysis of text and social media data",
              creditHours: 3,
              prerequisites: ["data-mining-analytics-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/19YAUxPw3oKrIMBOD_NJATwenwL2TMNZv",
                sections: "https://drive.google.com/drive/folders/1leC5AI9G_fRqrexGZne0djmlIY93KKYv",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1EQdOuS7W8yGYXKsi_-_T3DSE-LcCtjR8",
                exams: "https://drive.google.com/drive/folders/1Aj2dePCcXGAYU3no9qNhLSPQmnMjOm7t"
              }
            },
            {
              id: "logistics-supply-chain-analytics",
              name: "Logistics and Supply Chain Analytics",
              code: "02-24-02406",
              description: "Analytics for logistics and supply chain optimization",
              creditHours: 3,
              prerequisites: ["data-mining-analytics-ba"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1GriWftVSgG952MM9hGTtwTPppx3jkgrC",
                sections: "https://drive.google.com/drive/folders/1uFXXSooRfsik3ARrT5P7HC6CIFxiQ_W-",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1QoD6K83ufi7YnueDsZWyTGyOTiDfongm",
                exams: "https://drive.google.com/drive/folders/1H1wyRLy9icgEqpQA2CdgLcWcli-c3gML"
              }
            },
            {
              id: "it-laws-ethics",
              name: "Information Technology Laws and Ethics",
              code: "02-24-02407",
              description: "Legal and ethical aspects of information technology",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1CkGN2ikAyJ8z2u1mqS-XktHACL3Hkn5f",
                sections: "https://drive.google.com/drive/folders/1Je_tShtWBfHGdHj7Ep0ecFfS7kIsGTDx",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1Dx_bu3JnyBjspSS8qd2YCjzpRBT6Hl4p",
                exams: "https://drive.google.com/drive/folders/1gDfwPJBpen1nhVBu-fkYmM_i4FVAH8zX"
              }
            }
          ]
        }
      },
    }
  },
  "artificial-intelligence": {
    name: "Intelligent Systems",
    description: "Advanced AI systems, machine learning, and intelligent automation technologies",
    levels: {
      1: {
        subjects: {
          term1: [
            {
              id: "linear-algebra-is",
              name: "Linear Algebra",
              code: "02-24-00101",
              description: "Mathematical foundations of linear algebra for data science applications",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yFYYS37ERUHG6Ft_HnC17Jmgo-Zsrg06?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/191trjdbwAtjG6yz65q-C1Hd3gigqoti7?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLvuToPs04FnD1lFBolGr4ROQaxQ_zyC1c&si=6IWNZY0eY_ymFdAq"],
                summaries: "https://drive.google.com/drive/folders/150zP5Dc9vDKzazlm37IRttDG-_b-opK1?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1vUbUjWsbexiPgjDbJOuh-N43PVDc9hjc?usp=drive_link"
              }
            },
            {
              id: "calculus-is",
              name: "Calculus",
              code: "02-24-00102",
              description: "Differential and integral calculus with applications in computing",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1LsWVrCXpwVsL7YhGL_QFQhyryvpc_Yon?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1U2LbrtWkf-X8DL3c7Yo12kgV8bbZ0Wb6?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1UkJQ6mJmcSb_MTbzT_8liJZTUMCOLARt?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1Uf7LaRzQyqxEbTVG0dfmWFzTxmZNHLvB?usp=drive_link"
              }
            },
            {
              id: "intro-computer-systems-is",
              name: "Introduction to Computer Systems",
              code: "02-24-00103",
              description: "Fundamentals of computer architecture and system organization",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yQK4QiXQ7e7Ui6DLMAGYQa3aTuQp0v9O?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1q0iRgXguAaa2zZTSA9J1smnCwN2PwCAn?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLskaQRgiRMYb0SqvJ-wKx2n4Q3CB5uQ8e&si=wXANl6gRLW404zuP"],
                summaries: "https://drive.google.com/drive/folders/1RFPXNiitr2yiHr1AyCsZWuTX0rYyOwIL?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1hTVXduWW2Icy8HY-uOc5lEiUUM42RSkB?usp=drive_link"
              }
            },
            {
              id: "intro-data-sciences-is",
              name: "Introduction to Data Sciences",
              code: "02-24-00104",
              description: "Overview of data science concepts, tools, and methodologies",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/10SsZONPzWccvjTQB4ZcHmT0j_FU8b981?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/14IwWgXRgD8G2IPJ2op1RdBIj9pgs77LJ?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLNVsyemi1cQyXLWT3vm4GbWzVxAK_4nbR&si=Q7kxeMYT4iXhr2uC"],
                summaries: "https://drive.google.com/drive/folders/13IFz-O_64Ga8y9TyFe13CSovw0xzxdUQ?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1adpsd15n6hieC29aQECkrftCHNz20U9c?usp=drive_link"
              }
            },
            {
              id: "programming-1-is",
              name: "Programming I",
              code: "02-24-00105",
              description: "Introduction to programming concepts and problem-solving techniques",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1VDUvvvKoRcBfdCAgdO5GUa8ourGzEj43?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/14-W3wcsn8gw2ym8CnIo_L6jh0RfQW-mR?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLCInYL3l2AajYlZGzU_LVrHdoouf8W6ZN&si=_3EUjHYYQd7xAuGr","https://youtube.com/playlist?list=PL1DUmTEdeA6K7rdxKiWJq6JIxTvHalY8f&si=wl8ryBAWTyTatxTw"],
                summaries: "https://drive.google.com/drive/folders/19GRYDzueyRIB45_CJGn9Qh3_3JkIgfQH?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1wT8Ad9IGifK4NMgE71xXzLhXs4FF0wuc?usp=drive_link"
              }
            },
            {
              id: "critical-thinking-is",
              name: "Critical Thinking",
              code: "02-00-000XX",
              description: "Development of analytical and critical thinking skills",
              creditHours: 2,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1mGHqF_BIXdX-S6BipXm942CsOvr6WHTG?usp=drive_link",
                sections: "",
                videos: ["https://youtube.com/playlist?list=PL2y4AZEEnQLmigukmMl5lD0CkewT1pBQ3&si=GijvUZQgn4vO1gdR"],
                summaries: "https://drive.google.com/drive/folders/1He5H59nOzExcoG5GYaujPWQVnKTZwD2Z?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1ZfnkRMneHYU5wYlq4738XZt1NvGlRbt6?usp=drive_link"
              }
            }
          ],
          term2: [
            {
              id: "probability-statistics-1-is",
              name: "Probability and Statistics I",
              code: "02-24-00106",
              description: "Fundamental concepts of probability theory and statistical analysis",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/14WxYDv-3V5hBNF2FTrLEKkZpPQJjwyUb?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1yy9aqzmJsEDZasn2VT1nfzIdJoajEf6F?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PL7snZ0LSsq3g9NUio7xFDtC9IVIj649GV","https://youtube.com/playlist?list=PLXCWPoTuIpYbXgbNuQkBHlMwjK6DpnQ3l"],
                summaries: "https://drive.google.com/drive/folders/1CmL8lOIlbHdYCAhNa5cJSbDSTGEJVdMt?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1reVZYtR8aOBqpHY8PSn2vmwVwNCS_nQC?usp=drive_link"
              }
            },
            {
              id: "discrete-structures-is",
              name: "Discrete Structures",
              code: "02-24-00107",
              description: "Mathematical structures and logic for computer science",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/12dEJoHHZhCBjBG1KiV2T92HLsGRtDIn8?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1KnWe1Ciq3ETioGCIApu89Sc3Y1FvEgIO?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PLxIvc-MGOs6gZlMVYOOEtUHJmfUquCjwz",
                summaries: "https://drive.google.com/drive/folders/1sqiDSQMkoYZCehzIgdyxZcNRSYpIkLnX?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1SgzQqrBfbam-yqOw8xOdq9SKXPlScR2k?usp=drive_link"
              }
            },
            {
              id: "data-structures-algorithms-is",
              name: "Data Structures and Algorithms",
              code: "02-24-00108",
              description: "Fundamental data structures and algorithmic problem-solving",
              creditHours: 3,
              prerequisites: ["programming-1-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1U2vmhFrPOs46SZk-rNdzE4yrCIPL5Qow?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1nr2Og9PqyiRYGl7jFJOtgZx1LGZfeHvY?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PLCInYL3l2AajqOUW_2SwjWeMwf4vL4RSp",
                summaries: "https://drive.google.com/drive/folders/1Oiki77OjApABjz0z7D3j2g-Kxc7-hN59?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1IADSkBhDhvgjpDJecfTf9VlvdoJ9P2hD?usp=drive_link"
              }
            },
            {
              id: "intro-artificial-intelligence-is",
              name: "Introduction to Artificial Intelligence",
              code: "02-24-00109",
              description: "Basic concepts and applications of artificial intelligence",
              creditHours: 3,
              prerequisites: ["intro-computer-systems-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1tp-If4eJhcAY4dIzgSieKIj3YVdSF-8m?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1HYXjZlFJL8FfAKoyhDbshpwwLVBN700R?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1RaS9fI4MaHKg_Bxs_GgyYE_LVuaG3kaJ?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1jjGy4TJ8EbON_k0hf2exQNQtQx2KR4wr?usp=drive_link"
              }
            },
            {
              id: "programming-2-is",
              name: "Programming II",
              code: "02-24-00110",
              description: "Advanced programming concepts and software development",
              creditHours: 3,
              prerequisites: ["programming-1-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yiF9hcqLqa-wyKfEzdiWDF0bR4A_VtK2?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1geGGbmFKJYIN1yvyIskEeRyI0Y8zWhpU?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLCInYL3l2AagY7fFlhCrjpLiIFybW3yQv","https://youtube.com/playlist?list=PL1DUmTEdeA6Icttz-O9C3RPRF8R8Px5vk"],
                summaries: "https://drive.google.com/drive/folders/1VGGZWwQmZdVD8LWI6piI_RzQqdwKq_st?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1dxwniB91RAEtAu0hKLt5cWqb3t1Q0FLI?usp=drive_link"
              }
            },
            {
              id: "innovation-entrepreneurship-is",
              name: "Innovation & Entrepreneurship",
              code: "02-00-000XX",
              description: "Principles of innovation and entrepreneurial thinking",
              creditHours: 2,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1aEPdYTJoeTy0QhS3j1YE3GnJsjIs_8ij?usp=drive_link",
                sections: "",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1n1AWZVhnH-Hr_8xmF8PiHdzTHYLGIsRa?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1MxzGEcFlQuweR0XHi7zuBMDuIfn00tcZ?usp=drive_link"
              }
            }
          ]
        }
      },
      2: {
        subjects: {
          term1: [
            {
              id: "probability-statistics-2-is",
              name: "Probability and Statistics II",
              code: "02-24-00201",
              description: "Advanced statistical methods and probability distributions",
              creditHours: 3,
              prerequisites: ["probability-statistics-1-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Cat1L5ibgjDAx3qcU8XpKuM2Sp0jIWdA?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/17m-plzdlLyhkjM_TFmcYw5AZyC61yNrx?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PL7snZ0LSsq3g6KzD6pdqwU3_Do8WPY4M8&si=1ZMtkTPNNIX7q31M","https://youtube.com/playlist?list=PLtK59GunEou_TMg812_orrEE3H8UbUSta&si=zISZN1TFNbmCSoXn"],
                summaries: "https://drive.google.com/drive/folders/1z2c94GAfxG4TdX63ZY_rZSicvEZlrRHS?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1QRMaP_UgieJRGo5ebwvD_bIu9EMF0SYs?usp=drive_link"
              }
            },
            {
              id: "intro-databases-is",
              name: "Introduction to Databases",
              code: "02-24-00202",
              description: "Database design, implementation, and management principles",
              creditHours: 3,
              prerequisites: ["programming-1-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/10DIqel1WkLIg5YZ1qbT604vRdpVPyLZ6?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1a78X1gWfKKui7qrsGkHvwycayAssG8Le?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PL37D52B7714788190&si=9Qkf5KQWLTXqYKt1",
                summaries: "https://drive.google.com/drive/folders/1vMRqmZ7ID3YIT920N6loq_yJKOQSOG65?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1luaj1L4qB2T3hTcQvwra667abVRXOx9c?usp=drive_link"
              }
            },
            {
              id: "numerical-computations-is",
              name: "Numerical Computations",
              code: "02-24-00203",
              description: "Numerical methods and computational techniques",
              creditHours: 3,
              prerequisites: ["linear-algebra-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1YerbhXBHp9cLVhuBlsp337xKVS_01139?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1K4WIBD41wo7MP_GwXpo6yfEg-93c2wVM?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1WbNyHrPMQg8aBKK3pEUvBplv7gxzsxHS?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/14RRGt31M6KSQAxypsDQ2sMI_DR939Wy5?usp=drive_link"
              }
            },
            {
              id: "smart-systems-computational-intelligence",
              name: "Smart Systems and Computational Intelligence",
              code: "02-24-03201",
              description: "Intelligent systems design and computational intelligence",
              creditHours: 3,
              prerequisites: ["intro-artificial-intelligence-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1I-G13-wTo-QEympSlLygMyERa1fuuAzJ?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1As8BizbMGdT8NgI2iyE79kHj9KyFsP_Y?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1fYFXF7nzhy14DZjvCGBbfqOOIU2wG7Op?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1EB83ykK4iM7EKuX518digunlTHW1f48b?usp=drive_link"
              }
            },
            {
              id: "operations-research",
              name: "Operations Research",
              code: "02-24-03202",
              description: "Optimization techniques and operations research methods",
              creditHours: 3,
              prerequisites: ["probability-statistics-1-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1UsjMAbX3Hylna15Q4mgMvTN60JDWlCsk?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1GNv82mzZ5heehxXkBmSz9bcwBF6twFiE?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1FSJy5BRx93VYB9S5V13LWaVgsgtfDSfR?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1tovGbCvULpJCG6BXHaeuBXN0-EOjAk_Z?usp=drive_link"
              }
            }
          ],
          term2: [
            {
              id: "cloud-computing-is",
              name: "Cloud Computing",
              code: "02-24-00204",
              description: "Cloud platforms, services, and distributed computing concepts",
              creditHours: 3,
              prerequisites: ["data-structures-algorithms-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1P37WAFRKgkokNwr6R5MZNOFEpff5dUIB?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1ny-TP92zjTZrctHIBx_QmsTfl52bSP1Q?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/11QHqhN6G_OmTNZTPdR_OVWzUZ5fEMO8X?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1ICXoWQy7-nas1_KaLNCA_fHKXEVvRqw2?usp=drive_link"
              }
            },
            {
              id: "machine-learning-is",
              name: "Machine Learning",
              code: "02-24-00205",
              description: "Supervised and unsupervised learning algorithms and applications",
              creditHours: 3,
              prerequisites: ["intro-artificial-intelligence-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1CCeA8VUvw__jCBmZ-5Y1J3ujOyir4HSr?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1hO_vvmFpCD9zw4rlK77HIIeNVWpjgM2K?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1XdboKP5n65WZCznnqiCrE0BZfiarSl4Z?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1WI08MEt_kVSuMITdlqqgPaVpTUPwiqgK?usp=drive_link"
              }
            },
            {
              id: "data-mining-analytics-is",
              name: "Data Mining and Analytics",
              code: "02-24-00206",
              description: "Techniques for extracting knowledge from large datasets",
              creditHours: 3,
              prerequisites: ["probability-statistics-2-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Ex-VAzuroLcg0fmSmg-Zd-x6KXCY7P1H?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1yRLzmfdAksXPomOZCRLQLG48sWnkQIDc?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1HRedV6Iu8Djd_f0AE0MigL8nKoq8Yb8-?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1mrKwfr3Mgi9p3zp7VdIVLmsUiPYhJYCX?usp=drive_link"
              }
            },
            {
              id: "pattern-recognition",
              name: "Pattern Recognition",
              code: "02-24-03203",
              description: "Pattern recognition algorithms and applications",
              creditHours: 3,
              prerequisites: ["linear-algebra-is","probability-statistics-1-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1vN7tgKg2d-G_CdfvVxA7HU6j2I9Ydfy9?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1J0M6pREMxxh1Q1VfPTjq9YcZCA2QAQ0m?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1I1FfAwEdenpHTKkQCkhBmyK87x0Jrtuo?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1EOh3fcjzdS4xbuedyW6nABttN7iCstLg?usp=drive_link"
              }
            },
            {
              id: "neural-networks",
              name: "Neural Networks",
              code: "02-24-03204",
              description: "Neural network architectures and training methods",
              creditHours: 3,
              prerequisites: ["intro-artificial-intelligence-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1TuR1Q_kC67HR5Tv-PTRAP26pMvDGfTuN?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1YzLUT2eb03jO0RWT1s1MzUgO43IM_yHp?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1oadfcwGdlId5wEIgOvhlsjTheLes1bGK?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1_qwwnimCKUu5ZiwjeUJMsxk_KElXD3Ce?usp=drive_link"
              }
            }
          ]
        }
      },
      3: {
        subjects: {
          term1: [
            {
              id: "intelligent-programming",
              name: "Intelligent Programming",
              code: "02-24-03301",
              description: "Programming techniques for intelligent systems",
              creditHours: 3,
              prerequisites: ["programming-1-is"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=intelligent-programming-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "deep-learning",
              name: "Deep Learning",
              code: "02-24-03302",
              description: "Deep neural networks and advanced architectures",
              creditHours: 3,
              prerequisites: ["neural-networks"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=deep-learning-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "modern-control-systems",
              name: "Modern Control Systems",
              code: "02-24-03303",
              description: "Control theory for intelligent systems",
              creditHours: 3,
              prerequisites: ["linear-algebra-is"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=modern-control-systems-videos",
                summaries: "",
                exams: ""
              }
            }
          ],
          term2: [
            {
              id: "embedded-systems",
              name: "Embedded Systems",
              code: "02-24-03304",
              description: "Embedded systems for intelligent applications",
              creditHours: 3,
              prerequisites: ["modern-control-systems"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=embedded-systems-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "computer-vision",
              name: "Computer Vision",
              code: "02-24-03305",
              description: "Computer vision algorithms and applications",
              creditHours: 3,
              prerequisites: ["intro-artificial-intelligence-is"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=computer-vision-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "ai-security-issues",
              name: "AI Security Issues",
              code: "02-24-03306",
              description: "Security challenges and solutions in AI systems",
              creditHours: 3,
              prerequisites: ["intro-artificial-intelligence-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Ra565nm7IwPvgvYbMMRtuDs0fGwVHoxK",
                sections: "https://drive.google.com/drive/folders/19rzicu7FCEefjwqoVCOiF-ntfM-kzEjO",
                videos: "https://youtube.com/playlist?list=ai-security-issues-videos",
                summaries: "https://drive.google.com/drive/folders/1oe1yRuvfCDAdOJzdh0Uj6Y6FIDpz9pA8",
                exams: "https://drive.google.com/drive/folders/119esT_F4aseG3fH8uClOSt7hQJ0DwTMY"
              }
            }
          ]
        }
      },
      4: {
        subjects: {
          term1: [
            {
              id: "ai-platforms",
              name: "AI Platforms",
              code: "02-24-03401",
              description: "AI development platforms and frameworks",
              creditHours: 3,
              prerequisites: ["intro-artificial-intelligence-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1mEsI49nPM4aEXIn-ozL0LfbVNuTbhxD8",
                sections: "https://drive.google.com/drive/folders/1npE1wDy6bYcLa8Y2xNBsNqZjBbyWP0ca",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1qZMef23zdFZATAcMmp9f6Sw4P8ISp3cq",
                exams: "https://drive.google.com/drive/folders/1sq4cCFBaD6PXJHb3EzcA7f-iY17rj1RN"
              }
            },
            {
              id: "internet-of-things-1",
              name: "Internet of Things I",
              code: "02-24-03402",
              description: "IoT fundamentals and intelligent device integration",
              creditHours: 3,
              prerequisites: ["embedded-systems"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1xsdMuQHI4Tf1jdKlhYaPGyJSRGHouZRG",
                sections: "https://drive.google.com/drive/folders/1cqm4KHxaw4B11kMksHodWnZ01eTG4QT1",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1XjW0IPyORzgifqqht_bcqer8JnhFYkgx",
                exams: "https://drive.google.com/drive/folders/1plcjrbq9IaIEYP0-EybqBNxkXPnl39Mv"
              }
            },
            {
              id: "natural-language-processing-is",
              name: "Natural Language Processing",
              code: "02-24-03403",
              description: "NLP techniques for intelligent systems",
              creditHours: 3,
              prerequisites: ["machine-learning-is"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/11d1LHDgabqdfbvvQR9SQIpv-Y_E7PyV9",
                sections: "https://drive.google.com/drive/folders/1_caEKnancQl_3a_1uE7ZYJN80so92QAF",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1GxHo9kvY26K0_FFV3pN1_g9lWsqQDYPs",
                exams: "https://drive.google.com/drive/folders/1DmZMnnRDeI42XiQYHhvkQi5OmwBz6pn8"
              }
            }
          ],
          term2: [
            {
              id: "reinforcement-learning",
              name: "Reinforcement Learning",
              code: "02-24-03405",
              description: "Reinforcement learning algorithms and applications",
              creditHours: 3,
              prerequisites: ["operations-research"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1DGvDGHfBkVJwQG2mBG7wD-O1ybhe0Fyt",
                sections: "https://drive.google.com/drive/folders/15szFTEbrnO92NT89J4pr10TeOEGDONd4",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1K1oucOhCIj8ox0Uwmwspbafv0HSNkCoK",
                exams: "https://drive.google.com/drive/folders/1TI8qjwXi1CzpH8i_ETlbaz7jIGO5jqc_"
              }
            },
            {
              id: "ai-for-robotics",
              name: "AI for Robotics",
              code: "02-24-03406",
              description: "Artificial intelligence applications in robotics",
              creditHours: 3,
              prerequisites: ["embedded-systems"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Yn6UCjScUNRlRUjP8-zjOY0uZLVZfMu6",
                sections: "https://drive.google.com/drive/folders/1kLQ8JOtradVotGQY5IA-oYmozLXOuSdg",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1Eon_rwzYQjAjsRPyrW41OedREBpZ6cIy",
                exams: "https://drive.google.com/drive/folders/1xiUAbXwzjlEBoZIBp2tYFAGWUI_RnHuc"
              }
            },
            {
              id: "visual-recognition",
              name: "Visual Recognition",
              code: "02-24-03407",
              description: "Advanced visual recognition and image analysis",
              creditHours: 3,
              prerequisites: ["computer-vision"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1GGmebstFaTPWPnK0YVv730TwFmWwbiXl",
                sections: "https://drive.google.com/drive/folders/1a9zU1ifMYuLv5p4KUMXKPHstFFQrHpMF",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1ZnQTTvsg4ZYnJNyGStmXsCClQFbKZ7wR",
                exams: "https://drive.google.com/drive/folders/1h5aKc6fhlIHOyHwB08WNHG6mu2g6R9wK"
              }
            }
          ]
        }
      },
    }
  },
  "media-analytics": {
    name: "Media Analytics",
    description: "Digital media analysis, content creation, and multimedia data processing",
    levels: {
      1: {
        subjects: {
          term1: [
            {
              id: "linear-algebra-ma",
              name: "Linear Algebra",
              code: "02-24-00101",
              description: "Mathematical foundations for media analytics",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=linear-algebra-ma-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "calculus-ma",
              name: "Calculus",
              code: "02-24-00102",
              description: "Calculus for media and digital content analysis",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1LsWVrCXpwVsL7YhGL_QFQhyryvpc_Yon",
                sections: "https://drive.google.com/drive/folders/1U2LbrtWkf-X8DL3c7Yo12kgV8bbZ0Wb6",
                videos: "https://youtube.com/playlist?list=calculus-ma-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "intro-computer-systems-ma",
              name: "Introduction to Computer Systems",
              code: "02-24-00103",
              description: "Computer systems for media processing",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yQK4QiXQ7e7Ui6DLMAGYQa3aTuQp0v9O",
                sections: "https://drive.google.com/drive/folders/1q0iRgXguAaa2zZTSA9J1smnCwN2PwCAn",
                videos: "https://youtube.com/playlist?list=computer-systems-ma-videos",
                summaries: "https://drive.google.com/drive/folders/1RFPXNiitr2yiHr1AyCsZWuTX0rYyOwIL",
                exams: "https://drive.google.com/drive/folders/1hTVXduWW2Icy8HY-uOc5lEiUUM42RSkB"
              }
            },
            {
              id: "intro-data-sciences-ma",
              name: "Introduction to Data Sciences",
              code: "02-24-00104",
              description: "Data science fundamentals for media analytics",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/10SsZONPzWccvjTQB4ZcHmT0j_FU8b981",
                sections: "https://drive.google.com/drive/folders/14IwWgXRgD8G2IPJ2op1RdBIj9pgs77LJ",
                videos: "https://youtube.com/playlist?list=data-sciences-ma-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "programming-1-ma",
              name: "Programming I",
              code: "02-24-00105",
              description: "Programming fundamentals for media applications",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1VDUvvvKoRcBfdCAgdO5GUa8ourGzEj43",
                sections: "https://drive.google.com/drive/folders/14-W3wcsn8gw2ym8CnIo_L6jh0RfQW-mR",
                videos: "https://youtube.com/playlist?list=programming-1-ma-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "critical-thinking-ma",
              name: "Critical Thinking",
              code: "02-00-000XX",
              description: "Critical thinking for media analysis",
              creditHours: 2,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1mGHqF_BIXdX-S6BipXm942CsOvr6WHTG",
                sections: "",
                videos: "https://youtube.com/playlist?list=critical-thinking-ma-videos",
                summaries: "",
                exams: ""
              }
            }
          ],
          term2: [
            {
              id: "probability-statistics-1-ma",
              name: "Probability and Statistics I",
              code: "02-24-00106",
              description: "Fundamental concepts of probability theory and statistical analysis",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/14WxYDv-3V5hBNF2FTrLEKkZpPQJjwyUb?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1yy9aqzmJsEDZasn2VT1nfzIdJoajEf6F?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PL7snZ0LSsq3g9NUio7xFDtC9IVIj649GV","https://youtube.com/playlist?list=PLXCWPoTuIpYbXgbNuQkBHlMwjK6DpnQ3l"],
                summaries: "https://drive.google.com/drive/folders/1CmL8lOIlbHdYCAhNa5cJSbDSTGEJVdMt?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1reVZYtR8aOBqpHY8PSn2vmwVwNCS_nQC?usp=drive_link"
              }
            },
            {
              id: "discrete-structures-ma",
              name: "Discrete Structures",
              code: "02-24-00107",
              description: "Mathematical structures and logic for computer science",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/12dEJoHHZhCBjBG1KiV2T92HLsGRtDIn8?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1KnWe1Ciq3ETioGCIApu89Sc3Y1FvEgIO?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PLxIvc-MGOs6gZlMVYOOEtUHJmfUquCjwz",
                summaries: "https://drive.google.com/drive/folders/1sqiDSQMkoYZCehzIgdyxZcNRSYpIkLnX?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1SgzQqrBfbam-yqOw8xOdq9SKXPlScR2k?usp=drive_link"
              }
            },
            {
              id: "data-structures-algorithms-ma",
              name: "Data Structures and Algorithms",
              code: "02-24-00108",
              description: "Fundamental data structures and algorithmic problem-solving",
              creditHours: 3,
              prerequisites: ["programming-1-ma"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1U2vmhFrPOs46SZk-rNdzE4yrCIPL5Qow?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1nr2Og9PqyiRYGl7jFJOtgZx1LGZfeHvY?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PLCInYL3l2AajqOUW_2SwjWeMwf4vL4RSp",
                summaries: "https://drive.google.com/drive/folders/1Oiki77OjApABjz0z7D3j2g-Kxc7-hN59?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1IADSkBhDhvgjpDJecfTf9VlvdoJ9P2hD?usp=drive_link"
              }
            },
            {
              id: "intro-artificial-intelligence-ma",
              name: "Introduction to Artificial Intelligence",
              code: "02-24-00109",
              description: "Basic concepts and applications of artificial intelligence",
              creditHours: 3,
              prerequisites: ["intro-computer-systems-ma"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1tp-If4eJhcAY4dIzgSieKIj3YVdSF-8m?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1HYXjZlFJL8FfAKoyhDbshpwwLVBN700R?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1RaS9fI4MaHKg_Bxs_GgyYE_LVuaG3kaJ?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1jjGy4TJ8EbON_k0hf2exQNQtQx2KR4wr?usp=drive_link"
              }
            },
            {
              id: "programming-2-ma",
              name: "Programming II",
              code: "02-24-00110",
              description: "Advanced programming concepts and software development",
              creditHours: 3,
              prerequisites: ["programming-1-ma"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yiF9hcqLqa-wyKfEzdiWDF0bR4A_VtK2?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1geGGbmFKJYIN1yvyIskEeRyI0Y8zWhpU?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLCInYL3l2AagY7fFlhCrjpLiIFybW3yQv","https://youtube.com/playlist?list=PL1DUmTEdeA6Icttz-O9C3RPRF8R8Px5vk"],
                summaries: "https://drive.google.com/drive/folders/1VGGZWwQmZdVD8LWI6piI_RzQqdwKq_st?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1dxwniB91RAEtAu0hKLt5cWqb3t1Q0FLI?usp=drive_link"
              }
            },
            {
              id: "innovation-entrepreneurship-ma",
              name: "Innovation & Entrepreneurship",
              code: "02-00-000XX",
              description: "Principles of innovation and entrepreneurial thinking",
              creditHours: 2,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1aEPdYTJoeTy0QhS3j1YE3GnJsjIs_8ij?usp=drive_link",
                sections: "",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1n1AWZVhnH-Hr_8xmF8PiHdzTHYLGIsRa?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1MxzGEcFlQuweR0XHi7zuBMDuIfn00tcZ?usp=drive_link"
              }
            }
          ]
        }
      },
      2: {
        subjects: {
          term1: [
            {
              id: "probability-statistics-2-ma",
              name: "Probability and Statistics II",
              code: "02-24-00201",
              description: "Advanced statistical methods and probability distributions",
              creditHours: 3,
              prerequisites: ["probability-statistics-1-ma"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Cat1L5ibgjDAx3qcU8XpKuM2Sp0jIWdA?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/17m-plzdlLyhkjM_TFmcYw5AZyC61yNrx?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PL7snZ0LSsq3g6KzD6pdqwU3_Do8WPY4M8&si=1ZMtkTPNNIX7q31M","https://youtube.com/playlist?list=PLtK59GunEou_TMg812_orrEE3H8UbUSta&si=zISZN1TFNbmCSoXn"],
                summaries: "https://drive.google.com/drive/folders/1z2c94GAfxG4TdX63ZY_rZSicvEZlrRHS?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1QRMaP_UgieJRGo5ebwvD_bIu9EMF0SYs?usp=drive_link"
              }
            },
            {
              id: "intro-databases-ma",
              name: "Introduction to Databases",
              code: "02-24-00202",
              description: "Database design, implementation, and management principles",
              creditHours: 3,
              prerequisites: ["programming-1-ma"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/10DIqel1WkLIg5YZ1qbT604vRdpVPyLZ6?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1a78X1gWfKKui7qrsGkHvwycayAssG8Le?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PL37D52B7714788190&si=9Qkf5KQWLTXqYKt1",
                summaries: "https://drive.google.com/drive/folders/1vMRqmZ7ID3YIT920N6loq_yJKOQSOG65?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1luaj1L4qB2T3hTcQvwra667abVRXOx9c?usp=drive_link"
              }
            },
            {
              id: "numerical-computations-ma",
              name: "Numerical Computations",
              code: "02-24-00203",
              description: "Numerical methods and computational techniques",
              creditHours: 3,
              prerequisites: ["linear-algebra-ma"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1YerbhXBHp9cLVhuBlsp337xKVS_01139?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1K4WIBD41wo7MP_GwXpo6yfEg-93c2wVM?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1WbNyHrPMQg8aBKK3pEUvBplv7gxzsxHS?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/14RRGt31M6KSQAxypsDQ2sMI_DR939Wy5?usp=drive_link"
              }
            },
            {
              id: "data-driven-journalism",
              name: "Data Driven Journalism",
              code: "02-24-04201",
              description: "Data analysis and visualization for journalism",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/17DyOBlP5AtyL9gfAWs69CGonO1tRD6Y9?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/19yJcRK13uE_EhtZ87kCdxWrXYg1NVZ9y?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1xaILR53ySZKUY_WLI9ifRoLIBcrnPRkY?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1zNkDQpkRlN0P6M8dXVLXd34BR6piY84O?usp=drive_link"
              }
            },
            {
              id: "digital-mass-communication",
              name: "Digital Mass Communication",
              code: "02-24-04202",
              description: "Digital communication theories and practices",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Bah21GU7oDHCcmk5D5KEkSAjcDYMpw_0?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1c1vBKiBvFutaUARuKG38XCBdePWq_ryZ?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1GJlTRf0RR_QsbqNUZzIzBNpZDdWa7_dB?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1l-eSxZso5-W62CCgJHhxe2OWChOGgKeF?usp=drive_link"
              }
            }
          ],
          term2: [
            {
              id: "cloud-computing-ma",
              name: "Cloud Computing",
              code: "02-24-00204",
              description: "Cloud platforms, services, and distributed computing concepts",
              creditHours: 3,
              prerequisites: ["data-structures-algorithms-ma"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1P37WAFRKgkokNwr6R5MZNOFEpff5dUIB?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1ny-TP92zjTZrctHIBx_QmsTfl52bSP1Q?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/11QHqhN6G_OmTNZTPdR_OVWzUZ5fEMO8X?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1ICXoWQy7-nas1_KaLNCA_fHKXEVvRqw2?usp=drive_link"
              }
            },
            {
              id: "machine-learning-ma",
              name: "Machine Learning",
              code: "02-24-00205",
              description: "Supervised and unsupervised learning algorithms and applications",
              creditHours: 3,
              prerequisites: ["intro-artificial-intelligence-ma"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1CCeA8VUvw__jCBmZ-5Y1J3ujOyir4HSr?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1hO_vvmFpCD9zw4rlK77HIIeNVWpjgM2K?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1XdboKP5n65WZCznnqiCrE0BZfiarSl4Z?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1WI08MEt_kVSuMITdlqqgPaVpTUPwiqgK?usp=drive_link"
              }
            },
            {
              id: "data-mining-analytics-ma",
              name: "Data Mining and Analytics",
              code: "02-24-00206",
              description: "Techniques for extracting knowledge from large datasets",
              creditHours: 3,
              prerequisites: ["probability-statistics-2-ma"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Ex-VAzuroLcg0fmSmg-Zd-x6KXCY7P1H?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1yRLzmfdAksXPomOZCRLQLG48sWnkQIDc?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1HRedV6Iu8Djd_f0AE0MigL8nKoq8Yb8-?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1mrKwfr3Mgi9p3zp7VdIVLmsUiPYhJYCX?usp=drive_link"
              }
            },
            {
              id: "digital-video-production",
              name: "Digital Video Production",
              code: "02-24-04203",
              description: "Digital video creation and production techniques",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=digital-video-production-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "news-editing-blogging",
              name: "News Editing and Blogging",
              code: "02-24-04204",
              description: "Digital content editing and blog management",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=news-editing-blogging-videos",
                summaries: "",
                exams: ""
              }
            }
          ]
        }
      },
      3: {
        subjects: {
          term1: [
            {
              id: "image-processing",
              name: "Image Processing",
              code: "02-24-04301",
              description: "Digital image processing and enhancement techniques",
              creditHours: 3,
              prerequisites: ["linear-algebra-ma","numerical-computations-ma"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=image-processing-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "web-design-seo",
              name: "Web Design and Search-Engine Optimization",
              code: "02-24-04302",
              description: "Web design principles and SEO strategies",
              creditHours: 3,
              prerequisites: ["programming-1-ma"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=web-design-seo-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "computer-audio",
              name: "Computer Audio",
              code: "02-24-04303",
              description: "Digital audio processing and synthesis",
              creditHours: 3,
              prerequisites: ["data-structures-algorithms-ma"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=computer-audio-videos",
                summaries: "",
                exams: ""
              }
            }
          ],
          term2: [
            {
              id: "infographics-data-visualization",
              name: "Infographics and Data Visualization",
              code: "02-24-04304",
              description: "Creating effective infographics and data visualizations",
              creditHours: 3,
              prerequisites: ["data-structures-algorithms-ma","numerical-computations-ma"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1cPdkERtei3lc_XCT_5flekoJuYPWZ29Q",
                sections: "https://drive.google.com/drive/folders/1akup2XLHU9HNVhNrRoVPXGjoJGS_b7xH",
                videos: "https://youtube.com/playlist?list=infographics-data-visualization-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "natural-language-processing-ma",
              name: "Natural Language Processing",
              code: "02-24-04305",
              description: "NLP for media content analysis and generation",
              creditHours: 3,
              prerequisites: ["machine-learning-ma"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/11d1LHDgabqdfbvvQR9SQIpv-Y_E7PyV9",
                sections: "https://drive.google.com/drive/folders/1_caEKnancQl_3a_1uE7ZYJN80so92QAF",
                videos: "https://youtube.com/playlist?list=natural-language-processing-ma-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "media-processing",
              name: "Media Processing",
              code: "02-24-04306",
              description: "Advanced multimedia processing techniques",
              creditHours: 3,
              prerequisites: ["image-processing","computer-audio"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=media-processing-videos",
                summaries: "",
                exams: ""
              }
            }
          ]
        }
      },
      4: {
        subjects: {
          term1: [
            {
              id: "computer-graphics",
              name: "Computer Graphics",
              code: "02-24-04401",
              description: "3D graphics programming and rendering techniques",
              creditHours: 3,
              prerequisites: ["data-structures-algorithms-ma","infographics-data-visualization"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1ji7KLb7Mjp7wsUKuzgVBPHpH6rtVVGI0",
                sections: "https://drive.google.com/drive/folders/1kk8-jxIuEj9LFd9loELzNRT5bRD5KnG-",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1T4cPiAXSIJxDvlouAlhomoIjmdxTv9xv",
                exams: "https://drive.google.com/drive/folders/1JmhhAh8sUtIrjRSIYZpWy1W54cKXmy9O"
              }
            },
            {
              id: "digital-broadcasting",
              name: "Digital Broadcasting",
              code: "02-24-04402",
              description: "Digital broadcasting technologies and systems",
              creditHours: 3,
              prerequisites: ["data-structures-algorithms-ma","digital-video-production"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1UXFIyQt_6CN20dtjTSfaxAAjNvgEHHRP",
                sections: "https://drive.google.com/drive/folders/19-lfaxvfvjdlDwgmya0HRnvJ9q79AAK7",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1uJkMc4gN_htlcaMWpDHPaqnyI-rKGQJi",
                exams: "https://drive.google.com/drive/folders/1rFrtcZb-NQdYpbqAqcirlqwaZLjLgEGO"
              }
            },
            {
              id: "audience-research-analysis",
              name: "Audience Research and Analysis",
              code: "02-24-04403",
              description: "Media audience research and behavioral analysis",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/13Kn36QMKkgD-csvf5sJwJa9a-KRFSXCM",
                sections: "https://drive.google.com/drive/folders/1F0vSvfNhNG5BPy_oQpeqpwbR94jKG6DX",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1_oUAIX_YvWCNPmrOllDVEwebM_QtZHbL",
                exams: "https://drive.google.com/drive/folders/1Ea49ZVPyeELf9U_EapPTzeoikSSbNVRE"
              }
            }
          ],
          term2: [
            {
              id: "social-media-analytics",
              name: "Social Media Analytics",
              code: "02-24-04405",
              description: "Analysis of social media data and engagement metrics",
              creditHours: 3,
              prerequisites: ["machine-learning-ma","web-design-seo"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1mAwAQ5fw1gQCsqQOKaSxYPatnvvOt-BK",
                sections: "https://drive.google.com/drive/folders/1srQguJiSBJ6Eml0-I00hHGfKp6khwwy3",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/108FF163ClHUHTfYQtnDg12SxBINByju2",
                exams: "https://drive.google.com/drive/folders/17gONZypcLecDVs1XINxuODK3z4ZwkEYE"
              }
            },
            {
              id: "multimedia-analytics",
              name: "Multimedia Analytics",
              code: "02-24-04406",
              description: "Advanced analytics for multimedia content",
              creditHours: 3,
              prerequisites: ["machine-learning-ma","media-processing"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1mFZHEp6uKGiHjf0vQytVfvNGuR5rzDNm",
                sections: "https://drive.google.com/drive/folders/1c1BNdIoBGDlQRWZ2HoRmqHIfhvDGayTE",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1wkBb6v02RWi6wm5-KOzCll4bfJqLRI-a",
                exams: "https://drive.google.com/drive/folders/1dLMCJPU3jHNdg9IE5CxCUnjEqSxycp5U"
              }
            },
            {
              id: "public-opinion-e-surveys",
              name: "Public Opinion and E Surveys",
              code: "02-24-04407",
              description: "Digital survey methods and public opinion analysis",
              creditHours: 3,
              prerequisites: ["audience-research-analysis"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1cEws5ESprKjzZ9C8wU1L-zte-3Edf1wx",
                sections: "https://drive.google.com/drive/folders/1_KAITzJX_YeylZLn7rUBVOX2vNuSHuQ-",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1nB_Iwzcx2PLcG6Uzmr879RtGwzicn3rM",
                exams: "https://drive.google.com/drive/folders/17agsMgu_xD5auLqWnHAMefCJVko-8F6B"
              }
            }
          ]
        }
      },
    }
  },
  "healthcare-informatics": {
    name: "Healthcare Informatics",
    description: "Healthcare data analysis, medical informatics, and health information systems",
    levels: {
      1: {
        subjects: {
          term1: [
            {
              id: "linear-algebra-hi",
              name: "Linear Algebra",
              code: "02-24-00101",
              description: "Mathematical foundations for healthcare data analysis",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=linear-algebra-hi-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "calculus-hi",
              name: "Calculus",
              code: "02-24-00102",
              description: "Calculus applications in healthcare analytics",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1LsWVrCXpwVsL7YhGL_QFQhyryvpc_Yon",
                sections: "https://drive.google.com/drive/folders/1U2LbrtWkf-X8DL3c7Yo12kgV8bbZ0Wb6",
                videos: "https://youtube.com/playlist?list=calculus-hi-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "intro-computer-systems-hi",
              name: "Introduction to Computer Systems",
              code: "02-24-00103",
              description: "Computer systems for healthcare applications",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yQK4QiXQ7e7Ui6DLMAGYQa3aTuQp0v9O",
                sections: "https://drive.google.com/drive/folders/1q0iRgXguAaa2zZTSA9J1smnCwN2PwCAn",
                videos: "https://youtube.com/playlist?list=computer-systems-hi-videos",
                summaries: "https://drive.google.com/drive/folders/1RFPXNiitr2yiHr1AyCsZWuTX0rYyOwIL",
                exams: "https://drive.google.com/drive/folders/1hTVXduWW2Icy8HY-uOc5lEiUUM42RSkB"
              }
            },
            {
              id: "intro-data-sciences-hi",
              name: "Introduction to Data Sciences",
              code: "02-24-00104",
              description: "Data science fundamentals for healthcare",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/10SsZONPzWccvjTQB4ZcHmT0j_FU8b981",
                sections: "https://drive.google.com/drive/folders/14IwWgXRgD8G2IPJ2op1RdBIj9pgs77LJ",
                videos: "https://youtube.com/playlist?list=data-sciences-hi-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "programming-1-hi",
              name: "Programming I",
              code: "02-24-00105",
              description: "Programming fundamentals for healthcare informatics",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1VDUvvvKoRcBfdCAgdO5GUa8ourGzEj43",
                sections: "https://drive.google.com/drive/folders/14-W3wcsn8gw2ym8CnIo_L6jh0RfQW-mR",
                videos: "https://youtube.com/playlist?list=programming-1-hi-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "critical-thinking-hi",
              name: "Critical Thinking",
              code: "02-00-000XX",
              description: "Critical thinking in healthcare decision making",
              creditHours: 2,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1mGHqF_BIXdX-S6BipXm942CsOvr6WHTG",
                sections: "",
                videos: "https://youtube.com/playlist?list=critical-thinking-hi-videos",
                summaries: "",
                exams: ""
              }
            }
          ],
          term2: [
            {
              id: "probability-statistics-1-hi",
              name: "Probability and Statistics I",
              code: "02-24-00106",
              description: "Fundamental concepts of probability theory and statistical analysis",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/14WxYDv-3V5hBNF2FTrLEKkZpPQJjwyUb?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1yy9aqzmJsEDZasn2VT1nfzIdJoajEf6F?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PL7snZ0LSsq3g9NUio7xFDtC9IVIj649GV","https://youtube.com/playlist?list=PLXCWPoTuIpYbXgbNuQkBHlMwjK6DpnQ3l"],
                summaries: "https://drive.google.com/drive/folders/1CmL8lOIlbHdYCAhNa5cJSbDSTGEJVdMt?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1reVZYtR8aOBqpHY8PSn2vmwVwNCS_nQC?usp=drive_link"
              }
            },
            {
              id: "discrete-structures-hi",
              name: "Discrete Structures",
              code: "02-24-00107",
              description: "Mathematical structures and logic for computer science",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/12dEJoHHZhCBjBG1KiV2T92HLsGRtDIn8?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1KnWe1Ciq3ETioGCIApu89Sc3Y1FvEgIO?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PLxIvc-MGOs6gZlMVYOOEtUHJmfUquCjwz",
                summaries: "https://drive.google.com/drive/folders/1sqiDSQMkoYZCehzIgdyxZcNRSYpIkLnX?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1SgzQqrBfbam-yqOw8xOdq9SKXPlScR2k?usp=drive_link"
              }
            },
            {
              id: "data-structures-algorithms-hi",
              name: "Data Structures and Algorithms",
              code: "02-24-00108",
              description: "Fundamental data structures and algorithmic problem-solving",
              creditHours: 3,
              prerequisites: ["programming-1-hi"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1U2vmhFrPOs46SZk-rNdzE4yrCIPL5Qow?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1nr2Og9PqyiRYGl7jFJOtgZx1LGZfeHvY?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PLCInYL3l2AajqOUW_2SwjWeMwf4vL4RSp",
                summaries: "https://drive.google.com/drive/folders/1Oiki77OjApABjz0z7D3j2g-Kxc7-hN59?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1IADSkBhDhvgjpDJecfTf9VlvdoJ9P2hD?usp=drive_link"
              }
            },
            {
              id: "intro-artificial-intelligence-hi",
              name: "Introduction to Artificial Intelligence",
              code: "02-24-00109",
              description: "Basic concepts and applications of artificial intelligence",
              creditHours: 3,
              prerequisites: ["intro-computer-systems-hi"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1tp-If4eJhcAY4dIzgSieKIj3YVdSF-8m?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1HYXjZlFJL8FfAKoyhDbshpwwLVBN700R?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1RaS9fI4MaHKg_Bxs_GgyYE_LVuaG3kaJ?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1jjGy4TJ8EbON_k0hf2exQNQtQx2KR4wr?usp=drive_link"
              }
            },
            {
              id: "programming-2-hi",
              name: "Programming II",
              code: "02-24-00110",
              description: "Advanced programming concepts and software development",
              creditHours: 3,
              prerequisites: ["programming-1-hi"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yiF9hcqLqa-wyKfEzdiWDF0bR4A_VtK2?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1geGGbmFKJYIN1yvyIskEeRyI0Y8zWhpU?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLCInYL3l2AagY7fFlhCrjpLiIFybW3yQv","https://youtube.com/playlist?list=PL1DUmTEdeA6Icttz-O9C3RPRF8R8Px5vk"],
                summaries: "https://drive.google.com/drive/folders/1VGGZWwQmZdVD8LWI6piI_RzQqdwKq_st?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1dxwniB91RAEtAu0hKLt5cWqb3t1Q0FLI?usp=drive_link"
              }
            },
            {
              id: "innovation-entrepreneurship-hi",
              name: "Innovation & Entrepreneurship",
              code: "02-00-000XX",
              description: "Principles of innovation and entrepreneurial thinking",
              creditHours: 2,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1aEPdYTJoeTy0QhS3j1YE3GnJsjIs_8ij?usp=drive_link",
                sections: "",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1n1AWZVhnH-Hr_8xmF8PiHdzTHYLGIsRa?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1MxzGEcFlQuweR0XHi7zuBMDuIfn00tcZ?usp=drive_link"
              }
            }
          ]
        }
      },
      2: {
        subjects: {
          term1: [
            {
              id: "probability-statistics-2-hi",
              name: "Probability and Statistics II",
              code: "02-24-00201",
              description: "Advanced statistics for healthcare research",
              creditHours: 3,
              prerequisites: ["probability-statistics-1-hi"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Cat1L5ibgjDAx3qcU8XpKuM2Sp0jIWdA",
                sections: "https://drive.google.com/drive/folders/17m-plzdlLyhkjM_TFmcYw5AZyC61yNrx",
                videos: ["https://youtube.com/playlist?list=PL7snZ0LSsq3g6KzD6pdqwU3_Do8WPY4M8&si=1ZMtkTPNNIX7q31M","https://youtube.com/playlist?list=PLtK59GunEou_TMg812_orrEE3H8UbUSta&si=zISZN1TFNbmCSoXn"],
                summaries: "",
                exams: ""
              }
            },
            {
              id: "intro-databases-hi",
              name: "Introduction to Databases",
              code: "02-24-00202",
              description: "Database systems for healthcare information management",
              creditHours: 3,
              prerequisites: ["programming-1-hi"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/10DIqel1WkLIg5YZ1qbT604vRdpVPyLZ6",
                sections: "https://drive.google.com/drive/folders/1a78X1gWfKKui7qrsGkHvwycayAssG8Le",
                videos: "https://youtube.com/playlist?list=intro-databases-hi-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "numerical-computations-hi",
              name: "Numerical Computations",
              code: "02-24-00203",
              description: "Numerical methods for healthcare modeling",
              creditHours: 3,
              prerequisites: ["linear-algebra-hi"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1YerbhXBHp9cLVhuBlsp337xKVS_01139",
                sections: "https://drive.google.com/drive/folders/1K4WIBD41wo7MP_GwXpo6yfEg-93c2wVM",
                videos: "https://youtube.com/playlist?list=numerical-computations-hi-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "intro-epidemiology",
              name: "Introduction to Epidemiology",
              code: "02-24-05201",
              description: "Epidemiological principles and disease surveillance",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=intro-epidemiology-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "anatomy-physiology",
              name: "Anatomy and Physiology",
              code: "02-24-05202",
              description: "Human anatomy and physiological systems",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=anatomy-physiology-videos",
                summaries: "",
                exams: ""
              }
            }
          ],
          term2: [
            {
              id: "cloud-computing-hi",
              name: "Cloud Computing",
              code: "02-24-00204",
              description: "Cloud platforms, services, and distributed computing concepts",
              creditHours: 3,
              prerequisites: ["data-structures-algorithms-hi"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1P37WAFRKgkokNwr6R5MZNOFEpff5dUIB?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1ny-TP92zjTZrctHIBx_QmsTfl52bSP1Q?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/11QHqhN6G_OmTNZTPdR_OVWzUZ5fEMO8X?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1ICXoWQy7-nas1_KaLNCA_fHKXEVvRqw2?usp=drive_link"
              }
            },
            {
              id: "machine-learning-hi",
              name: "Machine Learning",
              code: "02-24-00205",
              description: "Supervised and unsupervised learning algorithms and applications",
              creditHours: 3,
              prerequisites: ["intro-artificial-intelligence-hi"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1CCeA8VUvw__jCBmZ-5Y1J3ujOyir4HSr?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1hO_vvmFpCD9zw4rlK77HIIeNVWpjgM2K?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1XdboKP5n65WZCznnqiCrE0BZfiarSl4Z?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1WI08MEt_kVSuMITdlqqgPaVpTUPwiqgK?usp=drive_link"
              }
            },
            {
              id: "data-mining-analytics-hi",
              name: "Data Mining and Analytics",
              code: "02-24-00206",
              description: "Techniques for extracting knowledge from large datasets",
              creditHours: 3,
              prerequisites: ["probability-statistics-2-hi"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Ex-VAzuroLcg0fmSmg-Zd-x6KXCY7P1H?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1yRLzmfdAksXPomOZCRLQLG48sWnkQIDc?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1HRedV6Iu8Djd_f0AE0MigL8nKoq8Yb8-?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1mrKwfr3Mgi9p3zp7VdIVLmsUiPYhJYCX?usp=drive_link"
              }
            },
            {
              id: "pharmacology-chemistry-drugs",
              name: "Pharmacology and Chemistry of Drugs",
              code: "02-24-05203",
              description: "Drug mechanisms and pharmaceutical chemistry",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=pharmacology-chemistry-drugs-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "ethics-regulations-healthcare",
              name: "Ethics & Regulations in Healthcare",
              code: "02-24-05204",
              description: "Healthcare ethics and regulatory compliance",
              creditHours: 3,
              prerequisites: ["pharmacology-chemistry-drugs"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=ethics-regulations-healthcare-videos",
                summaries: "",
                exams: ""
              }
            }
          ]
        }
      },
      3: {
        subjects: {
          term1: [
            {
              id: "neuroscience-robotics",
              name: "Neuroscience and Robotics",
              code: "02-24-05301",
              description: "Neuroscience applications in medical robotics",
              creditHours: 3,
              prerequisites: ["anatomy-physiology"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=neuroscience-robotics-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "health-information-systems",
              name: "Health Information Systems",
              code: "02-24-05302",
              description: "Design and implementation of health information systems",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=health-information-systems-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "computer-assisted-drug-design",
              name: "Computer-Assisted Drug Design",
              code: "02-24-05303",
              description: "Computational methods for drug discovery and design",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=computer-assisted-drug-design-videos",
                summaries: "",
                exams: ""
              }
            }
          ],
          term2: [
            {
              id: "national-international-healthcare-systems",
              name: "National and International Healthcare Systems",
              code: "02-24-05304",
              description: "Comparative analysis of healthcare systems worldwide",
              creditHours: 3,
              prerequisites: ["intro-epidemiology"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=national-international-healthcare-systems-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "health-policy-economics",
              name: "Health Policy & Economics",
              code: "02-24-05305",
              description: "Healthcare policy analysis and health economics",
              creditHours: 3,
              prerequisites: ["intro-epidemiology"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=health-policy-economics-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "healthcare-market-analytics",
              name: "Healthcare Market Analytics",
              code: "02-24-05306",
              description: "Market analysis and analytics in healthcare industry",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=healthcare-market-analytics-videos",
                summaries: "",
                exams: ""
              }
            }
          ]
        }
      },
      4: {
        subjects: {
          term1: [
            {
              id: "e-health-telehealth-telemedicine",
              name: "E-health, Telehealth and Telemedicine",
              code: "02-24-05401",
              description: "Digital health technologies and remote healthcare delivery",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=e-health-telehealth-telemedicine-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "mathematical-modelling-health",
              name: "Mathematical Modelling for Health",
              code: "02-24-05402",
              description: "Mathematical models for healthcare and epidemiology",
              creditHours: 3,
              prerequisites: ["probability-statistics-2-hi"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=mathematical-modelling-health-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "clinical-medical-care-delivery",
              name: "Clinical & Medical Care Delivery",
              code: "02-24-05403",
              description: "Healthcare delivery systems and clinical workflows",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=clinical-medical-care-delivery-videos",
                summaries: "",
                exams: ""
              }
            }
          ],
          term2: [
            {
              id: "computerized-disease-registries",
              name: "Computerized Disease Registries",
              code: "02-24-05405",
              description: "Design and management of electronic disease registries",
              creditHours: 3,
              prerequisites: ["anatomy-physiology"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=computerized-disease-registries-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "clinical-decision-support-systems",
              name: "Clinical Decision Support Systems",
              code: "02-24-05406",
              description: "AI-powered clinical decision support and expert systems",
              creditHours: 3,
              prerequisites: ["mathematical-modelling-health"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=clinical-decision-support-systems-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "health-psychology",
              name: "Health Psychology",
              code: "02-24-05407",
              description: "Psychological factors in health and illness",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=health-psychology-videos",
                summaries: "",
                exams: ""
              }
            }
          ]
        }
      },
    }
  },
  "cybersecurity": {
    name: "Cybersecurity",
    description: "Information security, cyber defense, and digital forensics",
    levels: {
      1: {
        subjects: {
          term1: [
            {
              id: "linear-algebra-cs",
              name: "Linear Algebra",
              code: "02-24-00101",
              description: "Mathematical foundations of linear algebra for data science applications",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yFYYS37ERUHG6Ft_HnC17Jmgo-Zsrg06?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/191trjdbwAtjG6yz65q-C1Hd3gigqoti7?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLvuToPs04FnD1lFBolGr4ROQaxQ_zyC1c&si=6IWNZY0eY_ymFdAq"],
                summaries: "https://drive.google.com/drive/folders/150zP5Dc9vDKzazlm37IRttDG-_b-opK1?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1vUbUjWsbexiPgjDbJOuh-N43PVDc9hjc?usp=drive_link"
              }
            },
            {
              id: "calculus-cs",
              name: "Calculus",
              code: "02-24-00102",
              description: "Differential and integral calculus with applications in computing",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1LsWVrCXpwVsL7YhGL_QFQhyryvpc_Yon?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1U2LbrtWkf-X8DL3c7Yo12kgV8bbZ0Wb6?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1UkJQ6mJmcSb_MTbzT_8liJZTUMCOLARt?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1Uf7LaRzQyqxEbTVG0dfmWFzTxmZNHLvB?usp=drive_link"
              }
            },
            {
              id: "intro-computer-systems-cs",
              name: "Introduction to Computer Systems",
              code: "02-24-00103",
              description: "Fundamentals of computer architecture and system organization",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yQK4QiXQ7e7Ui6DLMAGYQa3aTuQp0v9O?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1q0iRgXguAaa2zZTSA9J1smnCwN2PwCAn?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLskaQRgiRMYb0SqvJ-wKx2n4Q3CB5uQ8e&si=wXANl6gRLW404zuP"],
                summaries: "https://drive.google.com/drive/folders/1RFPXNiitr2yiHr1AyCsZWuTX0rYyOwIL?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1hTVXduWW2Icy8HY-uOc5lEiUUM42RSkB?usp=drive_link"
              }
            },
            {
              id: "intro-data-sciences-cs",
              name: "Introduction to Data Sciences",
              code: "02-24-00104",
              description: "Overview of data science concepts, tools, and methodologies",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/10SsZONPzWccvjTQB4ZcHmT0j_FU8b981?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/14IwWgXRgD8G2IPJ2op1RdBIj9pgs77LJ?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLNVsyemi1cQyXLWT3vm4GbWzVxAK_4nbR&si=Q7kxeMYT4iXhr2uC"],
                summaries: "https://drive.google.com/drive/folders/13IFz-O_64Ga8y9TyFe13CSovw0xzxdUQ?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1adpsd15n6hieC29aQECkrftCHNz20U9c?usp=drive_link"
              }
            },
            {
              id: "programming-1-cs",
              name: "Programming I",
              code: "02-24-00105",
              description: "Introduction to programming concepts and problem-solving techniques",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1VDUvvvKoRcBfdCAgdO5GUa8ourGzEj43?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/14-W3wcsn8gw2ym8CnIo_L6jh0RfQW-mR?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLCInYL3l2AajYlZGzU_LVrHdoouf8W6ZN&si=_3EUjHYYQd7xAuGr","https://youtube.com/playlist?list=PL1DUmTEdeA6K7rdxKiWJq6JIxTvHalY8f&si=wl8ryBAWTyTatxTw"],
                summaries: "https://drive.google.com/drive/folders/19GRYDzueyRIB45_CJGn9Qh3_3JkIgfQH?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1wT8Ad9IGifK4NMgE71xXzLhXs4FF0wuc?usp=drive_link"
              }
            },
            {
              id: "critical-thinking-sc",
              name: "Critical Thinking",
              code: "02-00-000XX",
              description: "Development of analytical and critical thinking skills",
              creditHours: 2,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1mGHqF_BIXdX-S6BipXm942CsOvr6WHTG?usp=drive_link",
                sections: "",
                videos: ["https://youtube.com/playlist?list=PL2y4AZEEnQLmigukmMl5lD0CkewT1pBQ3&si=GijvUZQgn4vO1gdR"],
                summaries: "https://drive.google.com/drive/folders/1He5H59nOzExcoG5GYaujPWQVnKTZwD2Z?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1ZfnkRMneHYU5wYlq4738XZt1NvGlRbt6?usp=drive_link"
              }
            }
          ],
          term2: [
            {
              id: "probability-statistics-1-cs",
              name: "Probability and Statistics I",
              code: "02-24-00106",
              description: "Fundamental concepts of probability theory and statistical analysis",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/14WxYDv-3V5hBNF2FTrLEKkZpPQJjwyUb?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1yy9aqzmJsEDZasn2VT1nfzIdJoajEf6F?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PL7snZ0LSsq3g9NUio7xFDtC9IVIj649GV","https://youtube.com/playlist?list=PLXCWPoTuIpYbXgbNuQkBHlMwjK6DpnQ3l"],
                summaries: "https://drive.google.com/drive/folders/1CmL8lOIlbHdYCAhNa5cJSbDSTGEJVdMt?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1reVZYtR8aOBqpHY8PSn2vmwVwNCS_nQC?usp=drive_link"
              }
            },
            {
              id: "discrete-structures-cs",
              name: "Discrete Structures",
              code: "02-24-00107",
              description: "Mathematical structures and logic for computer science",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/12dEJoHHZhCBjBG1KiV2T92HLsGRtDIn8?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1KnWe1Ciq3ETioGCIApu89Sc3Y1FvEgIO?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PLxIvc-MGOs6gZlMVYOOEtUHJmfUquCjwz",
                summaries: "https://drive.google.com/drive/folders/1sqiDSQMkoYZCehzIgdyxZcNRSYpIkLnX?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1SgzQqrBfbam-yqOw8xOdq9SKXPlScR2k?usp=drive_link"
              }
            },
            {
              id: "data-structures-algorithms-cs",
              name: "Data Structures and Algorithms",
              code: "02-24-00108",
              description: "Fundamental data structures and algorithmic problem-solving",
              creditHours: 3,
              prerequisites: ["programming-1-cs"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1U2vmhFrPOs46SZk-rNdzE4yrCIPL5Qow?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1nr2Og9PqyiRYGl7jFJOtgZx1LGZfeHvY?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PLCInYL3l2AajqOUW_2SwjWeMwf4vL4RSp",
                summaries: "https://drive.google.com/drive/folders/1Oiki77OjApABjz0z7D3j2g-Kxc7-hN59?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1IADSkBhDhvgjpDJecfTf9VlvdoJ9P2hD?usp=drive_link"
              }
            },
            {
              id: "intro-artificial-intelligence-cs",
              name: "Introduction to Artificial Intelligence",
              code: "02-24-00109",
              description: "Basic concepts and applications of artificial intelligence",
              creditHours: 3,
              prerequisites: ["intro-computer-systems-cs"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1tp-If4eJhcAY4dIzgSieKIj3YVdSF-8m?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1HYXjZlFJL8FfAKoyhDbshpwwLVBN700R?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1RaS9fI4MaHKg_Bxs_GgyYE_LVuaG3kaJ?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1jjGy4TJ8EbON_k0hf2exQNQtQx2KR4wr?usp=drive_link"
              }
            },
            {
              id: "programming-2-cs",
              name: "Programming II",
              code: "02-24-00110",
              description: "Advanced programming concepts and software development",
              creditHours: 3,
              prerequisites: ["programming-1-cs"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1yiF9hcqLqa-wyKfEzdiWDF0bR4A_VtK2?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1geGGbmFKJYIN1yvyIskEeRyI0Y8zWhpU?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PLCInYL3l2AagY7fFlhCrjpLiIFybW3yQv","https://youtube.com/playlist?list=PL1DUmTEdeA6Icttz-O9C3RPRF8R8Px5vk"],
                summaries: "https://drive.google.com/drive/folders/1VGGZWwQmZdVD8LWI6piI_RzQqdwKq_st?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1dxwniB91RAEtAu0hKLt5cWqb3t1Q0FLI?usp=drive_link"
              }
            },
            {
              id: "innovation-entrepreneurship-cs",
              name: "Innovation & Entrepreneurship",
              code: "02-00-000XX",
              description: "Principles of innovation and entrepreneurial thinking",
              creditHours: 2,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1aEPdYTJoeTy0QhS3j1YE3GnJsjIs_8ij?usp=drive_link",
                sections: "",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1n1AWZVhnH-Hr_8xmF8PiHdzTHYLGIsRa?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1MxzGEcFlQuweR0XHi7zuBMDuIfn00tcZ?usp=drive_link"
              }
            }
          ]
        }
      },
      2: {
        subjects: {
          term1: [
            {
              id: "probability-statistics-2-cs",
              name: "Probability and Statistics II",
              code: "02-24-00201",
              description: "Advanced statistical methods and probability distributions",
              creditHours: 3,
              prerequisites: ["probability-statistics-1-cs"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Cat1L5ibgjDAx3qcU8XpKuM2Sp0jIWdA?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/17m-plzdlLyhkjM_TFmcYw5AZyC61yNrx?usp=drive_link",
                videos: ["https://youtube.com/playlist?list=PL7snZ0LSsq3g6KzD6pdqwU3_Do8WPY4M8&si=1ZMtkTPNNIX7q31M","https://youtube.com/playlist?list=PLtK59GunEou_TMg812_orrEE3H8UbUSta&si=zISZN1TFNbmCSoXn"],
                summaries: "https://drive.google.com/drive/folders/1z2c94GAfxG4TdX63ZY_rZSicvEZlrRHS?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1QRMaP_UgieJRGo5ebwvD_bIu9EMF0SYs?usp=drive_link"
              }
            },
            {
              id: "intro-databases-cs",
              name: "Introduction to Databases",
              code: "02-24-00202",
              description: "Database design, implementation, and management principles",
              creditHours: 3,
              prerequisites: ["programming-1-cs"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/10DIqel1WkLIg5YZ1qbT604vRdpVPyLZ6?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1a78X1gWfKKui7qrsGkHvwycayAssG8Le?usp=drive_link",
                videos: "https://youtube.com/playlist?list=PL37D52B7714788190&si=9Qkf5KQWLTXqYKt1",
                summaries: "https://drive.google.com/drive/folders/1vMRqmZ7ID3YIT920N6loq_yJKOQSOG65?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1luaj1L4qB2T3hTcQvwra667abVRXOx9c?usp=drive_link"
              }
            },
            {
              id: "numerical-computations-cs",
              name: "Numerical Computations",
              code: "02-24-00203",
              description: "Numerical methods and computational techniques",
              creditHours: 3,
              prerequisites: ["linear-algebra-cs"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1YerbhXBHp9cLVhuBlsp337xKVS_01139?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1K4WIBD41wo7MP_GwXpo6yfEg-93c2wVM?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1WbNyHrPMQg8aBKK3pEUvBplv7gxzsxHS?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/14RRGt31M6KSQAxypsDQ2sMI_DR939Wy5?usp=drive_link"
              }
            },
            {
              id: "intro-cybersecurity",
              name: "Introduction to Cybersecurity",
              code: "02-24-06201",
              description: "Fundamentals of cybersecurity and information security",
              creditHours: 3,
              prerequisites: [],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1czNoBYcq9PxtDGhsK0m8PkY3jCermkUJ?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1QFYrLnoJhSwmoiAATSAeFxdMGkaKTu-g?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1hyS7CmYw3pg5LuB2bGi4DDLzEYNkoopm?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/10sjQ3VXB32w3avBJQG60K-kjVT-KRbfh?usp=drive_link"
              }
            },
            {
              id: "number-theory",
              name: "Number Theory",
              code: "02-24-06202",
              description: "Number theory foundations for cryptography",
              creditHours: 3,
              prerequisites: ["linear-algebra-cs","probability-statistics-1-cs"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1kLhhrcZR_-9aZqRkt8R_heUbhjvJC2Au?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1oGBn9RtjfZQ0jHV3LIHKDN1DF8qL_NSz?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/16KrHdQcwdcP1507oSL7MIPoxZBXY9cM3?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1OjK4epFkpr0IDG94LuM7WZjrj2CZv_Kw?usp=drive_link"
              }
            }
          ],
          term2: [
            {
              id: "cloud-computing-cs",
              name: "Cloud Computing",
              code: "02-24-00204",
              description: "Cloud platforms, services, and distributed computing concepts",
              creditHours: 3,
              prerequisites: ["data-structures-algorithms-cs"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1P37WAFRKgkokNwr6R5MZNOFEpff5dUIB?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1ny-TP92zjTZrctHIBx_QmsTfl52bSP1Q?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/11QHqhN6G_OmTNZTPdR_OVWzUZ5fEMO8X?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1ICXoWQy7-nas1_KaLNCA_fHKXEVvRqw2?usp=drive_link"
              }
            },
            {
              id: "machine-learning-cs",
              name: "Machine Learning",
              code: "02-24-00205",
              description: "Supervised and unsupervised learning algorithms and applications",
              creditHours: 3,
              prerequisites: ["intro-artificial-intelligence-cs"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1CCeA8VUvw__jCBmZ-5Y1J3ujOyir4HSr?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1hO_vvmFpCD9zw4rlK77HIIeNVWpjgM2K?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1XdboKP5n65WZCznnqiCrE0BZfiarSl4Z?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1WI08MEt_kVSuMITdlqqgPaVpTUPwiqgK?usp=drive_link"
              }
            },
            {
              id: "data-mining-analytics-cs",
              name: "Data Mining and Analytics",
              code: "02-24-00206",
              description: "Techniques for extracting knowledge from large datasets",
              creditHours: 3,
              prerequisites: ["probability-statistics-2-cs"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1Ex-VAzuroLcg0fmSmg-Zd-x6KXCY7P1H?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1yRLzmfdAksXPomOZCRLQLG48sWnkQIDc?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1HRedV6Iu8Djd_f0AE0MigL8nKoq8Yb8-?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1mrKwfr3Mgi9p3zp7VdIVLmsUiPYhJYCX?usp=drive_link"
              }
            },
            {
              id: "cryptography",
              name: "Cryptography",
              code: "02-24-06203",
              description: "Cryptographic algorithms and protocols",
              creditHours: 3,
              prerequisites: ["intro-cybersecurity","number-theory"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1bIkavqwkpzhBJPskiAW9V__EXAUdmGLc?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1OajUBQFN1DTE_OoSUU4biCbVYFmp6FOF?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1JSmAexFJfF-PErax2AostO_K2GvA04ND?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/17zQOsUJRZtQiePHUQzpsgwcjb4kbZFdl?usp=drive_link"
              }
            },
            {
              id: "operating-systems-cs",
              name: "Operating Systems",
              code: "02-24-0X0XX",
              description: "Fundamentals of operating system design and implementation",
              creditHours: 3,
              prerequisites: ["intro-computer-systems-cs","programming-1-cs"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1EpjZJ58zbMRasFyPNySKmYJuG7b-Bvua?usp=drive_link",
                sections: "https://drive.google.com/drive/folders/1HYW5w49TuHYjjaQolerASZ58QYH7HH48?usp=drive_link",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/12S1na5_w3TYn6AP1xGcz4-MVK4PwuSm_?usp=drive_link",
                exams: "https://drive.google.com/drive/folders/1aS7ppq-ylQ6EAtYcndF_S5dijNKSqY25?usp=drive_link"
              }
            }
          ]
        }
      },
      3: {
        subjects: {
          term1: [
            {
              id: "computer-networks-cs",
              name: "Computer Networks",
              code: "02-24-00308",
              description: "Network protocols and network security fundamentals",
              creditHours: 3,
              prerequisites: ["intro-computer-systems-cs","programming-1-cs"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/18FIGRw3SN7D7o1c6NPNTLJ5e6g6FVkwi",
                sections: "https://drive.google.com/drive/folders/1kIPloPRLnnVbXQMv_ZXtlToA_rgKmYPo",
                videos: "https://youtube.com/playlist?list=computer-networks-cs-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "operating-systems-security",
              name: "Operating Systems Security",
              code: "02-24-06302",
              description: "Advanced operating system security mechanisms",
              creditHours: 3,
              prerequisites: ["operating-systems-cs","intro-cybersecurity"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1EpjZJ58zbMRasFyPNySKmYJuG7b-Bvua",
                sections: "https://drive.google.com/drive/folders/1HYW5w49TuHYjjaQolerASZ58QYH7HH48",
                videos: "https://youtube.com/playlist?list=operating-systems-security-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "secure-software-development",
              name: "Secure Software Development",
              code: "02-24-06303",
              description: "Secure coding practices and software security",
              creditHours: 3,
              prerequisites: ["programming-2-cs","intro-cybersecurity"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=secure-software-development-videos",
                summaries: "",
                exams: ""
              }
            }
          ],
          term2: [
            {
              id: "computer-network-security",
              name: "Computer and Network Security",
              code: "02-24-06304",
              description: "Advanced network security and intrusion detection",
              creditHours: 3,
              prerequisites: ["computer-networks-cs","cryptography"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=computer-network-security-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "data-integrity-authentication",
              name: "Data Integrity and Authentication",
              code: "02-24-06305",
              description: "Data protection and authentication mechanisms",
              creditHours: 3,
              prerequisites: ["intro-databases-cs","cryptography"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=data-integrity-authentication-videos",
                summaries: "",
                exams: ""
              }
            },
            {
              id: "information-security-management",
              name: "Information Security Management",
              code: "02-24-06306",
              description: "Security governance and risk management",
              creditHours: 3,
              prerequisites: ["intro-databases-cs","intro-cybersecurity"],
              materials: {
                lectures: "",
                sections: "",
                videos: "https://youtube.com/playlist?list=information-security-management-videos",
                summaries: "",
                exams: ""
              }
            }
          ]
        }
      },
      4: {
        subjects: {
          term1: [
            {
              id: "social-network-computing",
              name: "Social Network Computing",
              code: "02-24-06401",
              description: "Security and privacy in social networks",
              creditHours: 3,
              prerequisites: ["computer-networks-cs","cryptography"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1OLCI4tzEEYPNs-vqiTzf4yA5Z-z71if2",
                sections: "https://drive.google.com/drive/folders/1mAr6_Uv5xSXtxEXO4O4RLDyvBU_9hqje",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1ZbpLGICe_RSDfR5hyeyGTnAqWYLNs1fA",
                exams: "https://drive.google.com/drive/folders/1bN2SfAjSoydsg0pSz1a3og4f1b2ay1ME"
              }
            },
            {
              id: "security-distributed-systems",
              name: "Security of Distributed Systems",
              code: "02-24-06402",
              description: "Security challenges in distributed computing environments",
              creditHours: 3,
              prerequisites: ["operating-systems-cs","computer-networks-cs","cryptography"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1gpYYhWScuN83mjKtOnWQoPYQTl8rKJKV",
                sections: "https://drive.google.com/drive/folders/153ZuNfJzelpRgCkObImQ6TZGih1fkKUV",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1S9-fvgo-2TXAeViz8i4LGLrvMRyQ0__s",
                exams: "https://drive.google.com/drive/folders/1thJMXnTQiX3IIcyvH9WMAK-AGQz3nIti"
              }
            },
            {
              id: "human-security",
              name: "Human Security",
              code: "02-24-06403",
              description: "Human factors in cybersecurity and social engineering",
              creditHours: 3,
              prerequisites: ["intro-cybersecurity"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1y-_7pHiiuJ6af8he0osTEVxk0-Gy-RkY",
                sections: "https://drive.google.com/drive/folders/1aAP-jMw62fnKryaQyME7xt38_b-8GC28",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1rVkWpgIFVW-UkN47pQXAodAi7ZnGOx8O",
                exams: "https://drive.google.com/drive/folders/1zUkjVA5NwbYsD_miY3bw0IZ2qKsrsWev"
              }
            }
          ],
          term2: [
            {
              id: "cybersecurity-risk-management",
              name: "Cybersecurity Risk Management",
              code: "02-24-06405",
              description: "Risk assessment and management in cybersecurity",
              creditHours: 3,
              prerequisites: ["machine-learning-cs","data-mining-analytics-cs","information-security-management"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1YGc7BrSAC2M_CpIa-7gFDiNrGx7o1UCw",
                sections: "https://drive.google.com/drive/folders/1MWdLZnLNMoJsHHulOIMiBu2XRDMTfAys",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1JmvotOz8E0LEWzPrjCOyaQMj2lH0v9xt",
                exams: "https://drive.google.com/drive/folders/1Cpmk8-RwP4idQx8-CFFy_t1SysDfsTw9"
              }
            },
            {
              id: "digital-forensics",
              name: "Digital Forensics",
              code: "02-24-06406",
              description: "Digital evidence collection and forensic analysis",
              creditHours: 3,
              prerequisites: ["operating-systems-cs","computer-networks-cs"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/1vzJKO6UbGwTgNFZgKWBNSY-M51RDtbJ7",
                sections: "https://drive.google.com/drive/folders/1N8X9sHRypeFMbLY58R5JxBxBB2sSJam2",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1qoRQO4sv7PID66WxVdgxSR3Hjvyp1Z6e",
                exams: "https://drive.google.com/drive/folders/1XjIgVpuCF_cnQgVuDQVBksvQNnoPbZ7N"
              }
            },
            {
              id: "law-cybersecurity",
              name: "Law and Cybersecurity",
              code: "02-24-06407",
              description: "Legal aspects of cybersecurity and cyber law",
              creditHours: 3,
              prerequisites: ["intro-cybersecurity"],
              materials: {
                lectures: "https://drive.google.com/drive/folders/13DFQoSx7lWinrM7i4Id3VWZW1XCIAz3O",
                sections: "https://drive.google.com/drive/folders/1f2nQa6i4IaAw27OphtgUIGVgp9PlRHyN",
                videos: "",
                summaries: "https://drive.google.com/drive/folders/1PyGqpN8nhlby26YyDRsvSxbPvrwUYNID",
                exams: "https://drive.google.com/drive/folders/1bCvb2OE0qha946st-MFYI3Z9fctN4ZtV"
              }
            }
          ]
        }
      },
    }
  }
}
