// lib/electives-data.ts
import { Subject } from './department-data'

export interface ElectiveSubject extends Subject {
  category: 'faculty' | 'program'
  departmentKey: string
  termRecommended?: 1 | 2
}

/**
 * Standard 8 Faculty Elective courses common across all FCDS programs
 */
export const FACULTY_ELECTIVE_COURSES: Omit<ElectiveSubject, 'departmentKey'>[] = [
  {
    id: "software-engineering",
    name: "Software Engineering",
    code: "02-24-00301",
    description: "Software lifecycle models, requirements engineering, architectural design, testing, and agile methodologies.",
    creditHours: 3,
    prerequisites: ["Programming II"],
    category: "faculty",
    materials: {
      lectures: "https://drive.google.com/drive/folders/1GOdeH-HBvJ_ct_RCT4gMVoi4-PGpye8J",
      summaries: "https://drive.google.com/drive/folders/1_lccRyAW8-sBOpM9vPj9XxCz_kAzjQ4J",
      sections: "https://drive.google.com/drive/folders/1BG28sICVi_POn3i-1dMwLplsStImUnjh",
      exams: "https://drive.google.com/drive/folders/1LNl1Cmkn9Bafw9fMJ8k29PfYhc_d0Vv3",
      videos: [""]
    }
  },
  {
    id: "systems-analysis-design",
    name: "Systems Analysis and Design",
    code: "02-24-00302",
    description: "Methodologies for analyzing business requirements and designing robust information systems.",
    creditHours: 3,
    prerequisites: [],
    category: "faculty",
    materials: {
      lectures: "https://drive.google.com/drive/folders/12ogVgB4XNe-YzWvGl5ZKSkvkQTE_yg0o",
      summaries: "https://drive.google.com/drive/folders/1PGhA60Wgx-C6wMydA46y3XUyq6i_0ueq",
      sections: "https://drive.google.com/drive/folders/1PVlYVluCMDtHHDx-mCS48v7HTg4RPAcW",
      exams: "https://drive.google.com/drive/folders/1ncNfgjQtqLMJiXdQhlo_cbPbOZDSzBRN",
      videos: [""]
    }
  },
  {
    id: "algorithm-design",
    name: "Algorithm Design",
    code: "02-24-00303",
    description: "Advanced algorithmic techniques including greedy, divide-and-conquer, dynamic programming, and complexity analysis.",
    creditHours: 3,
    prerequisites: ["Data Structures and Algorithms"],
    category: "faculty",
    materials: {
      lectures: "https://drive.google.com/drive/folders/1TaxzWkdHgK0u1bm2YnAgpu3V_ek-e0FW",
      summaries: "https://drive.google.com/drive/folders/1Aubey6NbCmc3vz_cEg64WBRyylAfGmL_",
      sections: "https://drive.google.com/drive/folders/1n4G_l0VjXe9rD3cm2JOUC4mL83OmHoB7",
      exams: "https://drive.google.com/drive/folders/1ZkXu-YjLeBvy-ko1YMEEDs54bj-Fkxfy",
      videos: [""]
    }
  },
  {
    id: "distributed-processing",
    name: "Distributed Processing",
    code: "02-24-00304",
    description: "Concepts and architectures of distributed computing systems, synchronization, RPC, and fault tolerance.",
    creditHours: 3,
    prerequisites: ["Intro to Computer System", "Data Structures and Algorithms"],
    category: "faculty",
    materials: {
      lectures: "https://drive.google.com/drive/folders/1i1wTyiuHhlNBsYI3pUjmVKUTQCb1BUKa",
      summaries: "https://drive.google.com/drive/folders/1svZqZR_BVrhwqx4Fz9lfNH_Gbv_3Zx0R",
      sections: "https://drive.google.com/drive/folders/1vQB0XI2iW7jHxwDY6Yz4UEKOIRvwEdl-",
      exams: "https://drive.google.com/drive/folders/1cvM2PvXOIdy-LkxjdUN0iGzEXKMDBioM",
      videos: [""]
    }
  },
  {
    id: "mobile-programming",
    name: "Mobile Programming",
    code: "02-24-00305",
    description: "Development of modern mobile applications for smartphones and tablets across Android and iOS platforms.",
    creditHours: 3,
    prerequisites: ["Programming I"],
    category: "faculty",
    materials: {
      lectures: "https://drive.google.com/drive/folders/1umZUFH4K8KvJuDsIH5aoRbkysOc7PXa4",
      summaries: "https://drive.google.com/drive/folders/14fDhewdqA6HXc7qT1apmJ4UZq-NPKtvi",
      sections: "https://drive.google.com/drive/folders/1WF44fZAku_fX3QanyK5p-lufvxkZVEOu",
      exams: "https://drive.google.com/drive/folders/156afEBxqK2SfUaTArvTjaCo3R9fhHk40",
      videos: [""]
    }
  },
  {
    id: "web-programming",
    name: "Web Programming",
    code: "02-24-00306",
    description: "Full-stack web application development including client-side interactivity, server APIs, and database integration.",
    creditHours: 3,
    prerequisites: ["Programming I"],
    category: "faculty",
    materials: {
      lectures: "https://drive.google.com/drive/folders/1G3Kp4CDmmNoHQAUFh4nRG40O0-eQz4QA",
      summaries: "https://drive.google.com/drive/folders/1fFhUbWgayNPY8ZFjSuooztB3OnLHSwIA",
      sections: "https://drive.google.com/drive/folders/1-TxITJ_LAoIBDezq2xuBoSu2aT0pQpuV",
      exams: "https://drive.google.com/drive/folders/1sFlhKV0JSNHvTwNQa4WmgxFdTtBYeVnT",
      videos: [""]
    }
  },
  {
    id: "operating-systems-faculty",
    name: "Operating Systems",
    code: "02-24-00307",
    description: "Operating system principles, process scheduling, memory management, file systems, and concurrency.",
    creditHours: 3,
    prerequisites: ["Intro to Computer System", "Programming I"],
    category: "faculty",
    materials: {
      lectures: "https://drive.google.com/drive/folders/1prGZYVyW0IhNbwpk3YteCyU8U0tPdPUI",
      summaries: "https://drive.google.com/drive/folders/104t-hBK8y_zdKkn4y81zliBFdVH4JkbR",
      sections: "https://drive.google.com/drive/folders/1zwc_naH1LNxrQNlg2dk1G9NBpc49CsnO",
      exams: "https://drive.google.com/drive/folders/1wHkM2YBUVyIgWxZHY3TRgjHvrQr2vNmm",
      videos: [""]
    }
  },
  {
    id: "computer-networks",
    name: "Computer Networks",
    code: "02-24-00308",
    description: "Computer networking models (OSI and TCP/IP), network protocols, routing algorithms, and network security basics.",
    creditHours: 3,
    prerequisites: ["Intro to Computer System", "Programming I"],
    category: "faculty",
    materials: {
      lectures: "https://drive.google.com/drive/folders/18FIGRw3SN7D7o1c6NPNTLJ5e6g6FVkwi",
      summaries: "https://drive.google.com/drive/folders/1LBD6yOfgd5GMXgKdXxtvf5mJAF-n7Tce",
      sections: "https://drive.google.com/drive/folders/1kIPloPRLnnVbXQMv_ZXtlToA_rgKmYPo",
      exams: "https://drive.google.com/drive/folders/1EmLql15mCr8uA34-QXQ2Xi6iQJZKlttG",
      videos: [""]
    }
  }
]

