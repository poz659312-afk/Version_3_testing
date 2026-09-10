import bylawData from "../../data/faculty_courses_bylaw.json";

export interface CourseInfo {
  code: string;
  name: string;
  name_en: string;
  name_ar: string;
  credit_hours: number;
  lecture_hours: number;
  practical_hours: number;
  prerequisites: string[];
  prerequisites_details?: Array<{ code: string; name_en: string; name_ar: string }>;
  programs?: string[];
  category?: string;
  notes?: string;
}

const allCourses: CourseInfo[] = (bylawData as any).all_unique_courses || [];
const dependencyGraph = (bylawData as any).prerequisites_dependency_graph || {};

// Common Arabic/English colloquial aliases for popular courses
const courseSynonyms: Record<string, string[]> = {
  '02-24-00101': ['linear algebra', 'جبر', 'جبر خطي', 'الجبرا', 'algebra', '00101'],
  '02-24-00102': ['calculus', 'تفاضل', 'تكامل', 'تفاضل وتكامل', 'كالكولس', '00102'],
  '02-24-00103': ['computer systems', 'نظم حاسب', 'مقدمة حاسب', 'نظم الحاسب', 'انترو', '00103'],
  '02-24-00104': ['data sciences', 'مقدمة علوم بيانات', 'علم بيانات', 'علوم البيانات', 'داتا ساينس', '00104'],
  '02-24-00105': ['programming i', 'programming 1', 'برمجة 1', 'برمجة ١', 'برمجه 1', '00105'],
  '02-24-00106': ['probability', 'statistics', 'احتمالات', 'احصاء', 'احصاء 1', 'احتمالات 1', '00106'],
  '02-24-00107': ['discrete', 'ديسكريت', 'هياكل محددة', 'تراكيب محددة', 'رياضيات محددة', '00107'],
  '02-24-00108': ['data structures', 'داتا ستراكشر', 'هياكل بيانات', 'تراكيب بيانات', 'خوارزميات', '00108'],
  '02-24-00109': ['artificial intelligence', 'ذكاء اصطناعي', 'ai', 'ذكاء', '00109'],
  '02-24-00110': ['programming ii', 'programming 2', 'برمجة 2', 'برمجة ٢', 'oop', '00110'],
  '02-24-00201': ['probability ii', 'statistics ii', 'احصاء 2', 'احتمالات 2', '00201'],
  '02-24-00202': ['database', 'databases', 'قواعد بيانات', 'قواعد البيانات', 'داتا بيز', '00202'],
  '02-24-00203': ['numerical', 'حسابات عددية', 'تحليل عددي', 'نيوميريكال', '00203'],
  '02-24-00204': ['cloud', 'cloud computing', 'حوسبة سحابية', 'كلاود', '00204'],
  '02-24-00205': ['machine learning', 'ماشين', 'ماشين ليرنينج', 'تعلم الالة', 'تعلم الآلة', 'تعلم آلة', 'ml', '00205'],
  '02-24-00206': ['data mining', 'داتا مايننج', 'تنقيب بيانات', 'تنقيب البيانات', 'تعدين البيانات', '00206'],
  '02-24-00301': ['software engineering', 'هندسة برمجيات', 'سوفت وير', '00301'],
  '02-24-00302': ['systems analysis', 'تحليل وتصميم نظم', 'تحليل نظم', '00302'],
  '02-24-00303': ['algorithm design', 'تصميم خوارزميات', 'الجورزم', 'الخوارزميات', '00303'],
  '02-24-00304': ['distributed processing', 'معالجة موزعة', 'ديستريبيوتد', '00304'],
  '02-24-00305': ['mobile', 'mobile programming', 'برمجة موبايل', 'موبايل', 'اندرويد', '00305'],
  '02-24-00306': ['web', 'web programming', 'برمجة ويب', 'ويب', '00306'],
  '02-24-00307': ['operating systems', 'نظم تشغيل', 'نظم التشغيل', 'اوبريشن', 'os', '00307'],
  '02-24-00308': ['networks', 'computer networks', 'شبكات', 'شبكات الحاسب', 'نتورك', '00308'],
  '02-24-06201': ['cybersecurity', 'أمن سيبراني', 'امن سيبراني', 'سايبر', 'cyber', '06201'],
  '02-24-06203': ['cryptography', 'تشفير', 'علم التشفير', 'كريبتو', '06203'],
  '02-24-03302': ['deep learning', 'ديب ليرنينج', 'تعلم عميق', '03302'],
  '02-24-03305': ['computer vision', 'كمبيوتر فيجن', 'رؤية بالحاسب', '03305'],
  '02-24-03403': ['natural language processing', 'معالجة لغات طبيعية', 'nlp', '03403'],
  '02-24-01401': ['big data', 'بيج داتا', 'بيانات ضخمة', '01401']
};

