const fs = require('fs');
const path = require('path');

// Complete verified dataset strictly from Alexandria University - Faculty of Computing and Data Sciences Bylaw (March 2019)

const dataset = {
  metadata: {
    faculty_ar: "كلية الحاسبات وعلوم البيانات",
    faculty_en: "Faculty of Computing and Data Sciences",
    university_ar: "جامعة الإسكندرية",
    university_en: "Alexandria University",
    bylaw_date: "مارس 2019 (March 2019)",
    degree: "درجة البكالوريوس في الحاسبات وعلوم البيانات (Bachelor of Science in Computing and Data Sciences)",
    system: "نظام الساعات المعتمدة (Credit Hours System)",
    graduation_credit_hours: 140,
    academic_departments: [
      {
        id: 1,
        name_ar: "الحوسبة ونظم المعلومات",
        name_en: "Computing and Information Systems"
      },
      {
        id: 2,
        name_ar: "علوم وتحليلات البيانات",
        name_en: "Data Sciences and Analytics"
      }
    ],
    graduation_requirements_distribution: {
      university_requirements: {
        total_credits: 10,
        compulsory_credits: 4,
        elective_credits: 6,
        non_credit_graduation_requirements: [
          "مقرر حقوق الإنسان ومكافحة الفساد",
          "خدمة المجتمع وتنمية البيئة",
          "التربية العسكرية"
        ]
      },
      faculty_requirements: {
        total_credits: 60,
        compulsory_credits: 48,
        elective_credits: 12
      },
      program_requirements: {
        total_credits: 70,
        compulsory_credits: 58,
        field_training_credits: 4,
        elective_credits: 12
      }
    }
  },

  // متطلبات الجامعة (مادة 8)
  university_requirements: {
    compulsory_courses: [
      {
        code: "0200000XX",
        name_ar: "التفكير الناقد",
        name_en: "Critical Thinking",
        credit_hours: 2,
        lecture_hours: 2,
        practical_hours: 0,
        prerequisites: [],
        type: "University Compulsory"
      },
      {
        code: "0200000XX",
        name_ar: "الابتكار وريادة الأعمال",
        name_en: "Innovation & Entrepreneurship",
        credit_hours: 2,
        lecture_hours: 2,
        practical_hours: 0,
        prerequisites: [],
        type: "University Compulsory"
      }
    ],
    non_credit_requirements: [
      {
        name_ar: "حقوق الإنسان ومكافحة الفساد",
        name_en: "Human Rights and Combating Corruption",
        credit_hours: 0,
        prerequisites: [],
        note: "متطلب تخرج وال تحتسب ساعاته ضمن الساعات المعتمدة اللازمة للتخرج"
      },
      {
        name_ar: "خدمة المجتمع وتنمية البيئة",
        name_en: "Community Service and Environmental Development",
        credit_hours: 0,
        prerequisites: [],
        note: "متطلب تخرج وال تحتسب ساعاته ضمن الساعات المعتمدة اللازمة للتخرج"
      },
      {
        name_ar: "التربية العسكرية",
        name_en: "Military Education",
        credit_hours: 0,
        prerequisites: [],
        note: "متطلب تخرج للطلاب الذكور المصريين ولا تحتسب ساعاته"
      }
    ],
    electives_rule: "3 مقررات بواقع 6 ساعات معتمدة (كل مقرر 2 ساعة معتمدة) يختارها الطالب من قائمة المقررات التي تطرحها كليات الجامعة وترتقي بفكر وثقافة الطالب، ويرمز لها في الجداول بـ 02-0X-000XX"
  },

  // مادة (30): متطلبات الكلية الإجبارية (16 مقرر - 48 ساعة معتمدة)
  faculty_compulsory_courses: [
    {
      code: "02-24-00101",
      name_en: "Linear Algebra",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: [],
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00102",
      name_en: "Calculus",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: [],
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00103",
      name_en: "Introduction to Computer Systems",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: [],
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00104",
      name_en: "Introduction to Data Sciences",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: [],
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00105",
      name_en: "Programming I",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: [],
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00106",
      name_en: "Probability and Statistics I",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: [],
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00107",
      name_en: "Discrete Structures",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: [],
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00108",
      name_en: "Data Structures and Algorithms",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00105"],
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00109",
      name_en: "Introduction to Artificial Intelligence",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00103"],
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00110",
      name_en: "Programming II",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00105"],
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00201",
      name_en: "Probability and Statistics II",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00106"],
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00202",
      name_en: "Introduction to Databases",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00105"],
      prerequisites_bylaw_notes: "Listed as 02-24-00105 in Article 30 and all study plans; listed as 02-24-00108 in course specification content p. 39",
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00203",
      name_en: "Numerical Computations",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00101"],
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00204",
      name_en: "Cloud Computing",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00108"],
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00205",
      name_en: "Machine Learning",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00109"],
      category: "Faculty Compulsory"
    },
    {
      code: "02-24-00206",
      name_en: "Data Mining and Analytics",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00201"],
      category: "Faculty Compulsory"
    }
  ],

  // مادة (31): متطلبات الكلية الاختيارية (4 مقررات - 12 ساعة معتمدة)
  faculty_elective_courses: [
    {
      code: "02-24-00301",
      name_en: "Software Engineering",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00110"],
      category: "Faculty Elective"
    },
    {
      code: "02-24-00302",
      name_en: "Systems Analysis and Design",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: [],
      category: "Faculty Elective"
    },
    {
      code: "02-24-00303",
      name_en: "Algorithm Design",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00108"],
      category: "Faculty Elective"
    },
    {
      code: "02-24-00304",
      name_en: "Distributed Processing",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00103", "02-24-00108"],
      category: "Faculty Elective"
    },
    {
      code: "02-24-00305",
      name_en: "Mobile Programming",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00105"],
      category: "Faculty Elective"
    },
    {
      code: "02-24-00306",
      name_en: "Web Programming",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00105"],
      category: "Faculty Elective"
    },
    {
      code: "02-24-00307",
      name_en: "Operating Systems",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00103", "02-24-00105"],
      category: "Faculty Elective"
    },
    {
      code: "02-24-00308",
      name_en: "Computer Networks",
      credit_hours: 3,
      lecture_hours: 2,
      practical_hours: 1,
      prerequisites: ["02-24-00103", "02-24-00105"],
      prerequisites_bylaw_notes: "Listed as 02-24-00103, 02-24-00105 in Article 31 table and Cybersecurity plan; printed as 02-24-00103, 02-24-00605 in content p. 41/64 (misprint for 00105)",
      category: "Faculty Elective"
    }
  ],

  // البرامج الدراسية (الستة برامج)
  programs: [
    {
      program_code: "01",
      program_name_ar: "الحوسبة وعلوم البيانات",
      program_name_en: "Computing and Data Sciences",
      type: "عام (General)",
      study_plan: {
        level_1: {
          semester_1: {
            credits: 17,
            courses: [
              { code: "02-24-00101", name_en: "Linear Algebra", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00102", name_en: "Calculus", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00103", name_en: "Introduction to Computer Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00104", name_en: "Introduction to Data Sciences", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00105", name_en: "Programming I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "0200000XX", name_en: "Critical Thinking", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_2: {
            credits: 17,
            courses: [
              { code: "02-24-00106", name_en: "Probability and Statistics I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00107", name_en: "Discrete Structures", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00108", name_en: "Data Structures and Algorithms", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-24-00109", name_en: "Introduction to Artificial Intelligence", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00103"] },
              { code: "02-24-00110", name_en: "Programming II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "0200000XX", name_en: "Innovation & Entrepreneurship", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          }
        },
        level_2: {
          semester_3: {
            credits: 17,
            courses: [
              { code: "02-24-00201", name_en: "Probability and Statistics II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00106"] },
              { code: "02-24-00202", name_en: "Introduction to Databases", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-24-00203", name_en: "Numerical Computations", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00101"] },
              { code: "02-24-01201", name_en: "Advanced Calculus", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00102"] },
              { code: "02-24-01202", name_en: "Data Science Methodology", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00104"] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_4: {
            credits: 17,
            courses: [
              { code: "02-24-00204", name_en: "Cloud Computing", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00108"] },
              { code: "02-24-00205", name_en: "Machine Learning", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00109"] },
              { code: "02-24-00206", name_en: "Data Mining and Analytics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00201"] },
              { code: "02-24-01203", name_en: "Data Science Tools and Software", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105", "02-24-00201", "02-24-01202"] },
              { code: "02-24-01204", name_en: "Regression Analysis", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00201"] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          summer_semester: {
            credits: 2,
            courses: [
              { code: "02-24-01205", name_en: "Field Training I", credit_hours: 2, lecture_hours: 0, practical_hours: 4, prerequisites: [] }
            ]
          }
        },
        level_3: {
          semester_5: {
            credits: 17,
            courses: [
              { code: "02-24-01301", name_en: "Stochastic Processes", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00101", "02-24-00201"] },
              { code: "02-24-01302", name_en: "Design and Analysis of Experiments", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00201"] },
              { code: "02-24-01303", name_en: "Data Visualization Tools", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-01202", "02-24-01203"] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_6: {
            credits: 15,
            courses: [
              { code: "02-24-01304", name_en: "Data Computation and Analysis", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00205", "02-24-00206"] },
              { code: "02-24-01305", name_en: "Survey Methodology", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00201"] },
              { code: "02-24-01306", name_en: "Computing Intensive Statistical Methods", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00201"] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          },
          summer_semester: {
            credits: 2,
            courses: [
              { code: "02-24-01307", name_en: "Field Training II", credit_hours: 2, lecture_hours: 0, practical_hours: 4, prerequisites: [] }
            ]
          }
        },
        level_4: {
          semester_7: {
            credits: 18,
            courses: [
              { code: "02-24-01401", name_en: "Big Data Analytics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105", "02-24-00205", "02-24-00206"] },
              { code: "02-24-01402", name_en: "Introduction to Social Networks", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00201"] },
              { code: "02-24-01403", name_en: "Simulations", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105", "02-24-00106"] },
              { code: "02-24-01404", name_en: "Project I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-014XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-014XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ],
            notes_from_bylaw_table: "Table on p. 20 includes an additional row for University Elective 02-0X-000XX (2 Cr), but semester header indicates 18 Credits."
          },
          semester_8: {
            credits: 18,
            courses: [
              { code: "02-24-01405", name_en: "Social Data Analytics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00101", "02-24-00201", "02-24-00205", "02-24-01402"] },
              { code: "02-24-01406", name_en: "Distributed Data Analysis", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00202", "02-24-00204", "02-24-00206"] },
              { 
                code: "02-24-01407", 
                name_en: "Stream Processing", 
                credit_hours: 3, 
                lecture_hours: 2, 
                practical_hours: 1, 
                prerequisites: ["02-24-00108", "02-24-00206"],
                prerequisites_bylaw_notes: "Table on p. 20 specifies [02-24-00108, 02-24-00206]; Course content section on p. 44 specifies [02-24-00101, 02-24-00105, 02-24-01201]"
              },
              { code: "02-24-01408", name_en: "Project II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-014XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-014XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ],
            notes_from_bylaw_table: "Table on p. 20 includes an additional row for University Elective 02-0X-000XX (2 Cr), but semester header indicates 18 Credits."
          }
        }
      },
      // مادة (33): المقررات الاختيارية للبرنامج
      program_electives: [
        {
          code: "02-24-01409",
          name_en: "Convex Optimization",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00101", "02-24-00203", "02-24-01201"]
        },
        {
          code: "02-24-01410",
          name_en: "Non-Linear and Combinatorial Optimization",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00101", "02-24-00108"]
        },
        {
          code: "02-24-01411",
          name_en: "Multivariate Statistical Analysis",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00201"]
        },
        {
          code: "02-24-01412",
          name_en: "Bayesian Statistics",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00201"]
        },
        {
          code: "02-24-01413",
          name_en: "Data Compression Techniques",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00108"]
        },
        {
          code: "02-24-01414",
          name_en: "Concurrent Algorithms and Data Structures",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00108"]
        },
        {
          code: "02-24-01415",
          name_en: "Distributed Database Systems",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00202"]
        },
        {
          code: "02-24-01416",
          name_en: "Advanced Database Systems",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00202"]
        }
      ]
    },

    {
      program_code: "02",
      program_name_ar: "تحليلات الأعمال",
      program_name_en: "Business Analytics",
      type: "متخصص (Specialized)",
      study_plan: {
        level_1: {
          semester_1: {
            credits: 17,
            courses: [
              { code: "02-24-00101", name_en: "Linear Algebra", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00102", name_en: "Calculus", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00103", name_en: "Introduction to Computer Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00104", name_en: "Introduction to Data Sciences", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00105", name_en: "Programming I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-00-000XX", name_en: "Critical Thinking", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_2: {
            credits: 17,
            courses: [
              { code: "02-24-00106", name_en: "Probability and Statistics I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00107", name_en: "Discrete Structures", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00108", name_en: "Data Structures and Algorithms", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-24-00109", name_en: "Introduction to Artificial Intelligence", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00103"] },
              { code: "02-24-00110", name_en: "Programming II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-00-000XX", name_en: "Innovation & Entrepreneurship", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          }
        },
        level_2: {
          semester_3: {
            credits: 17,
            courses: [
              { code: "02-24-00201", name_en: "Probability and Statistics II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00106"] },
              { code: "02-24-00202", name_en: "Introduction to Databases", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-24-00203", name_en: "Numerical Computations", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00101"] },
              { code: "02-24-02201", name_en: "Introduction to Business", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-02202", name_en: "Accounting as an Information Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_4: {
            credits: 17,
            courses: [
              { code: "02-24-00204", name_en: "Cloud Computing", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00108"] },
              { code: "02-24-00205", name_en: "Machine Learning", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00109"] },
              { code: "02-24-00206", name_en: "Data Mining and Analytics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00201"] },
              { code: "02-24-02203", name_en: "System Analysis & Design", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00202"] },
              { code: "02-24-02204", name_en: "Financial Planning and Analysis", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-02201"] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          summer_semester: {
            credits: 2,
            courses: [
              { code: "02-24-02205", name_en: "Field Training I", credit_hours: 2, lecture_hours: 0, practical_hours: 4, prerequisites: [] }
            ]
          }
        },
        level_3: {
          semester_5: {
            credits: 17,
            courses: [
              { code: "02-24-02301", name_en: "Business Process Modeling and Integration", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-02203"] },
              { code: "02-24-02302", name_en: "Quantitative Analysis", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00102"] },
              { code: "02-24-02303", name_en: "Data Warehousing & Business Intelligence", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00202"] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_6: {
            credits: 15,
            courses: [
              { code: "02-24-02304", name_en: "Data Visualization", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00202"] },
              { code: "02-24-02305", name_en: "Enterprise Information Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-02301"] },
              { code: "02-24-02306", name_en: "Data Driven Marketing", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00206"] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          },
          summer_semester: {
            credits: 2,
            courses: [
              { code: "02-24-02307", name_en: "Field Training II", credit_hours: 2, lecture_hours: 0, practical_hours: 4, prerequisites: [] }
            ]
          }
        },
        level_4: {
          semester_7: {
            credits: 18,
            courses: [
              { code: "02-24-02401", name_en: "Leadership and People Analytics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00206"] },
              { code: "02-24-02402", name_en: "Data and IT Governance", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-02201"] },
              { code: "02-24-02403", name_en: "Information Retrieval", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00108"] },
              { code: "02-24-02404", name_en: "Project I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-024XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-024XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          },
          semester_8: {
            credits: 18,
            courses: [
              { code: "02-24-02405", name_en: "Text and Social Media Mining", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00206"] },
              { code: "02-24-02406", name_en: "Logistics and Supply Chain Analytics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00206"] },
              { code: "02-24-02407", name_en: "Information Technology Laws and Ethics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-02408", name_en: "Project II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-02404"] },
              { code: "02-24-024XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-024XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          }
        }
      },
      // مادة (35): المقررات الاختيارية للبرنامج
      program_electives: [
        {
          code: "02-24-02409",
          name_en: "Human Computer Interaction",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-02203"]
        },
        {
          code: "02-24-02410",
          name_en: "Gamification and Games Development",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00110"]
        },
        {
          code: "02-24-02411",
          name_en: "Technology Trends and Innovation",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: []
        },
        {
          code: "02-24-02412",
          name_en: "GIS and Spatial Data Mining",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00206"]
        },
        {
          code: "02-24-02413",
          name_en: "Managing Technology Projects",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: []
        },
        {
          code: "02-24-02414",
          name_en: "Smart Cities and E-Government",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-02402"]
        },
        {
          code: "02-24-02415",
          name_en: "Digital Transformation and Digital Economics",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-02402"]
        },
        {
          code: "02-24-02416",
          name_en: "Manufacturing Analytics",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00206"]
        },
        {
          code: "02-24-02417",
          name_en: "Predictive Analytics",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00206", "02-24-02204"]
        },
        {
          code: "02-24-02418",
          name_en: "NLP and Semantic Analysis",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-02403"]
        }
      ]
    },

    {
      program_code: "03",
      program_name_ar: "النظم الذكية",
      program_name_en: "Intelligent Systems",
      type: "متخصص (Specialized)",
      study_plan: {
        level_1: {
          semester_1: {
            credits: 17,
            courses: [
              { code: "02-24-00101", name_en: "Linear Algebra", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00102", name_en: "Calculus", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00103", name_en: "Introduction to Computer Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00104", name_en: "Introduction to Data Sciences", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00105", name_en: "Programming I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-00-000XX", name_en: "Critical Thinking", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_2: {
            credits: 17,
            courses: [
              { code: "02-24-00106", name_en: "Probability and Statistics I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00107", name_en: "Discrete Structures", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00108", name_en: "Data Structures and Algorithms", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-24-00109", name_en: "Introduction to Artificial Intelligence", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00103"] },
              { code: "02-24-00110", name_en: "Programming II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-00-000XX", name_en: "Innovation & Entrepreneurship", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          }
        },
        level_2: {
          semester_3: {
            credits: 17,
            courses: [
              { code: "02-24-00201", name_en: "Probability and Statistics II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00106"] },
              { code: "02-24-00202", name_en: "Introduction to Databases", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-24-00203", name_en: "Numerical Computations", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00101"] },
              { code: "02-24-03201", name_en: "Smart Systems and Computational Intelligence", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00109"] },
              { code: "02-24-03202", name_en: "Operations Research", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00106"] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_4: {
            credits: 17,
            courses: [
              { code: "02-24-00204", name_en: "Cloud Computing", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00108"] },
              { code: "02-24-00205", name_en: "Machine Learning", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00109"] },
              { code: "02-24-00206", name_en: "Data Mining and Analytics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00201"] },
              { code: "02-24-03203", name_en: "Pattern Recognition", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00101", "02-24-00106"] },
              { code: "02-24-03204", name_en: "Neural Networks", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00109"] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          summer_semester: {
            credits: 2,
            courses: [
              { code: "02-24-03205", name_en: "Field Training I", credit_hours: 2, lecture_hours: 0, practical_hours: 4, prerequisites: [] }
            ]
          }
        },
        level_3: {
          semester_5: {
            credits: 17,
            courses: [
              { 
                code: "02-24-03301", 
                name_en: "Intelligent Programming", 
                credit_hours: 3, 
                lecture_hours: 2, 
                practical_hours: 1, 
                prerequisites: ["02-24-00105"],
                prerequisites_bylaw_notes: "Listed as 02-24-00105 in study plan table p. 26; listed as 02-24-00109 in course content p. 51"
              },
              { code: "02-24-03302", name_en: "Deep Learning", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-03204"] },
              { code: "02-24-03303", name_en: "Modern Control Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00101"] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_6: {
            credits: 15,
            courses: [
              { code: "02-24-03304", name_en: "Embedded Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-03303"] },
              { code: "02-24-03305", name_en: "Computer Vision", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00109"] },
              { code: "02-24-03306", name_en: "AI Security Issues", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00109"] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          },
          summer_semester: {
            credits: 2,
            courses: [
              { code: "02-24-03307", name_en: "Field Training II", credit_hours: 2, lecture_hours: 0, practical_hours: 4, prerequisites: [] }
            ]
          }
        },
        level_4: {
          semester_7: {
            credits: 18,
            courses: [
              { code: "02-24-03401", name_en: "AI Platforms", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00109"] },
              { code: "02-24-03402", name_en: "Internet of Things I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-03304"] },
              { code: "02-24-03403", name_en: "Natural Language Processing", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00205"] },
              { code: "02-24-03404", name_en: "Project I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-034XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-034XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          },
          semester_8: {
            credits: 18,
            courses: [
              { code: "02-24-03405", name_en: "Reinforcement Learning", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-03202"] },
              { code: "02-24-03406", name_en: "AI for Robotics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-03304"] },
              { code: "02-24-03407", name_en: "Visual Recognition", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-03305"] },
              { code: "02-24-03408", name_en: "Project II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-034XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-034XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          }
        }
      },
      // مادة (37): المقررات الاختيارية للبرنامج
      program_electives: [
        {
          code: "02-24-03409",
          name_en: "Speech Recognition",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00204"]
        },
        {
          code: "02-24-03410",
          name_en: "Natural Language Understanding",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-03403"]
        },
        {
          code: "02-24-03411",
          name_en: "Embedded Machine Learning",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00205", "02-24-03304"]
        },
        {
          code: "02-24-03412",
          name_en: "Intelligence Technology Trends",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: []
        },
        {
          code: "02-24-03413",
          name_en: "Internet of Things II",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-03402"]
        },
        {
          code: "02-24-03414",
          name_en: "Knowledge-Base AI",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00205"]
        },
        {
          code: "02-24-03415",
          name_en: "Virtual Reality",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-04401"]
        },
        {
          code: "02-24-03416",
          name_en: "Game Theory",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-03202"]
        }
      ]
    },

    {
      program_code: "04",
      program_name_ar: "تحليلات الوسائط الإعلامية",
      program_name_en: "Media Analytics",
      type: "متخصص (Specialized)",
      study_plan: {
        level_1: {
          semester_1: {
            credits: 17,
            courses: [
              { code: "02-24-00101", name_en: "Linear Algebra", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00102", name_en: "Calculus", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00103", name_en: "Introduction to Computer Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00104", name_en: "Introduction to Data Sciences", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00105", name_en: "Programming I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-00-000XX", name_en: "Critical Thinking", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_2: {
            credits: 17,
            courses: [
              { code: "02-24-00106", name_en: "Probability and Statistics I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00107", name_en: "Discrete Structures", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00108", name_en: "Data Structures and Algorithms", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-24-00109", name_en: "Introduction to Artificial Intelligence", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00103"] },
              { code: "02-24-00110", name_en: "Programming II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-00-000XX", name_en: "Innovation & Entrepreneurship", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          }
        },
        level_2: {
          semester_3: {
            credits: 17,
            courses: [
              { code: "02-24-00201", name_en: "Probability and Statistics II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00106"] },
              { code: "02-24-00202", name_en: "Introduction to Databases", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-24-00203", name_en: "Numerical Computations", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00101"] },
              { code: "02-24-04201", name_en: "Data Driven Journalism", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-04202", name_en: "Digital Mass Communication", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_4: {
            credits: 17,
            courses: [
              { code: "02-24-00204", name_en: "Cloud Computing", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00108"] },
              { code: "02-24-00205", name_en: "Machine Learning", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00109"] },
              { code: "02-24-00206", name_en: "Data Mining and Analytics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00201"] },
              { code: "02-24-04203", name_en: "Digital Video Production", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-04204", name_en: "News Editing and Blogging", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          summer_semester: {
            credits: 2,
            courses: [
              { code: "02-24-04205", name_en: "Field Training I", credit_hours: 2, lecture_hours: 0, practical_hours: 4, prerequisites: [] }
            ]
          }
        },
        level_3: {
          semester_5: {
            credits: 17,
            courses: [
              { code: "02-24-04301", name_en: "Image Processing", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00101", "02-24-00203"] },
              { 
                code: "02-24-04302", 
                name_en: "Web Design and Search-Engine Optimization", 
                credit_hours: 3, 
                lecture_hours: 2, 
                practical_hours: 1, 
                prerequisites: ["02-24-00105"],
                prerequisites_bylaw_notes: "Listed as 02-24-00105 in study plan table p. 29; listed as 02-24-00101 in course content p. 56"
              },
              { code: "02-24-04303", name_en: "Computer Audio", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00108"] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_6: {
            credits: 15,
            courses: [
              { code: "02-24-04304", name_en: "Infographics and Data Visualization", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00108", "02-24-00203"] },
              { code: "02-24-04305", name_en: "Natural Language Processing", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00205"] },
              { code: "02-24-04306", name_en: "Media Processing", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-04301", "02-24-04303"] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          },
          summer_semester: {
            credits: 2,
            courses: [
              { code: "02-24-04307", name_en: "Field Training II", credit_hours: 2, lecture_hours: 0, practical_hours: 4, prerequisites: [] }
            ]
          }
        },
        level_4: {
          semester_7: {
            credits: 18,
            courses: [
              { code: "02-24-04401", name_en: "Computer Graphics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00108", "02-24-04304"] },
              { code: "02-24-04402", name_en: "Digital Broadcasting", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00108", "02-24-04203"] },
              { code: "02-24-04403", name_en: "Audience research and analysis", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-04404", name_en: "Project I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-044XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-044XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          },
          semester_8: {
            credits: 18,
            courses: [
              { code: "02-24-04405", name_en: "Social Media Analytics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00205", "02-24-04302"] },
              { code: "02-24-04406", name_en: "Multimedia Analytics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00205", "02-24-04306"] },
              { code: "02-24-04407", name_en: "Public opinion and E Surveys", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-04403"] },
              { code: "02-24-04408", name_en: "Project II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-044XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-044XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          }
        }
      },
      // مادة (39): المقررات الاختيارية للبرنامج
      program_electives: [
        {
          code: "02-24-04409",
          name_en: "Interactive Media",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: []
        },
        {
          code: "02-24-04410",
          name_en: "Online Journalism",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: []
        },
        {
          code: "02-24-04411",
          name_en: "Computational Photography",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-04203", "02-24-04301"]
        },
        {
          code: "02-24-04412",
          name_en: "Computer Animations",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-04401"]
        },
        {
          code: "02-24-04413",
          name_en: "Video Game Design and Programming",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00110", "02-24-04401"]
        },
        {
          code: "02-24-04414",
          name_en: "Virtual Reality",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-04401"]
        },
        {
          code: "02-24-04415",
          name_en: "Digital Media Forensics",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: []
        }
      ]
    },

    {
      program_code: "05",
      program_name_ar: "تحليلات ومعلوماتية الرعاية الصحية",
      program_name_en: "Healthcare Informatics and Data Analytics",
      type: "متخصص (Specialized)",
      study_plan: {
        level_1: {
          semester_1: {
            credits: 17,
            courses: [
              { code: "02-24-00101", name_en: "Linear Algebra", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00102", name_en: "Calculus", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00103", name_en: "Introduction to Computer Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00104", name_en: "Introduction to Data Sciences", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00105", name_en: "Programming I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-00-000XX", name_en: "Critical Thinking", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_2: {
            credits: 17,
            courses: [
              { code: "02-24-00106", name_en: "Probability and Statistics I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00107", name_en: "Discrete Structures", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00108", name_en: "Data Structures and Algorithms", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-24-00109", name_en: "Introduction to Artificial Intelligence", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00103"] },
              { code: "02-24-00110", name_en: "Programming II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-00-000XX", name_en: "Innovation & Entrepreneurship", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          }
        },
        level_2: {
          semester_3: {
            credits: 17,
            courses: [
              { code: "02-24-00201", name_en: "Probability and Statistics II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00106"] },
              { code: "02-24-00202", name_en: "Introduction to Databases", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-24-00203", name_en: "Numerical Computations", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00101"] },
              { code: "02-24-05201", name_en: "Introduction to Epidemiology", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-05202", name_en: "Anatomy and Physiology", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_4: {
            credits: 17,
            courses: [
              { code: "02-24-00204", name_en: "Cloud Computing", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00108"] },
              { code: "02-24-00205", name_en: "Machine Learning", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00109"] },
              { code: "02-24-00206", name_en: "Data Mining and Analytics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00201"] },
              { code: "02-24-05203", name_en: "Pharmacology and Chemistry of Drugs", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { 
                code: "02-24-05204", 
                name_en: "Ethics & Regulations in Healthcare", 
                credit_hours: 3, 
                lecture_hours: 2, 
                practical_hours: 1, 
                prerequisites: ["02-24-05203"],
                prerequisites_bylaw_notes: "Listed as 02-24-05203 in study plan table p. 32; listed as none in course content p. 60"
              },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          summer_semester: {
            credits: 2,
            courses: [
              { code: "02-24-05205", name_en: "Field Training I", credit_hours: 2, lecture_hours: 0, practical_hours: 4, prerequisites: [] }
            ]
          }
        },
        level_3: {
          semester_5: {
            credits: 17,
            courses: [
              { code: "02-24-05301", name_en: "Neuroscience and Robotics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-05202"] },
              { code: "02-24-05302", name_en: "Health Information Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { 
                code: "02-24-05303", 
                name_en: "Computer-Assisted Drug Design", 
                credit_hours: 3, 
                lecture_hours: 2, 
                practical_hours: 1, 
                prerequisites: [],
                prerequisites_bylaw_notes: "Listed as none/empty in study plan table p. 32; listed as 02-24-05203 in course content p. 61"
              },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_6: {
            credits: 15,
            courses: [
              { code: "02-24-05304", name_en: "National and International Healthcare Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-05201"] },
              { code: "02-24-05305", name_en: "Health Policy & Economics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-05201"] },
              { code: "02-24-05306", name_en: "Healthcare Market Analytics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          },
          summer_semester: {
            credits: 2,
            courses: [
              { code: "02-24-05307", name_en: "Field Training II", credit_hours: 2, lecture_hours: 0, practical_hours: 4, prerequisites: [] }
            ]
          }
        },
        level_4: {
          semester_7: {
            credits: 18,
            courses: [
              { code: "02-24-05401", name_en: "E-health, Telehealth and Telemedicine", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-05402", name_en: "Mathematical Modelling for Health", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00201"] },
              { code: "02-24-05403", name_en: "Clinical & Medical Care Delivery", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-05404", name_en: "Project I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-054XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-054XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          },
          semester_8: {
            credits: 18,
            courses: [
              { code: "02-24-05405", name_en: "Computerized Disease Registries", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-05202"] },
              { code: "02-24-05406", name_en: "Clinical Decision Support Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-05402"] },
              { code: "02-24-05407", name_en: "Health Psychology", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-05408", name_en: "Project II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-054XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-054XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          }
        }
      },
      // مادة (41): المقررات الاختيارية للبرنامج
      program_electives: [
        {
          code: "02-24-05409",
          name_en: "Radiation Physics",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: []
        },
        {
          code: "02-24-05410",
          name_en: "Cellular & Molecular Biology",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-05202"]
        },
        {
          code: "02-24-05411",
          name_en: "Radiation Biology",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-05401", "02-24-05402"]
        },
        {
          code: "02-24-05412",
          name_en: "Pathophysiology & Lab Data",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-05202"]
        },
        {
          code: "02-24-05413",
          name_en: "Principles of Biochemistry",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-05202"]
        }
      ]
    },

    {
      program_code: "06",
      program_name_ar: "الأمن السيبراني",
      program_name_en: "Cybersecurity",
      type: "متخصص (Specialized)",
      study_plan: {
        level_1: {
          semester_1: {
            credits: 17,
            courses: [
              { code: "02-24-00101", name_en: "Linear Algebra", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00102", name_en: "Calculus", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00103", name_en: "Introduction to Computer Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00104", name_en: "Introduction to Data Sciences", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00105", name_en: "Programming I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-00-000XX", name_en: "Critical Thinking", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_2: {
            credits: 17,
            courses: [
              { code: "02-24-00106", name_en: "Probability and Statistics I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00107", name_en: "Discrete Structures", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-00108", name_en: "Data Structures and Algorithms", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-24-00109", name_en: "Introduction to Artificial Intelligence", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00103"] },
              { code: "02-24-00110", name_en: "Programming II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-00-000XX", name_en: "Innovation & Entrepreneurship", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          }
        },
        level_2: {
          semester_3: {
            credits: 17,
            courses: [
              { code: "02-24-00201", name_en: "Probability and Statistics II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00106"] },
              { code: "02-24-00202", name_en: "Introduction to Databases", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00105"] },
              { code: "02-24-00203", name_en: "Numerical Computations", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00101"] },
              { code: "02-24-06201", name_en: "Introduction to Cybersecurity", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-06202", name_en: "Number Theory", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00101", "02-24-00106"] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_4: {
            credits: 17,
            courses: [
              { code: "02-24-00204", name_en: "Cloud Computing", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00108"] },
              { code: "02-24-00205", name_en: "Machine Learning", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00109"] },
              { code: "02-24-00206", name_en: "Data Mining and Analytics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00201"] },
              { code: "02-24-06203", name_en: "Cryptography", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-06201", "02-24-06202"] },
              { code: "02-24-00307", name_en: "Operating Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00103", "02-24-00105"] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          summer_semester: {
            credits: 2,
            courses: [
              { code: "02-24-06205", name_en: "Field Training I", credit_hours: 2, lecture_hours: 0, practical_hours: 4, prerequisites: [] }
            ]
          }
        },
        level_3: {
          semester_5: {
            credits: 17,
            courses: [
              { code: "02-24-00308", name_en: "Computer Networks", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00103", "02-24-00105"] },
              { code: "02-24-06302", name_en: "Operating Systems Security", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00307", "02-24-06201"] },
              { code: "02-24-06303", name_en: "Secure Software Development", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00110", "02-24-06201"] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-0X-000XX", name_en: "University Elective", credit_hours: 2, lecture_hours: 2, practical_hours: 0, prerequisites: [] }
            ]
          },
          semester_6: {
            credits: 15,
            courses: [
              { code: "02-24-06304", name_en: "Computer and Network Security", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00308", "02-24-06203"] },
              { code: "02-24-06305", name_en: "Data Integrity and Authentication", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00202", "02-24-06203"] },
              { code: "02-24-06306", name_en: "Information Security Management", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00202", "02-24-06201"] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-0X0XX", name_en: "Faculty Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          },
          summer_semester: {
            credits: 2,
            courses: [
              { code: "02-24-06307", name_en: "Field Training II", credit_hours: 2, lecture_hours: 0, practical_hours: 4, prerequisites: [] }
            ]
          }
        },
        level_4: {
          semester_7: {
            credits: 18,
            courses: [
              { code: "02-24-06401", name_en: "Social Network Computing", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00308", "02-24-06203"] },
              { code: "02-24-06402", name_en: "Security of Distributed Systems", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00307", "02-24-00308", "02-24-06203"] },
              { code: "02-24-06403", name_en: "Human Security", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-06201"] },
              { code: "02-24-06404", name_en: "Project I", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-064XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-064XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          },
          semester_8: {
            credits: 18,
            courses: [
              { code: "02-24-06405", name_en: "Cybersecurity Risk Management", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00205", "02-24-00206", "02-24-06306"] },
              { code: "02-24-06406", name_en: "Digital Forensics", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-00307", "02-24-00308"] },
              { code: "02-24-06407", name_en: "Law and Cybersecurity", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: ["02-24-06201"] },
              { code: "02-24-06408", name_en: "Project II", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-064XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] },
              { code: "02-24-064XX", name_en: "Program Elective", credit_hours: 3, lecture_hours: 2, practical_hours: 1, prerequisites: [] }
            ]
          }
        }
      },
      // مادة (43): المقررات الاختيارية للبرنامج
      program_electives: [
        {
          code: "02-24-06409",
          name_en: "AI Security Issues",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00109"]
        },
        {
          code: "02-24-06410",
          name_en: "Proactive Computer Security",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00110", "02-24-06201"]
        },
        {
          code: "02-24-06411",
          name_en: "Software Security Engineering",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00301", "02-24-06303"]
        },
        {
          code: "02-24-06412",
          name_en: "Blockchain and Security of Blockchain",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00202", "02-24-00308"]
        },
        {
          code: "02-24-06413",
          name_en: "Cloud Computing Security",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00204", "02-24-06203"]
        },
        {
          code: "02-24-06414",
          name_en: "Social Networks Analytics",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-06205", "02-24-00101", "02-24-00201", "02-24-06401"],
          prerequisites_bylaw_notes: "Table on p. 37 lists 02-24-06205; Course description on p. 67 lists 02-24-00205 (Machine Learning)"
        },
        {
          code: "02-24-06415",
          name_en: "Internet of Things",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00308"]
        },
        {
          code: "02-24-06416",
          name_en: "Mobile Computing",
          credit_hours: 3,
          lecture_hours: 2,
          practical_hours: 1,
          prerequisites: ["02-24-00308"]
        }
      ]
    }
  ]
};

// Also generate a unified master list of all distinct courses
const masterCourseMap = new Map();

function addCourse(c, extra) {
  if (!c.code || c.code.includes("XX")) return;
  if (!masterCourseMap.has(c.code)) {
    masterCourseMap.set(c.code, {
      code: c.code,
      name_en: c.name_en,
      credit_hours: c.credit_hours,
      lecture_hours: c.lecture_hours,
      practical_hours: c.practical_hours,
      prerequisites: c.prerequisites || [],
      ...(c.prerequisites_bylaw_notes ? { notes: c.prerequisites_bylaw_notes } : {}),
      programs: extra.program ? [extra.program] : [],
      category: extra.category || "Program Course"
    });
  } else {
    const existing = masterCourseMap.get(c.code);
    if (extra.program && !existing.programs.includes(extra.program)) {
      existing.programs.push(extra.program);
    }
  }
}

// Add faculty compulsory
dataset.faculty_compulsory_courses.forEach(c => addCourse(c, { category: "Faculty Compulsory" }));
// Add faculty elective
dataset.faculty_elective_courses.forEach(c => addCourse(c, { category: "Faculty Elective" }));

// Add each program's courses and electives
dataset.programs.forEach(prog => {
  const pName = prog.program_name_en;
  // Study plan courses
  for (const levelKey of Object.keys(prog.study_plan)) {
    const level = prog.study_plan[levelKey];
    for (const semKey of Object.keys(level)) {
      const sem = level[semKey];
      if (sem.courses) {
        sem.courses.forEach(c => addCourse(c, { program: pName, category: "Program Compulsory" }));
      }
    }
  }
  // Program electives
  prog.program_electives.forEach(c => addCourse(c, { program: pName, category: "Program Elective" }));
});

dataset.all_unique_courses = Array.from(masterCourseMap.values()).sort((a, b) => a.code.localeCompare(b.code));

// Write to files
const outputPath1 = path.join(__dirname, 'src', 'data', 'faculty_courses_bylaw.json');
const outputPath2 = path.join(__dirname, 'faculty_courses_bylaw.json');

fs.writeFileSync(outputPath1, JSON.stringify(dataset, null, 2), 'utf8');
fs.writeFileSync(outputPath2, JSON.stringify(dataset, null, 2), 'utf8');

console.log('Successfully written JSON file to:', outputPath1);
console.log('Successfully written JSON file to:', outputPath2);
console.log('Total unique courses registered:', dataset.all_unique_courses.length);
