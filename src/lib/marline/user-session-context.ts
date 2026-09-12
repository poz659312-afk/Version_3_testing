import bylawData from "../../data/faculty_courses_bylaw.json";

export interface MarlineUserSession {
  auth_id?: string;
  username?: string;
  current_level?: number | null;
  specialization?: string;
  status?: 'student' | 'graduated' | string;
  Registrations?: { lastUpdated?: string; courses?: string[] } | null;
}

export interface NormalizedDepartment {
  nameAr: string;
  nameEn: string;
  code: string;
  slug: string;
}

/**
 * Normalizes any specialization string or slug to the canonical FCDS department metadata.
 */
export function normalizeSpecialization(spec?: string): NormalizedDepartment {
  const raw = (spec || '').toLowerCase().trim();

  if (
    !raw ||
    raw === 'general' ||
    raw.includes('عام') ||
    raw.includes('حوسب') ||
    raw.includes('علوم بيانات') ||
    raw.includes('computing') ||
    raw.includes('data science') ||
    raw.includes('fcds')
  ) {
    return {
      nameAr: 'الحوسبة وعلوم البيانات (القسم العام)',
      nameEn: 'Computing and Data Sciences',
      code: '01',
      slug: 'computing-data-sciences',
    };
  }

  if (raw.includes('اعمال') || raw.includes('أعمال') || raw.includes('بيزنس') || raw.includes('business') || raw === 'ba') {
    return {
      nameAr: 'تحليلات الأعمال والبيانات (Business Analytics)',
      nameEn: 'Business Analytics',
      code: '02',
      slug: 'business-analytics',
    };
  }

  if (raw.includes('ذكاء') || raw.includes('intelligent') || raw.includes('artificial') || raw === 'ai') {
    return {
      nameAr: 'الذكاء الاصطناعي والنظم الذكية (Artificial Intelligence)',
      nameEn: 'Intelligent Systems',
      code: '03',
      slug: 'artificial-intelligence',
    };
  }

  if (raw.includes('وسائط') || raw.includes('ميديا') || raw.includes('media') || raw === 'ma') {
    return {
      nameAr: 'تحليلات الوسائط والإعلام الرقمي (Media Analytics)',
      nameEn: 'Media Analytics',
      code: '04',
      slug: 'media-analytics',
    };
  }

  if (raw.includes('صحي') || raw.includes('رعاية') || raw.includes('health') || raw === 'hi') {
    return {
      nameAr: 'المعلوماتية والرعاية الصحية (Healthcare Informatics)',
      nameEn: 'Healthcare Informatics and Data Analytics',
      code: '05',
      slug: 'healthcare-informatics',
    };
  }

  if (raw.includes('سيبران') || raw.includes('سايبر') || raw.includes('cyber') || raw === 'cs') {
    return {
      nameAr: 'الأمن السيبراني والتحري الرقمي (Cybersecurity)',
      nameEn: 'Cybersecurity',
      code: '06',
      slug: 'cybersecurity',
    };
  }

  return {
    nameAr: spec || 'الحوسبة وعلوم البيانات (القسم العام)',
    nameEn: spec || 'Computing and Data Sciences',
    code: '01',
    slug: 'computing-data-sciences',
  };
}

/**
 * Formats student level into official Arabic FCDS nomenclature.
 */
export function formatLevelArabic(level?: number | null, status?: string): { levelText: string; isGraduated: boolean } {
  if (status === 'graduated' || level === null || level === undefined) {
    return {
      levelText: 'خريج من الكلية (أتم متطلبات التخرج ونال درجة البكالوريوس)',
      isGraduated: true,
    };
  }

  switch (level) {
    case 1:
      return { levelText: 'المستوى الأول (الفرقة الأولى / سنة أولى)', isGraduated: false };
    case 2:
      return { levelText: 'المستوى الثاني (الفرقة الثانية / سنة تانية)', isGraduated: false };
    case 3:
      return { levelText: 'المستوى الثالث (الفرقة الثالثة / سنة تالتة)', isGraduated: false };
    case 4:
      return { levelText: 'المستوى الرابع (الفرقة الرابعة / سنة رابعة - مرحلة التخرج)', isGraduated: false };
    default:
      return { levelText: `المستوى ${level}`, isGraduated: false };
  }
}