/**
 * High-performance, lightweight retriever that extracts relevant courses and their prerequisites
 * without bloating the prompt or incurring unnecessary token costs.
 */
export function getBylawContextForQuery(query: string): string | null {
  if (!query || typeof query !== 'string') return null;

  const normalized = query.toLowerCase().trim();

  // Detect if query is asking about courses, prerequisites, departments, or graduation rules
  const triggerKeywords = [
    'متطلب', 'متطلبات', 'بريريكويست', 'prereq', 'prerequisite', 'مادة', 'مواد', 'مقرر', 'مقررات',
    'كود', 'تفتح', 'بيفتح', 'مسار', 'خطة', 'ترم', 'تيرم', 'تيرمات', 'فصل', 'فصول', 'سنة', 'سنتين', 'سنوات',
    'مستوى', 'قسم', 'تخصص', 'لائحة', 'ساعات', 'اختياري', 'إجباري', 'اجباري', 'مشروع', 'تخرج'
  ];

  const hasTrigger = triggerKeywords.some(kw => normalized.includes(kw));

  // If user isn't asking about curriculum or courses, save tokens and return null
  if (!hasTrigger && normalized.length < 5) return null;

  const contextParts: string[] = [];

  // Check graduation duration & rules request
  const gradContext = checkGraduationDurationRequest(normalized);
  if (gradContext) {
    contextParts.push(gradContext);
  }

  const matchedCourseCodes = new Set<string>();

  // 1. Direct code search (e.g. 02-24-00108 or 00108)
  for (const c of allCourses) {
    const fullCode = c.code.toLowerCase();
    const shortCode = fullCode.slice(-5);
    if (normalized.includes(fullCode) || normalized.includes(shortCode)) {
      matchedCourseCodes.add(c.code);
    }
  }

  // 2. Synonyms and common colloquial names
  for (const [code, synonyms] of Object.entries(courseSynonyms)) {
    if (synonyms.some(s => normalized.includes(s))) {
      matchedCourseCodes.add(code);
    }
  }

  // 3. Exact Arabic and English titles
  if (matchedCourseCodes.size < 4) {
    for (const c of allCourses) {
      const nameEn = (c.name_en || '').toLowerCase();
      const nameAr = (c.name_ar || '').toLowerCase();
      if (nameEn && normalized.includes(nameEn)) {
        matchedCourseCodes.add(c.code);
      } else if (nameAr && normalized.includes(nameAr)) {
        matchedCourseCodes.add(c.code);
      }
      if (matchedCourseCodes.size >= 5) break;
    }
  }

  // If specific courses were matched, format their official bylaw records concisely
  if (matchedCourseCodes.size > 0) {
    const lines: string[] = [
      `📌 [بيانات موثقة من اللائحة الرسمية لكلية الحاسبات وعلوم البيانات - جامعة الإسكندرية بخصوص المقررات المطلوبة]:`
    ];

    for (const code of Array.from(matchedCourseCodes).slice(0, 4)) {
      const course = allCourses.find(c => c.code === code);
      if (!course) continue;

      let prereqText = 'لا يوجد متطلب سابق (يمكن تسجيلها مباشرة)';
      if (course.prerequisites && course.prerequisites.length > 0) {
        const details = course.prerequisites.map(pCode => {
          const p = allCourses.find(item => item.code === pCode);
          return p ? `${p.name_ar || p.name_en} (${p.code})` : pCode;
        });
        prereqText = details.join(' و ');
      }

      // Check what it unlocks
      const unlockInfo = dependencyGraph[course.code];
      const unlocksList = (unlockInfo?.unlocks_courses || []).slice(0, 4).map((u: any) => `${u.name_ar || u.name_en} (${u.code})`);
      const unlocksText = unlocksList.length > 0 ? ` | تفتح لاحقاً: ${unlocksList.join('، ')}` : '';

      lines.push(
        `- **${course.name_ar || course.name_en} (${course.name_en})** [كود: \`${course.code}\` | ${course.credit_hours} ساعات معتمدة]:\n` +
        `  * المتطلب السابق الإلزامي: ${prereqText}${unlocksText}`
      );

      if (course.notes) {
        lines.push(`  * ملاحظة لائحية: ${course.notes}`);
      }
    }

    contextParts.push(lines.join('\n'));
  }

  // 4. Check if the user is asking about a specific department's electives
  const deptElectiveMatch = checkDepartmentElectiveRequest(normalized);
  if (deptElectiveMatch) {
    contextParts.push(deptElectiveMatch);
  }

  return contextParts.length > 0 ? contextParts.join('\n\n') : null;
}