/**
 * Specialized Program Electives per department from official bylaws
 */
export const DEPARTMENT_PROGRAM_ELECTIVES: Record<string, Omit<ElectiveSubject, 'departmentKey' | 'category'>[]> = {
  "computing-data-sciences": [
    {
      id: "convex-optimization",
      name: "Convex Optimization",
      code: "02-24-01401",
      description: "Theory and applications of convex optimization in data science, machine learning, and signal processing.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1FVxo90R8ifEIrhJ5dWEy3GLnhJ4ZNFua",
        summaries: "https://drive.google.com/drive/folders/1P0icS9Jh_Ob-5vxsNbD9-CmMLkt-YPZc",
        sections: "https://drive.google.com/drive/folders/1nz-5wZlYVOYvS7nLiOh6KZQi39OHeF_d",
        exams: "https://drive.google.com/drive/folders/1GM0LkbSr0dNRg4uyf1S5bf9sdMjOK5ml",
        videos: [""]
      }
    },
    {
      id: "combinatorial-optimization",
      name: "Non-Linear and Combinatorial Optimization",
      code: "02-24-01402",
      description: "Techniques for discrete, integer, and non-linear optimization problems.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1Pe-yFeCuMZYs6Uc7KAAZxvLWahKLWKOm",
        summaries: "https://drive.google.com/drive/folders/1cYZFP1L-2iknhIrIDwbqJ1iX_fVrUoBD",
        sections: "https://drive.google.com/drive/folders/1CZQmBauKojQiyI9W32EcxnMSth0hVT9L",
        exams: "https://drive.google.com/drive/folders/1JQlMTxRNMdjXLnBEECXcVGZF7OSqWX39",
        videos: [""]
      }
    },
    {
      id: "multivariate-statistical-analysis",
      name: "Multivariate Statistical Analysis",
      code: "02-24-01403",
      description: "Statistical methods for analyzing multidimensional data sets, PCA, factor analysis, and MANOVA.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1IDZkFI3Tzr2uCnHy3BJNzfw_nI6m2bQH",
        summaries: "https://drive.google.com/drive/folders/1ryDpNmy94nc78NTWSMG87kPqvjQhCoJd",
        sections: "https://drive.google.com/drive/folders/1K5UPpwqqJa5lGxRI1sUbyRJId9vVwztU",
        exams: "https://drive.google.com/drive/folders/1XTmOSjIgcvE5cxkOFE3Tz37Imeo208ZV",
        videos: [""]
      }
    },
    {
      id: "bayesian-statistics",
      name: "Bayesian Statistics",
      code: "02-24-01404",
      description: "Bayesian inference, Markov Chain Monte Carlo (MCMC), prior-posterior calculations, and Bayesian models.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1F5t6U38CESZXgdnKwQRjDQhBtb2Z6ESk",
        summaries: "https://drive.google.com/drive/folders/1fCqIu47sWSFJOaGX3z3H_RB9pSSf24mS",
        sections: "https://drive.google.com/drive/folders/1Gp4cRqREtZ9cVB2Wz3ZtTCJGwYThyabl",
        exams: "https://drive.google.com/drive/folders/1SqV-E_q149-zrpWatb0fGHPN9gH4j1h7",
        videos: [""]
      }
    },
    {
      id: "data-compression-techniques",
      name: "Data Compression Techniques",
      code: "02-24-01405",
      description: "Lossless and lossy data compression algorithms, entropy coding, Huffman, LZW, and transform coding.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1F6KsD40Cv3-8KQMTu4Ds1IXx8lNSMgZG",
        summaries: "https://drive.google.com/drive/folders/1g9B6tHyb8Wz_oTBPlXazNmxTUnA35_bb",
        sections: "https://drive.google.com/drive/folders/1T01RyeQgxDhQIbU9cbpIx02yY5gkrCYt",
        exams: "https://drive.google.com/drive/folders/1s8Eo0wkKyOAUzKKM2BFh9oiDiS0DmxOP",
        videos: [""]
      }
    },
    {
      id: "concurrent-algorithms",
      name: "Concurrent Algorithms and Data Structures",
      code: "02-24-01406",
      description: "Multi-threaded and lock-free data structures, synchronization primitives, and memory models.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1sC_WqAMh5kWK7OHLjtXRNcIJruPBJhwH",
        summaries: "https://drive.google.com/drive/folders/1aRZrz7cNQHlE5iOy8jS22W-DpHulQ8cr",
        sections: "https://drive.google.com/drive/folders/16GXA4Merm9NmMasTcqeG1ITNdpmVr10Y",
        exams: "https://drive.google.com/drive/folders/12p_kTvJTMBgnhmt4XkLjcKsGyg-IGCRz",
        videos: [""]
      }
    },
    {
      id: "distributed-database-systems",
      name: "Distributed Database Systems",
      code: "02-24-01407",
      description: "Architecture, query optimization, concurrency control, and replication in distributed DBMS.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1Lpey3A0pUWZOwgtQnafv_Nj5yk41PsPq",
        summaries: "https://drive.google.com/drive/folders/1lQSkybI6uJ6IN9m6T4HnpjBlq5_A9UbQ",
        sections: "https://drive.google.com/drive/folders/1Crr9Jdjo4VoPoMATuks4vnsb-w00-112",
        exams: "https://drive.google.com/drive/folders/1nyak3i230ygiTNMvf3pQQqpfU5C1NMUa",
        videos: [""]
      }
    },
    {
      id: "advanced-database-systems",
      name: "Advanced Database Systems",
      code: "02-24-01408",
      description: "NoSQL, graph databases, column-store engines, indexing, and high-performance transaction processing.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/17ze_MwFMFb2q6OaJ1bddqx9mmBy1MSqM",
        summaries: "https://drive.google.com/drive/folders/10C_0cr4m-XcNoMuPyVF6OdDNQ0f73rq5",
        sections: "https://drive.google.com/drive/folders/1Eyse8kVSNhnSDW8NqbGqZWwN_JrCiTnO",
        exams: "https://drive.google.com/drive/folders/13JYyGQwvrn_KDG2_GeJiJ491FekT4Fvd",
        videos: [""]
      }
    }
  ],

  "business-analytics": [
    {
      id: "human-computer-interaction",
      name: "Human Computer Interaction (HCI)",
      code: "02-24-02401",
      description: "User-centered design, usability testing, cognitive ergonomics, and digital interface prototyping.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1UNHepTlAlgtbCBLUzuF-nyrsnaTJyrxh",
        summaries: "https://drive.google.com/drive/folders/1zOYGIoL_XhraJgUYT9iMPM3sXJFw_15n",
        sections: "https://drive.google.com/drive/folders/1llp_xJUKzLPbfvrHog2x2-sIaFgls18r",
        exams: "https://drive.google.com/drive/folders/1N7HJerkmKAziT4-eAq8COTuFe6E3-Y3O",
        videos: [""]
      }
    },
    {
      id: "gamification-games-development",
      name: "Gamification & Games Development",
      code: "02-24-02402",
      description: "Game mechanics, behavioral design, player motivation models, and gamified business analytics.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1nOD8utZwEmmG5OhXaI2mYl4K7pUVuR_k",
        summaries: "https://drive.google.com/drive/folders/1ee87r-Vb_OckO1jzOGTUkVdeCFa0T030",
        sections: "https://drive.google.com/drive/folders/1Ifc45rgGz2P2jwSz8z-7O7Uo2Rx_aiyO",
        exams: "https://drive.google.com/drive/folders/1ulN1CuZcdGSl3w4IFIGxlQD3GUXPGsq6",
        videos: [""]
      }
    },
    {
      id: "technology-trends-innovation",
      name: "Technology Trends and Innovation",
      code: "02-24-02403",
      description: "Emerging technological paradigms, disruptive innovations, and tech adoption in modern enterprises.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1E2wmsIGblrei5LzOfoMBT-LiuKjP4hBO",
        summaries: "https://drive.google.com/drive/folders/1Vf_6FC1ayKweNVd_syoHfbhxms-7vSh9",
        sections: "https://drive.google.com/drive/folders/1Zn1d0e24Z2rB_USm8w0jafn_i7LPWnV1",
        exams: "https://drive.google.com/drive/folders/1COBezuUbJFVhFFWnwQcj6oMf-RtNd2DZ",
        videos: [""]
      }
    },
    {
      id: "gis-spatial-data-mining",
      name: "GIS and Spatial Data Mining",
      code: "02-24-02404",
      description: "Geographic Information Systems, spatial data analysis, geospatial clustering, and location intelligence.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1ySuaVEeU3FAhQ0D0NBSlfQwz1Q_GXPAE",
        summaries: "https://drive.google.com/drive/folders/1V_pk2s3ZuwnX_irWSlXahi4FKBiC7lQp",
        sections: "https://drive.google.com/drive/folders/1Ujob3o2_PhK1E93UwoApyFKqb0glG7rD",
        exams: "https://drive.google.com/drive/folders/1C8e-fiMH1WkdIQThmnbWzDV9TmDwBkaZ",
        videos: [""]
      }
    },
    {
      id: "managing-technology-projects",
      name: "Managing Technology Projects",
      code: "02-24-02405",
      description: "Project management methodologies (PMP, Agile/Scrum), resource allocation, risk and cost management.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1EK9onYfx9-d1zgeptVqTCfDx4UMEmRXq",
        summaries: "https://drive.google.com/drive/folders/1mitvL08o_44ELbEMpHgoWgzFdoq7Plxb",
        sections: "https://drive.google.com/drive/folders/1dlDbCRhqSZsJ-3Jt2SU1jsG2k2-FcZ4E",
        exams: "https://drive.google.com/drive/folders/1tBmFzJT65QXOATr_EIPCu-mtVmrFeaZt",
        videos: [""]
      }
    },
    {
      id: "smart-cities-e-government",
      name: "Smart Cities and E-Government",
      code: "02-24-02406",
      description: "Digital public services, urban IoT data ecosystems, citizen engagement, and smart infrastructure analytics.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/137bDTu8vbreI8MAcL-lHe9KabIAJMivi",
        summaries: "https://drive.google.com/drive/folders/1tbMDY0Lq24PwWRgzyLb3JknHOSnh-xRf",
        sections: "https://drive.google.com/drive/folders/18MJVCeDsVCbcBeZdD_bDSo9B9Tmuo5bI",
        exams: "https://drive.google.com/drive/folders/1wJtnkHuv-FAPH0IwNPgi3DJZ67lxMHmM",
        videos: [""]
      }
    },
    {
      id: "digital-transformation-economics",
      name: "Digital Transformation and Digital Economics",
      code: "02-24-02407",
      description: "Economic models of digital platforms, network effects, marketplace dynamics, and business transformation.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1LMz2Cdco8zbulUcWQMdJszSZSN8B57rd",
        summaries: "https://drive.google.com/drive/folders/1vLxGTILEmLdRNcMeuGOEJtd6K42-a2s3",
        sections: "https://drive.google.com/drive/folders/1H7TylB-xbadfvqeY1FG6Vk50l2xDjpeM",
        exams: "https://drive.google.com/drive/folders/1zZyncLx0KtAFC3V730O2m9k2E1pP-wjJ",
        videos: [""]
      }
    },
    {
      id: "manufacturing-analytics",
      name: "Manufacturing Analytics",
      code: "02-24-02408",
      description: "Industry 4.0, smart factory data analytics, quality control, and predictive maintenance.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1DP0Wq9iJZatccBdyAihgZOZVcTrPXcFv",
        summaries: "https://drive.google.com/drive/folders/1GXnDsGeIB0p-NtQDfD52z9ZKtpX1ae2X",
        sections: "https://drive.google.com/drive/folders/12-dNGJVovCvdcEjJ2Ad1ZresJ-CVvxWK",
        exams: "https://drive.google.com/drive/folders/1CkYXYKuqAA3MEDhZ1qss-OguwYgYicjI",
        videos: [""]
      }
    },
    {
      id: "predictive-analytics",
      name: "Predictive Analytics",
      code: "02-24-02409",
      description: "Advanced forecasting, regression, decision trees, and customer lifetime value modeling.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1CsddnCuw1O4xIDqF1-YKk2CQmmv4W1dK",
        summaries: "https://drive.google.com/drive/folders/1EDEsDGKMApiwh2fCHp--KWg47whzKbY2",
        sections: "https://drive.google.com/drive/folders/1CfWvcXvu5xCUrWhXAFzaeIlTJC3-xEQy",
        exams: "https://drive.google.com/drive/folders/1MR7R36D1CZ9tM6vQU7AlCjrkzir304V8",
        videos: [""]
      }
    },
    {
      id: "nlp-semantic-analysis",
      name: "NLP and Semantic Analysis",
      code: "02-24-02410",
      description: "Text mining, sentiment analysis, opinion mining, and topic modeling for market intelligence.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/17Zknj7Fq4MuV5X5_IrxS5azfwOIPv_ZQ",
        summaries: "https://drive.google.com/drive/folders/1cC3nNMnBYMxyz_fiNz1yOSCOL3P16yLW",
        sections: "https://drive.google.com/drive/folders/1QTRXhdRYpVTfe6539VmTKraHTjtXsarF",
        exams: "https://drive.google.com/drive/folders/14aNH1yEOx5RyYUS4a_PXV1KY4jbp3LpU",
        videos: [""]
      }
    }
  ],

  "artificial-intelligence": [
    {
      id: "speech-recognition",
      name: "Speech Recognition",
      code: "02-24-03401",
      description: "Acoustic modeling, feature extraction (MFCCs), hidden Markov models, and deep neural speech synthesis.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/18_iuy9oF1I8oX_qNNJv4nZHK2947tzPj",
        summaries: "https://drive.google.com/drive/folders/1MHOlJY3L4wfIE_p88IdCvVvmF2paBrCm",
        sections: "https://drive.google.com/drive/folders/1-JQ_ofXGd82gijBg1401xNJVvJc8lllj",
        exams: "https://drive.google.com/drive/folders/1LqHId8OtFLTv6QdCl2_7Uq9E1Qsnzpko",
        videos: [""]
      }
    },
    {
      id: "natural-language-understanding",
      name: "Natural Language Understanding",
      code: "02-24-03402",
      description: "Syntax parsing, semantic role labeling, transformer architectures, and generative language models.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1usHthbMk9OZgXS0PXGMpgtx42Fz74_FX",
        summaries: "https://drive.google.com/drive/folders/1isGg8YNXpBOTQDqulmgbgSQEIknx010m",
        sections: "https://drive.google.com/drive/folders/1T81qPd97Pi0NlaF0rMKK2gQwW6qKMsAp",
        exams: "https://drive.google.com/drive/folders/1q5vtcf67_eDqGPhpojPG_9pa-mA-iCDM",
        videos: [""]
      }
    },
    {
      id: "embedded-machine-learning",
      name: "Embedded Machine Learning",
      code: "02-24-03403",
      description: "TinyML, edge computing, model quantization, pruning, and deploying neural networks to microcontrollers.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1GBJ4mLRa0cO8pYgFPReO7ryUfCUF1kGO",
        summaries: "https://drive.google.com/drive/folders/1EwF5mEbwdCVtqqAZsXuDMcvL-WdyHo-l",
        sections: "https://drive.google.com/drive/folders/1BKWQHs7LvWVgt8dPi1eGoQUeYLmUoAyB",
        exams: "https://drive.google.com/drive/folders/1X_87785Yk8hhHPxyyDwtNpokLIx76OdA",
        videos: [""]
      }
    },
    {
      id: "intelligence-technology-trends",
      name: "Intelligence Technology Trends",
      code: "02-24-03404",
      description: "Frontier AI research, neuro-symbolic AI, multimodal architectures, and autonomous agent systems.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1uWxs8EOZb4UKPmH6QPokySW7uMFq4X7-",
        summaries: "https://drive.google.com/drive/folders/1piXj4GinQIPEEbGAqmXfl8iwiO04GE-p",
        sections: "https://drive.google.com/drive/folders/1S9Yl4BU2BcOxq_LXFw4Hh8cG_N2jf5IU",
        exams: "https://drive.google.com/drive/folders/11cxO8RtLruwEhmvEMWjCYr1bZaXysJ7L",
        videos: [""]
      }
    },
    {
      id: "internet-of-things-ii",
      name: "Internet of Things II",
      code: "02-24-03405",
      description: "Advanced IoT architectures, sensor networks, cloud-to-edge pipelines, and industrial IoT protocols.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/10qjtOdZh9co_xnqR7HGrE9peNqUNub7K",
        summaries: "https://drive.google.com/drive/folders/1sDTr1Fj-5MXQYMfhzXuvsQUoky2aToQJ",
        sections: "https://drive.google.com/drive/folders/109i4ryTDUVYAY77zCephnS0nVTsWcD5w",
        exams: "https://drive.google.com/drive/folders/14sRdOpGRuA-QB4QofE_C3_1QR75CpZaF",
        videos: [""]
      }
    },
    {
      id: "knowledge-base-ai",
      name: "Knowledge-Base AI",
      code: "02-24-03406",
      description: "Knowledge graphs, ontology engineering, reasoning engines, and expert system inference.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1e-Zy0XPO2Uxq_0Mxx4AdrNC-nBAGuJqC",
        summaries: "https://drive.google.com/drive/folders/1NMPa6pqWuJXRcaGCOeQdfCnmW93hNS5e",
        sections: "https://drive.google.com/drive/folders/1CoDKpbCLfALtyMasSiLlu6Nid3kk0OD8",
        exams: "https://drive.google.com/drive/folders/1mIMpqSoAHulkwscgiVSji6bZ9IvrKspM",
        videos: [""]
      }
    },
    {
      id: "virtual-reality-ai",
      name: "Virtual Reality",
      code: "02-24-03407",
      description: "Immersion technologies, spatial tracking, 3D graphics pipelines, and AI-driven interactive environments.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/15Oxs-i30jkhkhqK-ia-PVC9n8NXjociN",
        summaries: "https://drive.google.com/drive/folders/1126x-r97dNUE46kv5Nl7l99cSZrfsY7t",
        sections: "https://drive.google.com/drive/folders/1BjRm-wv60WK9APC6WtcK7ve4MkCImGNY",
        exams: "https://drive.google.com/drive/folders/12pX23v_oHQNTgRYGnqVlkqmWQeiYLNLd",
        videos: [""]
      }
    },
    {
      id: "game-theory",
      name: "Game Theory",
      code: "02-24-03408",
      description: "Strategic decision making, Nash equilibrium, multi-agent reinforcement learning, and mechanism design.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1EvqD1975ZxzX_OmRaiGlDyIj7kfXmjj4",
        summaries: "https://drive.google.com/drive/folders/158qItgdZd4ClF-Q7K-BeeCJb4Wjc4y6e",
        sections: "https://drive.google.com/drive/folders/1tRb39cLfVUBKtsYnGyBAIhbDsxd385NJ",
        exams: "https://drive.google.com/drive/folders/1Y7KRpL1VmJ_aEyfCJRFvP_Nz698mzucV",
        videos: [""]
      }
    }
  ],

  "cybersecurity": [
    {
      id: "ai-security-issues",
      name: "AI Security Issues",
      code: "02-24-06401",
      description: "Adversarial attacks on machine learning, data poisoning, model inversion, and defense techniques.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1Ra565nm7IwPvgvYbMMRtuDs0fGwVHoxK",
        summaries: "https://drive.google.com/drive/folders/1oe1yRuvfCDAdOJzdh0Uj6Y6FIDpz9pA8",
        sections: "https://drive.google.com/drive/folders/19rzicu7FCEefjwqoVCOiF-ntfM-kzEjO",
        exams: "https://drive.google.com/drive/folders/119esT_F4aseG3fH8uClOSt7hQJ0DwTMY",
        videos: [""]
      }
    },
    {
      id: "proactive-computer-security",
      name: "Proactive Computer Security",
      code: "02-24-06402",
      description: "Threat hunting, honeypots, automated defense, vulnerability assessment, and red/blue teaming.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1BV7OJqZZpB-vAFQdU_86U4LhEIcVFfSb",
        summaries: "https://drive.google.com/drive/folders/1ZBMN9kpbFwZa3hjy__svIEyrmxEA4r3s",
        sections: "https://drive.google.com/drive/folders/1F0WVMvRWWPdIUiNepBYi0Z6Gt6gFFOSd",
        exams: "https://drive.google.com/drive/folders/1FVBCSHBE7K2OZotQYv_CVA46Qy8LCb9A",
        videos: [""]
      }
    },
    {
      id: "software-security-engineering",
      name: "Software Security Engineering",
      code: "02-24-06403",
      description: "Secure software development lifecycle (SSDLC), static/dynamic analysis, buffer overflows, and fuzzing.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1ixq032wHBa-GuewjGhDPk8qeUzV1UZwL",
        summaries: "https://drive.google.com/drive/folders/1JN1sPNh8tVnqfkqH6ChkWCCSqJUAcEY1",
        sections: "https://drive.google.com/drive/folders/1Eyh8CVqGWOwZtLgVqn9J9ZRJIMyJgzI2",
        exams: "https://drive.google.com/drive/folders/18AAc_IFkbufI2ASb1CCyEfekF_KtbD6M",
        videos: [""]
      }
    },
    {
      id: "blockchain-security",
      name: "Blockchain & Security of Blockchain",
      code: "02-24-06404",
      description: "Cryptographic consensus, smart contract vulnerabilities, decentralized ledger audit, and zero-knowledge proofs.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1kqdzfungVSL-B__Kjmc_9XPuNuyCFkVF",
        summaries: "https://drive.google.com/drive/folders/1Levptc-JFQwZ6LcEu-gGhk4mrokPAjbS",
        sections: "https://drive.google.com/drive/folders/13hHnAMgDmJXnqTvR-uqUYhjBQ-9bt-Mc",
        exams: "https://drive.google.com/drive/folders/1Vf4fZn4dVJQirJZ3ScASg_OMxPH2CGrX",
        videos: [""]
      }
    },
    {
      id: "cloud-computing-security",
      name: "Cloud Computing Security",
      code: "02-24-06405",
      description: "Cloud architecture security, IAM, serverless security, multi-tenancy isolation, and compliance.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1p7OJpiU1nE5n7G5monPWyy3EqInS9kTQ",
        summaries: "https://drive.google.com/drive/folders/1DDxx78-I2ozwL2fv4fDVWHpB92Zok6z-",
        sections: "https://drive.google.com/drive/folders/18synsRlDPotPoIzjH-zc2wMVmm9bAXtD",
        exams: "https://drive.google.com/drive/folders/1wM_txvsE8lJIY5cCFdXK94uDs-GeWiQY",
        videos: [""]
      }
    },
    {
      id: "social-networks-analytics-security",
      name: "Social Networks Analytics",
      code: "02-24-06406",
      description: "Graph mining, bot detection, misinformation spread analysis, and identity privacy.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1w1tHJCH-i6x3Xxe_aLkJ0Wzwp2QMKaNF",
        summaries: "https://drive.google.com/drive/folders/1JU9qflvBbQBJqgNRurQRALGHPNO1WmsR",
        sections: "https://drive.google.com/drive/folders/19v7EsQnVG8N0xhKcPivLZ-KPPFfPAP6N",
        exams: "https://drive.google.com/drive/folders/16J_RB19RBJpA4Cn33EhpQRJ1zVVpjJBe",
        videos: [""]
      }
    },
    {
      id: "iot-security",
      name: "Internet of Things",
      code: "02-24-06407",
      description: "IoT firmware security, communication protocol vulnerabilities (Zigbee, MQTT), and hardware attacks.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1QWDBpl5KCbXjlmzR1fPfN1T5DRIczMFM",
        summaries: "https://drive.google.com/drive/folders/1ckdk9suy--Jonbnlvo89J2ZV5NWBccsC",
        sections: "https://drive.google.com/drive/folders/10evPVCJ8nsllOvCSdTbQe9G6xbwnedLm",
        exams: "https://drive.google.com/drive/folders/1JiPS3VrDW-4Xa1Vcu-4HcgFxlyTmOeRG",
        videos: [""]
      }
    },
    {
      id: "mobile-computing-security",
      name: "Mobile Computing",
      code: "02-24-06408",
      description: "Mobile OS security architectures, sandboxing, app permissions, and mobile network security.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1koAyzrz6LlkGvo7LpyvHF3fM5B5Gi3Lf",
        summaries: "https://drive.google.com/drive/folders/1FeSQ8Fpb6p1sY_QdzoHjNN9HRHKhmYeQ",
        sections: "https://drive.google.com/drive/folders/1HuavWjV80PlM9iq4XkSX3pC38b7B92GC",
        exams: "https://drive.google.com/drive/folders/1ltXSlbvMalOR4YVTxmiDVI_gzEODpUIt",
        videos: [""]
      }
    }
  ],

  "media-analytics": [
    {
      id: "interactive-media",
      name: "Interactive Media",
      code: "02-24-04401",
      description: "Interactive narrative, user experience design, tangible interfaces, and multi-sensory computing.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/13aAuxsQ55EhzXqIqUsN7u2C2RmlNYzj6",
        summaries: "https://drive.google.com/drive/folders/1anxTQ4tjbqphcUEhQep-_X-4Vp28hI3_",
        sections: "https://drive.google.com/drive/folders/1PmN9T4zxuFhQFWNmcQA5HFOKKqdLV3S0",
        exams: "https://drive.google.com/drive/folders/1B48ISCGKGRn41TIXquWSuPf9gvCiyneZ",
        videos: [""]
      }
    },
    {
      id: "online-journalism",
      name: "Online Journalism",
      code: "02-24-04402",
      description: "Data-driven journalism, automated newsroom workflows, verification tools, and content analytics.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1ofrOKC2FObq0hj8ivdAfDP87X6D7IEGv",
        summaries: "https://drive.google.com/drive/folders/1eNevIlcPcuuMwl7HyJCXRqGS6Qd6MsmP",
        sections: "https://drive.google.com/drive/folders/1LtQ5KfwEx3fHCso87v5CQYFTV9WAuKdy",
        exams: "https://drive.google.com/drive/folders/13wPYKM_qP3wFsqzv9mgu1xGf12bestEt",
        videos: [""]
      }
    },
    {
      id: "computational-photography",
      name: "Computational Photography",
      code: "02-24-04403",
      description: "Digital image formation, high dynamic range (HDR), depth estimation, and neural rendering.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1Xhyv9rkBB66gG4RGN3uhsW6ys8b3wVRR",
        summaries: "https://drive.google.com/drive/folders/1f6LrkZy7KJJq8STeENYMdWsxIVZ3kJb4",
        sections: "https://drive.google.com/drive/folders/1pbhhjiLoW4dxCa87M6I_GtG02V6czob5",
        exams: "https://drive.google.com/drive/folders/1SGiX0ntuHPmMPehHjyPjjGhuFGWMoNas",
        videos: [""]
      }
    },
    {
      id: "computer-animations",
      name: "Computer Animations",
      code: "02-24-04404",
      description: "Keyframing, kinematic rigging, motion capture processing, particle physics, and 3D simulation.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/13S1PQ1jA1shf6h35nZD9EOeGAAery-YI",
        summaries: "https://drive.google.com/drive/folders/1jU1WeeKX14TMuhjn9foaE2pEe1MXN561",
        sections: "https://drive.google.com/drive/folders/1ORT6wYNR18EV2xTO9rIrYRUtDMX4_ad6",
        exams: "https://drive.google.com/drive/folders/1FHwWmSG1SsNe9eBJ7mLbGpw_7sTBJ0gx",
        videos: [""]
      }
    },
    {
      id: "game-design-programming",
      name: "Video Game Design & Programming",
      code: "02-24-04405",
      description: "Game engine architecture, physics simulation, shader programming, and procedural content generation.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/1UpxbqvqSA8pbv2JghNUez-FREZ3-QBF0",
        summaries: "https://drive.google.com/drive/folders/1_eACrFRRM_iXd3lrO1SCTfPQ2XqF0czQ",
        sections: "https://drive.google.com/drive/folders/1tevUSMjCmEu0XjBEn52lYBh44mgSQV6J",
        exams: "https://drive.google.com/drive/folders/1m5bAhfCz1jVDvoK_ZmOREK14M9uL6LRV",
        videos: [""]
      }
    },
    {
      id: "virtual-reality-media",
      name: "Virtual Reality",
      code: "02-24-04406",
      description: "Immersive media production, 360 video, spatial audio, and virtual cinematography.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/15Oxs-i30jkhkhqK-ia-PVC9n8NXjociN",
        summaries: "https://drive.google.com/drive/folders/1126x-r97dNUE46kv5Nl7l99cSZrfsY7t",
        sections: "https://drive.google.com/drive/folders/1BjRm-wv60WK9APC6WtcK7ve4MkCImGNY",
        exams: "https://drive.google.com/drive/folders/12pX23v_oHQNTgRYGnqVlkqmWQeiYLNLd",
        videos: [""]
      }
    },
    {
      id: "digital-media-forensics",
      name: "Digital Media Forensics",
      code: "02-24-04407",
      description: "Deepfake detection, image and video tampering analysis, watermarking, and provenance verification.",
      creditHours: 3,
      materials: {
        lectures: "https://drive.google.com/drive/folders/11S8IbHZhRj69IxbRRm1asWPFY-QF_Qfo",
        summaries: "https://drive.google.com/drive/folders/1a_cmGZnmp6gHSbmllU0JrHkEa_xec7fa",
        sections: "https://drive.google.com/drive/folders/1XfpfdVPL4VisjFoXOzAMUc6zuh1Xt-3F",
        exams: "https://drive.google.com/drive/folders/1pD_1OuX4f39nwCY9KD3-k8LqGn8dZPXR",
        videos: [""]
      }
    }
  ],

  "healthcare-informatics": [
    {
      id: "radiation-physics",
      name: "Radiation Physics",
      code: "02-24-05401",
      description: "Physical principles of diagnostic and therapeutic radiation, imaging physics, and dosimetry.",
      creditHours: 3,
      materials: {
        lectures: "",
        summaries: "",
        sections: "",
        exams: "",
        videos: [""]
      }
    },
    {
      id: "cellular-molecular-biology",
      name: "Cellular & Molecular Biology",
      code: "02-24-05402",
      description: "Cell architecture, genetics, genomic sequencing data, and molecular informatics.",
      creditHours: 3,
      materials: {
        lectures: "",
        summaries: "",
        sections: "",
        exams: "",
        videos: [""]
      }
    },
    {
      id: "radiation-biology",
      name: "Radiation Biology",
      code: "02-24-05403",
      description: "Biological effects of ionizing radiation, radioprotection, and oncology informatics.",
      creditHours: 3,
      materials: {
        lectures: "",
        summaries: "",
        sections: "",
        exams: "",
        videos: [""]
      }
    },
    {
      id: "pathophysiology-lab-data",
      name: "Pathophysiology & Lab Data",
      code: "02-24-05404",
      description: "Mechanisms of disease states and analytical interpretation of clinical laboratory informatics.",
      creditHours: 3,
      materials: {
        lectures: "",
        summaries: "",
        sections: "",
        exams: "",
        videos: [""]
      }
    },
    {
      id: "principles-biochemistry",
      name: "Principles of Biochemistry",
      code: "02-24-05405",
      description: "Biomolecules, metabolic pathways, and biochemical data analysis in modern health informatics.",
      creditHours: 3,
      materials: {
        lectures: "",
        summaries: "",
        sections: "",
        exams: "",
        videos: [""]
      }
    }
  ]
}

/**
 * Helper to get Faculty Electives for a specific department
 */
export function getFacultyElectivesForDepartment(deptKey: string): ElectiveSubject[] {
  return FACULTY_ELECTIVE_COURSES.map(course => ({
    ...course,
    departmentKey: deptKey
  }))
}

/**
 * Helper to get Program Electives for a specific department
 */
export function getProgramElectivesForDepartment(deptKey: string): ElectiveSubject[] {
  const list = DEPARTMENT_PROGRAM_ELECTIVES[deptKey] || []
  return list.map(course => ({
    ...course,
    category: 'program',
    departmentKey: deptKey
  }))
}

/**
 * Look up any elective subject (faculty or program) across departments
 */
export function findElectiveSubject(deptKey: string, subjectId: string): ElectiveSubject | null {
  const fac = getFacultyElectivesForDepartment(deptKey)
  const foundFac = fac.find(s => s.id === subjectId)
  if (foundFac) return foundFac

  const prog = getProgramElectivesForDepartment(deptKey)
  const foundProg = prog.find(s => s.id === subjectId)
  if (foundProg) return foundProg

  return null
}