/**
 * Retrieves official curriculum courses for student's specific level and department.
 */
export function getStudentCoursesForLevel(level: number | null | undefined, specialization: string): string | null {
  if (!level || level < 1 || level > 4) return null;

  const dept = normalizeSpecialization(specialization);

  // Level 1: Common faculty compulsory courses for all departments
  if (level === 1) {
    return `📋 [المقررات المعتمدة للمستوى الأول (سنة أولى) لجميع التخصصات]:
• الفصل الدراسي الأول:
  - الجبر الخطي [02-24-00101] (3 ساعات) - متطلب: لا يوجد
  - التفاضل والتكامل [02-24-00102] (3 ساعات) - متطلب: لا يوجد
  - مقدمة إلى نظم الحاسب [02-24-00103] (3 ساعات) - متطلب: لا يوجد
  - مقدمة إلى علوم البيانات [02-24-00104] (3 ساعات) - متطلب: لا يوجد
  - البرمجة 1 [02-24-00105] (3 ساعات) - متطلب: لا يوجد
  - التفكير الناقد [0200000XX] (2 ساعات)
• الفصل الدراسي الثاني:
  - الاحتمالات والإحصاء 1 [02-24-00106] (3 ساعات) - متطلب: لا يوجد
  - الرياضيات المحددة / تراكيب محددة [02-24-00107] (3 ساعات) - متطلب: لا يوجد
  - هياكل البيانات والخوارزميات [02-24-00108] (3 ساعات) - متطلب: البرمجة 1 (00105)
  - مقدمة إلى الذكاء الاصطناعي [02-24-00109] (3 ساعات) - متطلب: نظم الحاسب (00103)
  - البرمجة 2 [02-24-00110] (3 ساعات) - متطلب: البرمجة 1 (00105)
  - الابتكار وريادة الأعمال [0200000XX] (2 ساعات)`;
  }

  // Levels 2, 3, 4: Department-specific study plan from bylawData
  const programs = (bylawData as any).programs || [];
  const prog = programs.find((p: any) => p.program_code === dept.code) || programs[0];
  if (!prog || !prog.study_plan) return null;

  const lvlKey = `level_${level}`;
  const planForLevel = prog.study_plan[lvlKey];
  if (!planForLevel) return null;

  const formatCourseItem = (c: any) => {
    const codeStr = c.code ? ` [${c.code}]` : '';
    const hoursStr = c.credit_hours ? ` (${c.credit_hours} ساعات)` : '';
    const prStr = c.prerequisites && c.prerequisites.length > 0 ? ` - متطلب: ${c.prerequisites.join('، ')}` : ' - متطلب: لا يوجد';
    return `  - ${c.name_ar || c.name_en} (${c.name_en})${codeStr}${hoursStr}${prStr}`;
  };

  const semKeys = Object.keys(planForLevel).filter(k => k.startsWith('semester_'));
  const lines: string[] = [
    `📋 [المقررات المعتمدة للمستوى ${level} بقسم ${dept.nameAr} من لائحة الكلية]:`
  ];

  for (const sKey of semKeys) {
    const semData = planForLevel[sKey];
    const semNum = sKey.replace('semester_', '');
    lines.push(`• الفصل الدراسي رقم ${semNum} (إجمالي ${semData.credits} ساعة):`);
    for (const c of semData.courses || []) {
      lines.push(formatCourseItem(c));
    }
  }

  return lines.join('\n');
}

/**
 * Builds the comprehensive student session context block for Marline's system prompt.
 */