function checkGraduationDurationRequest(normalized: string): string | null {
  if (!/(?:تخرج|تيرم|ترم|فصول|فصل|سنة|سنتين|سنوات)/.test(normalized)) return null;

  return `📌 [قواعد التخرج والمدد اللائحية الرسمية الصارمة - كلية الحاسبات وعلوم البيانات جامعة الإسكندرية]:
• الحد الأدنى الإلزامي للتخرج (140 ساعة معتمدة): هو **7 فصول دراسية أساسية** (3.5 سنوات) كأسرع مدة استثنائية ممكنة نظامياً للطلاب الفائقين مع الصيفي. يُمنع منعاً باتاً لائحياً وقانونياً التخرج في أقل من 7 فصول دراسية (التخرج في 4 أو 5 أو 6 فصول مستحيل ومخالف لنص اللائحة).
• الحد الأقصى للساعات المعتمدة في الترم: 19 ساعة (أو 21 ساعة فقط استثنائياً لمن معدله التراكمي CGPA >= 3.333 أو الطالب الخريج في فصل تخرجه). الصيفي حده 6 ساعات (أو 9 للخريج).
• مرتبة الشرف: إنهاء متطلبات التخرج في مدة لا تتجاوز 9 فصول دراسية أساسية، دون أي رسوب بأي مقرر، وبمعدل تراكمي CGPA >= 3.666 ومعدل فصلي >= 3.333 في كل فصل.
• ⚠️ توجيه للذكاء الاصطناعي ضد الأسئلة المضللة: إذا سألك الطالب كيف يتخرج في 5 فصول دراسية أو أي مدة أقل من 7 فصول، ارفض الفرضية بحزم فوراً، واشرح الاستحالة اللائحية والرياضية (140 ساعة ÷ 5 تيرمات = 28 ساعة لكل ترم وهذا ممنوع لائحياً) وسلسلة المتطلبات السابقة التي تتطلب 7 مستويات تتابعية على الأقل، وقدم له خطة الـ 7 فصول كأسرع مسار مسموح به.`;
}

function checkDepartmentElectiveRequest(normalized: string): string | null {
  if (!normalized.includes('اختياري')) return null;

  const programs = (bylawData as any).programs || [];

  for (const prog of programs) {
    const pNameAr = (prog.program_name_ar || '').toLowerCase();
    const pNameEn = (prog.program_name_en || '').toLowerCase();

    if (normalized.includes(pNameAr) || normalized.includes(pNameEn) ||
        (prog.program_code === '01' && (normalized.includes('عام') || normalized.includes('حوسبة'))) ||
        (prog.program_code === '02' && (normalized.includes('اعمال') || normalized.includes('أعمال') || normalized.includes('بيزنس'))) ||
        (prog.program_code === '03' && (normalized.includes('ذكاء') || normalized.includes('نظم ذكية'))) ||
        (prog.program_code === '04' && (normalized.includes('وسائط') || normalized.includes('ميديا'))) ||
        (prog.program_code === '05' && (normalized.includes('صحي') || normalized.includes('رعاية'))) ||
        (prog.program_code === '06' && (normalized.includes('سايبر') || normalized.includes('سيبراني') || normalized.includes('أمن')))) {

      const elList = (prog.program_electives || []).map((e: any) => {
        const pr = (e.prerequisites && e.prerequisites.length > 0) ? ` (متطلب: ${e.prerequisites.join(',')})` : ' (بدون متطلب)';
        return `• ${e.name_ar || e.name_en} [\`${e.code}\`]${pr}`;
      });

      return `📌 [قائمة المقررات الاختيارية المعتمدة لبرنامج ${prog.program_name_ar} من مادة ${prog.program_code === '01' ? 33 : prog.program_code === '02' ? 35 : prog.program_code === '03' ? 37 : prog.program_code === '04' ? 39 : prog.program_code === '05' ? 41 : 43} باللائحة]:\n${elList.join('\n')}`;
    }
  }

  // Faculty electives
  if (normalized.includes('كلية') && normalized.includes('اختياري')) {
    const facElectives = (bylawData as any).faculty_elective_courses || [];
    const list = facElectives.map((e: any) => {
      const pr = (e.prerequisites && e.prerequisites.length > 0) ? ` (متطلب: ${e.prerequisites.join(',')})` : ' (بدون متطلب)';
      return `• ${e.name_ar || e.name_en} [\`${e.code}\`]${pr}`;
    });
    return `📌 [قائمة متطلبات الكلية الاختيارية (مادة 31 باللائحة - 4 مقررات بواقع 12 ساعة)]:\n${list.join('\n')}`;
  }

  return null;
}