export function buildUserSessionPrompt(user?: MarlineUserSession | null): string {
  if (!user || (!user.username && !user.auth_id)) {
    return `👤 [بيانات جلسة الطالب]: طالب زائر (غير مسجل الدخول حالياً). عاملي الطالب بأسلوب مصري ودود، وإذا سأل عن مواده أو جدوله اسأليه بلطف عن سنته وقسمه.`;
  }

  const studentName = (user.username || 'طالب FCDS').trim();
  const dept = normalizeSpecialization(user.specialization);
  const { levelText, isGraduated } = formatLevelArabic(user.current_level, user.status);
  const statusText = isGraduated ? 'خريج' : 'طالب منتظم مقيد بالكلية';

  // Level-specific advice for Marline's coaching persona
  let levelGuidance = '';
  if (isGraduated) {
    levelGuidance = `• تعاملي مع ${studentName} كزميل خريج وباحث زميل. قدمي له نصائح سوق العمل المتقدمة، المقابلات التقنية (Tech Interviews)، الدراسات العليا، وبناء المشاريع الاحترافية.`;
  } else if (user.current_level === 1) {
    levelGuidance = `• ${studentName} في السنة التمهيدية الأولى المشتركة. ركزي معه على بناء الأساس البرمجي والرياضي، وفهم شجرة المتطلبات السابقة لفتح المواد القادمة، وكيفية رفع المعدل التراكمي (GPA) للاستعداد للتشعيب واختيار التخصص.`;
  } else if (user.current_level === 2) {
    levelGuidance = `• ${studentName} في السنة الثانية، مرحلة الانتقال للنواة التخصصية وقواعد البيانات والاحتمالات 2 والحوسبة السحابية. شجعيه على التطبيق العملي، ومساعدته في فهم المقررات المؤهلة للمسارات المتقدمة.`;
  } else if (user.current_level === 3) {
    levelGuidance = `• ${studentName} في السنة الثالثة بقسم (${dept.nameAr}). هذه مرحلة التخصص الدقيق والمقررات الاختيارية التخصصية. ساعديه في اختيار المقررات الاختيارية الأنسب لشغفه، والبدء في التفكير في أفكار مشروعات التخرج.`;
  } else if (user.current_level === 4) {
    levelGuidance = `• ${studentName} في السنة الرابعة والأخيرة (سنة التخرج!) بقسم (${dept.nameAr}). ركزي معه على استيفاء متطلبات الـ 140 ساعة، مشروع التخرج (Senior Capstone Project)، وبناء الـ Portfolio والتجهيز لسوق العمل.`;
  } else {
    levelGuidance = `• قدمي للطالب التوجيه الأكاديمي المناسب لمستواه وقسمه (${dept.nameAr}).`;
  }

  // Pre-fetch courses for student level if active student
  const coursesContext = !isGraduated && user.current_level ? getStudentCoursesForLevel(user.current_level, user.specialization || '') : '';

  return `👤 [ملف وهوية الطالب المتحدث حالياً (Active Student Session Profile)]:
• اسم الطالب: ${studentName}
• المستوى الأكاديمي الحالي: ${levelText}
• القسم / التخصص المقيد به: ${dept.nameAr}
• الحالة الأكاديمية: ${statusText}

🎯 توجيهات إلزامية لمارلين للتعامل مع ${studentName}:
1. المناداة الشخصية الودودة: نادي الطالب باسمه "${studentName}" بأسلوبك المصري الودود والراقي (مثلاً: "يا ${studentName}"، "أهلاً يا ${studentName}"، "بص يا ${studentName}") في بداية الحوار وعند تقديم النصائح، بطريقة عفوية ومحببة دون تكرار مزعج في كل جملة.
2. المعرفة المسبقة التامة بالمستوى والتخصص: أنتِ **تعلمين مسبقاً وتعرفين 100%** أن الطالب في (${levelText}) وتخصصه هو (${dept.nameAr}). إذا سأل أي سؤال مثل "ايه المواد اللي عليا؟" أو "ايه موادي؟" أو "تنصحيني بإيه في تخصصي؟" أو "ايه اللي هندرسه الترم ده؟"، أجيبي فوراً بالمواد والمسار الخاص بمستواه وتخصصه المقيد به، **ويُمنع منعاً باتاً لائحياً وذكائياً أن تسأليه 'أنت في سنة كام؟' أو 'قسمك إيه؟'**.
3. التوجيه الأكاديمي المخصص لمستواه:
${levelGuidance}
${coursesContext ? `\n${coursesContext}` : ''}`;
}
