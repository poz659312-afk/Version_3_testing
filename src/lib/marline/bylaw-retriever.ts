import bylawData from "../../data/faculty_courses_bylaw.json";
import programElectivesData from "../../data/program_electives.json";
import courseMaterialsData from "../../data/course_materials.json";
import { getStudentCoursesForLevel, normalizeSpecialization, MarlineUserSession } from "./user-session-context";

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

export interface CourseMaterialRecord {
  code: string;
  name_en: string;
  name_ar: string;
  lectures?: string;
  sections?: string;
  summaries?: string;
  exams?: string;
  videos?: string[];
}

const allBylawCourses: CourseInfo[] = (bylawData as any).all_unique_courses || [];
const allProgramElectives: any[] = (programElectivesData as any).all_program_electives || [];
const dependencyGraph = (bylawData as any).prerequisites_dependency_graph || {};
const allMaterials = courseMaterialsData as Record<string, CourseMaterialRecord>;

// Common Arabic/English colloquial aliases for popular courses & electives
const courseSynonyms: Record<string, string[]> = {
  '02-24-00101': ['linear algebra', 'جبر', 'جبر خطي', 'الجبرا', 'algebra', '00101'],
  '02-24-00102': ['calculus', 'تفاضل', 'تكامل', 'تفاضل وتكامل', 'كالكولس', '00102'],
  '02-24-00103': ['computer systems', 'نظم حاسب', 'مقدمة حاسب', 'نظم الحاسب', 'انترو', '00103'],
  '02-24-00104': ['data sciences', 'مقدمة علوم بيانات', 'علم بيانات', 'علوم البيانات', 'داتا ساينس', '00104'],
  '02-24-00105': ['programming i', 'programming 1', 'برمجة 1', 'برمجة ١', 'برمجه 1', 'بايثون', 'python', '00105'],
  '02-24-00106': ['probability', 'statistics', 'احتمالات', 'احصاء', 'احصاء 1', 'احتمالات 1', '00106'],
  '02-24-00107': ['discrete', 'ديسكريت', 'هياكل محددة', 'تراكيب محددة', 'رياضيات محددة', '00107'],
  '02-24-00108': ['data structures', 'داتا ستراكشر', 'هياكل بيانات', 'تراكيب بيانات', 'خوارزميات', '00108'],
  '02-24-00109': ['artificial intelligence', 'ذكاء اصطناعي', 'ai', 'ذكاء', '00109'],
  '02-24-00110': ['programming ii', 'programming 2', 'برمجة 2', 'برمجة ٢', 'oop', '00110'],
  '02-24-00201': ['probability ii', 'statistics ii', 'احصاء 2', 'احتمالات 2', '00201'],
  '02-24-00202': ['database', 'databases', 'قواعد بيانات', 'قواعد البيانات', 'داتا بيز', 'sql', '00202'],
  '02-24-00203': ['numerical', 'حسابات عددية', 'تحليل عددي', 'نيوميريكال', '00203'],
  '02-24-00204': ['cloud', 'cloud computing', 'حوسبة سحابية', 'كلاود', '00204'],
  '02-24-00205': ['machine learning', 'ماشين', 'ماشين ليرنينج', 'تعلم الالة', 'تعلم الآلة', 'تعلم آلة', 'ml', '00205'],
  '02-24-00206': ['data mining', 'داتا مايننج', 'تنقيب بيانات', 'تنقيب البيانات', 'تعدين البيانات', '00206'],
  '02-24-00301': ['software engineering', 'هندسة برمجيات', 'سوفت وير', '00301'],
  '02-24-00302': ['systems analysis', 'تحليل وتصميم نظم', 'تحليل نظم', '00302'],
  '02-24-00303': ['algorithm design', 'تصميم خوارزميات', 'الجورزم', 'الخوارزميات', '00303'],
  '02-24-00304': ['distributed processing', 'معالجة موزعة', 'ديستريبيوتد', '00304'],
  '02-24-00305': ['mobile', 'mobile programming', 'برمجة موبايل', 'موبايل', 'اندرويد', 'فلاتر', 'flutter', '00305'],
  '02-24-00306': ['web', 'web programming', 'برمجة ويب', 'ويب', '00306'],
  '02-24-00307': ['operating systems', 'نظم تشغيل', 'نظم التشغيل', 'اوبريشن', 'os', '00307'],
  '02-24-00308': ['networks', 'computer networks', 'شبكات', 'شبكات الحاسب', 'نتورك', '00308'],
  '02-24-06201': ['cybersecurity', 'أمن سيبراني', 'امن سيبراني', 'سايبر', 'cyber', '06201'],
  '02-24-06203': ['cryptography', 'تشفير', 'علم التشفير', 'كريبتو', '06203'],
  '02-24-03302': ['deep learning', 'ديب ليرنينج', 'تعلم عميق', '03302'],
  '02-24-03305': ['computer vision', 'كمبيوتر فيجن', 'رؤية بالحاسب', '03305'],
  '02-24-03403': ['natural language processing', 'معالجة لغات طبيعية', 'nlp', '03403'],
  '02-24-01401': ['big data', 'بيج داتا', 'بيانات ضخمة', '01401'],

  // Program Electives aliases & alternative codes
  '02-24-03409': ['speech recognition', 'تعرف على الكلام', 'معالجة الكلام', 'speech', '03409', '03401'],
  '02-24-03410': ['natural language understanding', 'فهم لغات طبيعية', 'nlu', '03410', '03402'],
  '02-24-03411': ['embedded machine learning', 'tinyml', 'تايني ام ال', 'تعلم الة مدمج', '03411', '03403'],
  '02-24-03414': ['knowledge base ai', 'ذكاء اصطناعي قائم على المعرفة', 'نوليدج بيز', '03414', '03406'],
  '02-24-03415': ['virtual reality', 'واقع افتراضي', 'vr', '03415', '03407'],
  '02-24-03416': ['game theory', 'نظرية الألعاب', 'نظرية الالعاب', '03416', '03408'],
  '02-24-06409': ['ai security', 'ai security issues', 'أمان الذكاء الاصطناعي', 'امن الذكاء الاصطناعي', '06409', '06401'],
  '02-24-06410': ['proactive security', 'أمن حاسوب استباقي', 'امن استباقي', '06410', '06402'],
  '02-24-06411': ['software security engineering', 'أمان برمجيات', 'هندسة أمان البرمجيات', '06411', '06403'],
  '02-24-06412': ['blockchain', 'بلوك تشين', 'بلوكشين', 'blockchain and security', '06412', '06404'],
  '02-24-06413': ['cloud security', 'أمان الحوسبة السحابية', 'أمن سحابي', '06413', '06405'],
  '02-24-06414': ['social networks analytics', 'تحليلات الشبكات الاجتماعية', '06414', '06406'],
  '02-24-01409': ['convex optimization', 'تحسين محدب', 'كونفكس', '01409', '01401'],
  '02-24-01410': ['combinatorial optimization', 'تحسين غير خطي', '01410', '01402'],
  '02-24-01411': ['multivariate', 'تحليل متعدد المتغيرات', '01411', '01403'],
  '02-24-01412': ['bayesian', 'إحصاء بيزي', 'احصاء بايزي', '01412', '01404'],
  '02-24-02409': ['hci', 'human computer interaction', 'تفاعل الانسان والحاسب', '02409', '02401'],
  '02-24-02410': ['gamification', 'تلعيب', 'تطوير العاب', '02410', '02402'],
  '02-24-02412': ['gis', 'spatial data mining', 'نظم معلومات جغرافية', '02412', '02404'],
  '02-24-02417': ['predictive analytics', 'تحليلات تنبؤية', '02417', '02409'],
  '02-24-04409': ['interactive media', 'وسائط تفاعلية', '04409', '04401'],
  '02-24-04411': ['computational photography', 'تصوير حاسوبي', '04411', '04403'],
  '02-24-04412': ['computer animations', 'رسوم متحركة', 'انيميشن', '04412', '04404'],
  '02-24-04413': ['video game design', 'تصميم ألعاب', 'العاب فيديو', '04413', '04405'],
  '02-24-05409': ['radiation physics', 'فيزياء إشعاع', 'فيزياء اشعاع', '05409', '05401'],
  '02-24-05410': ['cellular biology', 'molecular biology', 'بيولوجيا خلوية', '05410', '05402'],
};

/**
 * Looks up materials (Google Drive & YouTube) for a given course code, name, or synonym.
 */
export function getCourseMaterials(identifier: string): CourseMaterialRecord | null {
  if (!identifier) return null;
  const norm = identifier.trim().toLowerCase();
  const shortCode = norm.slice(-5);
  const numDigits = shortCode.replace(/[^0-9]/g, '');

  // 1. Direct key match
  if (allMaterials[norm]) return allMaterials[norm];

  // 2. Search by code or short code
  for (const item of Object.values(allMaterials)) {
    if (item.code) {
      const codeNorm = item.code.toLowerCase();
      if (
        codeNorm === norm ||
        codeNorm.slice(-5) === shortCode ||
        (numDigits.length >= 3 && codeNorm.replace(/[^0-9]/g, '').endsWith(numDigits))
      ) {
        return item;
      }
    }
  }

  // 3. Exact Arabic or English name
  for (const item of Object.values(allMaterials)) {
    if (item.name_ar && item.name_ar.toLowerCase() === norm) return item;
    if (item.name_en && item.name_en.toLowerCase() === norm) return item;
  }

  // 4. Substring in names
  for (const item of Object.values(allMaterials)) {
    if (item.name_ar && (norm.includes(item.name_ar.toLowerCase()) || item.name_ar.toLowerCase().includes(norm))) return item;
    if (item.name_en && (norm.includes(item.name_en.toLowerCase()) || item.name_en.toLowerCase().includes(norm))) return item;
  }

  return null;
}

/**
 * Formats a dedicated, detailed materials block with markdown links: [اضغط هنا](url).
 */
export function formatCourseMaterialsBlock(item: CourseMaterialRecord): string {
  const lines: string[] = [];
  lines.push(`📚 **روابط المصادر والماتريال الرسمية لمقرر ${item.name_ar || item.name_en} (${item.name_en})**:`);
  if (item.lectures) lines.push(`  • المحاضرات (Lectures): [اضغط هنا](${item.lectures})`);
  if (item.sections) lines.push(`  • السكاشن (Sections): [اضغط هنا](${item.sections})`);
  if (item.summaries) lines.push(`  • الملخصات (Summaries): [اضغط هنا](${item.summaries})`);
  if (item.exams) lines.push(`  • الامتحانات السابقة (Exams): [اضغط هنا](${item.exams})`);
  if (item.videos && item.videos.length > 0) {
    if (item.videos.length === 1) {
      lines.push(`  • فيديوهات الشرح (Videos): [اضغط هنا](${item.videos[0]})`);
    } else {
      const vLinks = item.videos.map((v, i) => `[جزء ${i + 1}](${v})`).join(' ، ');
      lines.push(`  • فيديوهات الشرح (Videos): ${vLinks}`);
    }
  }
  return lines.join('\n');
}

/**
 * Formats a compact inline line with markdown links: [اضغط هنا](url).
 */
export function formatCourseMaterialsInline(item: CourseMaterialRecord): string {
  const links: string[] = [];
  if (item.lectures) links.push(`المحاضرات [اضغط هنا](${item.lectures})`);
  if (item.sections) links.push(`السكاشن [اضغط هنا](${item.sections})`);
  if (item.summaries) links.push(`الملخصات [اضغط هنا](${item.summaries})`);
  if (item.exams) links.push(`الامتحانات [اضغط هنا](${item.exams})`);
  if (item.videos && item.videos.length > 0) links.push(`الفيديوهات [اضغط هنا](${item.videos[0]})`);
  return links.length > 0 ? `  * روابط المصادر والماتريال: ${links.join(' | ')}` : '';
}

/**
 * Builds a structured markdown table of course materials for a given academic level.
 */
export function getLevelMaterialsTable(level: number, specialization?: string): string | null {
  const coursesToFetch: Array<{ code: string; name: string }> = [];

  if (level === 1) {
    coursesToFetch.push(
      { code: '02-24-00101', name: 'الجبر الخطي (Linear Algebra)' },
      { code: '02-24-00102', name: 'التفاضل والتكامل (Calculus)' },
      { code: '02-24-00103', name: 'مقدمة نظم الحاسب (Intro to CS)' },
      { code: '02-24-00104', name: 'مقدمة علوم البيانات (Data Sciences)' },
      { code: '02-24-00105', name: 'البرمجة 1 (Programming I)' },
      { code: '02-24-00106', name: 'الاحتمالات والإحصاء 1 (Prob & Stat I)' },
      { code: '02-24-00107', name: 'الهياكل المحددة (Discrete Structures)' },
      { code: '02-24-00108', name: 'هياكل البيانات (Data Structures)' },
      { code: '02-24-00109', name: 'مقدمة الذكاء الاصطناعي (Intro to AI)' },
      { code: '02-24-00110', name: 'البرمجة 2 (Programming II)' }
    );
  } else if (level === 2) {
    coursesToFetch.push(
      { code: '02-24-00201', name: 'الاحتمالات والإحصاء 2 (Prob & Stat II)' },
      { code: '02-24-00202', name: 'قواعد البيانات (Databases)' },
      { code: '02-24-00203', name: 'الحسابات العددية (Numerical)' },
      { code: '02-24-00204', name: 'الحوسبة السحابية (Cloud Computing)' },
      { code: '02-24-00205', name: 'تعلم الآلة (Machine Learning)' },
      { code: '02-24-00206', name: 'تنقيب وتحليلات البيانات (Data Mining)' }
    );
  } else if (level === 3) {
    coursesToFetch.push(
      { code: '02-24-00301', name: 'هندسة البرمجيات (Software Engineering)' },
      { code: '02-24-00302', name: 'تحليل وتصميم النظم (Systems Analysis)' },
      { code: '02-24-00303', name: 'تصميم الخوارزميات (Algorithm Design)' },
      { code: '02-24-00304', name: 'المعالجة الموزعة (Distributed Processing)' },
      { code: '02-24-00305', name: 'برمجة الموبايل (Mobile Programming)' },
      { code: '02-24-00306', name: 'برمجة الويب (Web Programming)' },
      { code: '02-24-00307', name: 'نظم التشغيل (Operating Systems)' },
      { code: '02-24-00308', name: 'شبكات الحاسب (Computer Networks)' }
    );
  }

  if (coursesToFetch.length === 0) return null;

  const rows: string[] = [
    `📚 [جدول روابط المصادر والماتريال المعتمدة لمقررات المستوى ${level}]:`,
    `| المقرر | المحاضرات | السكاشن | الملخصات | الامتحانات | الفيديوهات |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- |`
  ];

  for (const c of coursesToFetch) {
    const mat = getCourseMaterials(c.code);
    if (!mat) continue;
    const lec = mat.lectures ? `[اضغط هنا](${mat.lectures})` : '—';
    const sec = mat.sections ? `[اضغط هنا](${mat.sections})` : '—';
    const sum = mat.summaries ? `[اضغط هنا](${mat.summaries})` : '—';
    const ex = mat.exams ? `[اضغط هنا](${mat.exams})` : '—';
    const vid = mat.videos && mat.videos.length > 0 ? `[اضغط هنا](${mat.videos[0]})` : '—';
    rows.push(`| ${c.name} | ${lec} | ${sec} | ${sum} | ${ex} | ${vid} |`);
  }

  return rows.join('\n');
}

/**
 * High-performance, lightweight retriever that extracts relevant courses and their prerequisites
 * without bloating the prompt or incurring unnecessary token costs.
 */
export function getBylawContextForQuery(query: string, userMeta?: MarlineUserSession): string | null {
  if (!query || typeof query !== 'string') return null;

  const normalized = query.toLowerCase().trim();

  // Detect if query is asking about materials, courses, prerequisites, electives, or graduation rules
  const triggerKeywords = [
    'متطلب', 'متطلبات', 'بريريكويست', 'prereq', 'prerequisite', 'مادة', 'مواد', 'مقرر', 'مقررات',
    'كود', 'تفتح', 'بيفتح', 'مسار', 'خطة', 'ترم', 'تيرم', 'تيرمات', 'فصل', 'فصول', 'سنة', 'سنتين', 'سنوات',
    'مستوى', 'قسم', 'تخصص', 'لائحة', 'ساعات', 'اختياري', 'اختيارية', 'اختيارات', 'الكترف', 'الكتف', 'elective',
    'electives', 'إجباري', 'اجباري', 'مشروع', 'تخرج', 'جدول', 'جدولي', 'موادي', 'مقرراتي', 'هدرس', 'عليا',
    'ماتريال', 'ماتريالات', 'محاضرات', 'محاضرة', 'سكاشن', 'سيكشن', 'سكشن', 'ملخصات', 'ملخص', 'امتحانات', 'امتحان',
    'درايف', 'درايفات', 'لينك', 'لينكات', 'روابط', 'رابط', 'فيديوهات', 'فيديو', 'بلاي ليست', 'بلايليست', 'شرح',
    'ذاكر', 'مذاكرة', 'مصادر', 'مصدر', 'material', 'materials', 'drive', 'link', 'links', 'lecture', 'lectures',
    'summary', 'summaries', 'exam', 'exams', 'video', 'videos', 'playlist', 'resource', 'resources'
  ];

  const hasTrigger = triggerKeywords.some(kw => normalized.includes(kw));

  // If user isn't asking about curriculum, courses, or materials, save tokens and return null
  if (!hasTrigger && normalized.length < 5) return null;

  const contextParts: string[] = [];

  const isAskingMaterials = /(?:ماتريال|ماتريالات|محاضر|سكاشن|سيكشن|سكشن|ملخص|امتحان|درايف|لينك|لينكات|روابط|رابط|فيديو|بلاي\s*ليست|شرح|ذاكر|مذاكر|مصادر|مصدر|material|materials|lecture|lectures|section|sections|summary|summaries|exam|exams|drive|link|links|video|videos|playlist|resource|resources)/i.test(normalized);

  // 0. Auto-retrieve student's specific level materials or curriculum if asking about their courses/materials
  if (userMeta && userMeta.current_level) {
    const isAskingOwnMaterials = isAskingMaterials && /(?:موادي|مقرراتي|المواد اللي عليا|المواد بتاعتي|المواد اللي عندي|ماتريالي|درايفاتي|لينكاتي)/.test(normalized);
    if (isAskingOwnMaterials) {
      const materialsTable = getLevelMaterialsTable(userMeta.current_level, userMeta.specialization);
      if (materialsTable) {
        contextParts.push(materialsTable);
      }
    }

    const isAskingOwnCourses = /(?:موادي|مقرراتي|المواد اللي عليا|المواد بتاعتي|المواد اللي عندي|ايه اللي هدرسه|ايه اللي درسه|جدولي|خطتي|المواد المقررة|مواد الترم|ايه اللي عليا)/.test(normalized);
    if (isAskingOwnCourses && !isAskingOwnMaterials) {
      const studentCoursesSnippet = getStudentCoursesForLevel(userMeta.current_level, userMeta.specialization || '');
      if (studentCoursesSnippet) {
        contextParts.push(studentCoursesSnippet);
      }
    }
  }

  // Check if query is asking for materials of a specific year/level
  if (isAskingMaterials && !contextParts.length) {
    if (/(?:سنة أولى|سنة اولى|مستوى أول|مستوى 1|فرقة أولى|فرقة اولى)/.test(normalized)) {
      const t = getLevelMaterialsTable(1, userMeta?.specialization);
      if (t) contextParts.push(t);
    } else if (/(?:سنة تانية|سنة ثانية|مستوى تاني|مستوى ثان|مستوى 2|فرقة ثانية|فرقة تانية)/.test(normalized)) {
      const t = getLevelMaterialsTable(2, userMeta?.specialization);
      if (t) contextParts.push(t);
    } else if (/(?:سنة تالتة|سنة ثالثة|مستوى تالت|مستوى ثالث|مستوى 3|فرقة ثالثة|فرقة تالتة)/.test(normalized)) {
      const t = getLevelMaterialsTable(3, userMeta?.specialization);
      if (t) contextParts.push(t);
    }
  }

  // Check graduation duration & rules request
  const gradContext = checkGraduationDurationRequest(normalized);
  if (gradContext) {
    contextParts.push(gradContext);
  }

  // 1. Check if the user is asking about department electives (Program Electives or Faculty Electives)
  const deptElectiveMatch = checkDepartmentElectiveRequest(normalized, userMeta);
  if (deptElectiveMatch) {
    contextParts.push(deptElectiveMatch);
  }

  const matchedCourseCodes = new Set<string>();

  // 2. Direct code search in compulsory and electives
  for (const c of allBylawCourses) {
    const fullCode = c.code.toLowerCase();
    const shortCode = fullCode.slice(-5);
    if (normalized.includes(fullCode) || normalized.includes(shortCode)) {
      matchedCourseCodes.add(c.code);
    }
  }

  for (const e of allProgramElectives) {
    const fullCode = e.code.toLowerCase();
    const shortCode = fullCode.slice(-5);
    const altCode = (e.alternative_code || '').toLowerCase();
    const altShort = altCode ? altCode.slice(-5) : '';
    if (
      normalized.includes(fullCode) ||
      normalized.includes(shortCode) ||
      (altCode && normalized.includes(altCode)) ||
      (altShort && normalized.includes(altShort))
    ) {
      matchedCourseCodes.add(e.code);
    }
  }

  // 3. Synonyms and common colloquial names
  for (const [code, synonyms] of Object.entries(courseSynonyms)) {
    if (synonyms.some(s => normalized.includes(s))) {
      matchedCourseCodes.add(code);
    }
  }

  // 4. Exact Arabic and English titles
  if (matchedCourseCodes.size < 4) {
    for (const c of allBylawCourses) {
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

  if (matchedCourseCodes.size < 4) {
    for (const e of allProgramElectives) {
      const nameEn = (e.name_en || '').toLowerCase();
      const nameAr = (e.name_ar || '').toLowerCase();
      if (nameEn && normalized.includes(nameEn)) {
        matchedCourseCodes.add(e.code);
      } else if (nameAr && normalized.includes(nameAr)) {
        matchedCourseCodes.add(e.code);
      }
      if (matchedCourseCodes.size >= 5) break;
    }
  }

  // 5. Fallback search directly in materials catalog if materials requested
  if (matchedCourseCodes.size === 0 && isAskingMaterials) {
    for (const [key, item] of Object.entries(allMaterials)) {
      if (
        (item.code && (normalized.includes(item.code.toLowerCase()) || normalized.includes(item.code.toLowerCase().slice(-5)))) ||
        (item.name_en && normalized.includes(item.name_en.toLowerCase())) ||
        (item.name_ar && normalized.includes(item.name_ar.toLowerCase()))
      ) {
        matchedCourseCodes.add(item.code || key);
        if (matchedCourseCodes.size >= 4) break;
      }
    }
  }

  // If specific courses were matched, format their official records and materials
  if (matchedCourseCodes.size > 0) {
    const lines: string[] = [
      `📌 [بيانات موثقة من اللائحة الرسمية ومقررات الكلية بخصوص المقررات المطلوبة]:`
    ];

    for (const code of Array.from(matchedCourseCodes).slice(0, 4)) {
      const mat = getCourseMaterials(code);

      // Check program electives first
      const elective = allProgramElectives.find(e => e.code === code || e.alternative_code === code);
      if (elective) {
        const prereqNames = elective.prerequisites_details && elective.prerequisites_details.length > 0
          ? elective.prerequisites_details.map((p: any) => `${p.name_ar || p.name_en} (${p.code})`).join(' و ')
          : (elective.prerequisites && elective.prerequisites.length > 0 ? elective.prerequisites.join(' و ') : 'لا يوجد متطلب سابق (يمكن تسجيلها مباشرة)');

        const alt = elective.alternative_code ? ` / \`${elective.alternative_code}\`` : '';
        const courseHeading = `- **${elective.name_ar || elective.name_en} (${elective.name_en})** [كود: \`${elective.code}\`${alt} | مقرر اختياري تخصصي بقسم ${elective.department_name_ar} | ${elective.credit_hours} ساعات معتمدة]:\n` +
          `  * المتطلب السابق الإلزامي: ${prereqNames}\n` +
          `  * نبذة عن المقرر: ${elective.description}`;

        lines.push(courseHeading);

        if (mat) {
          if (isAskingMaterials) {
            lines.push(formatCourseMaterialsBlock(mat));
          } else {
            const inline = formatCourseMaterialsInline(mat);
            if (inline) lines.push(inline);
          }
        }
        continue;
      }

      const course = allBylawCourses.find(c => c.code === code);
      if (course) {
        let prereqText = 'لا يوجد متطلب سابق (يمكن تسجيلها مباشرة)';
        if (course.prerequisites && course.prerequisites.length > 0) {
          const details = course.prerequisites.map(pCode => {
            const p = allBylawCourses.find(item => item.code === pCode) || allProgramElectives.find(item => item.code === pCode);
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

        if (mat) {
          if (isAskingMaterials) {
            lines.push(formatCourseMaterialsBlock(mat));
          } else {
            const inline = formatCourseMaterialsInline(mat);
            if (inline) lines.push(inline);
          }
        }
        continue;
      }

      // If matched only via materials catalog
      if (mat) {
        lines.push(formatCourseMaterialsBlock(mat));
      }
    }

    contextParts.push(lines.join('\n'));
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

function checkDepartmentElectiveRequest(normalized: string, userMeta?: MarlineUserSession): string | null {
  const isAskingElectives = /(?:اختياري|اختيارية|اختيارات|الكترف|الكتف|elective|electives)/.test(normalized);
  if (!isAskingElectives) return null;

  // 1. Detect department from query keywords
  let targetSlug: string | null = null;
  if (normalized.includes('عام') || normalized.includes('حوسب') || normalized.includes('بيانات') || normalized.includes('computing') || normalized.includes('data science')) {
    targetSlug = 'computing-data-sciences';
  } else if (normalized.includes('اعمال') || normalized.includes('أعمال') || normalized.includes('بيزنس') || normalized.includes('business')) {
    targetSlug = 'business-analytics';
  } else if (normalized.includes('ذكاء') || normalized.includes('ai') || normalized.includes('نظم ذكية') || normalized.includes('intelligent')) {
    targetSlug = 'artificial-intelligence';
  } else if (normalized.includes('وسائط') || normalized.includes('ميديا') || normalized.includes('media')) {
    targetSlug = 'media-analytics';
  } else if (normalized.includes('صحي') || normalized.includes('رعاية') || normalized.includes('health')) {
    targetSlug = 'healthcare-informatics';
  } else if (normalized.includes('سايبر') || normalized.includes('سيبراني') || normalized.includes('cyber') || normalized.includes('أمن')) {
    targetSlug = 'cybersecurity';
  }

  // 2. If no department detected in query, fallback to user's current department session
  if (!targetSlug && userMeta?.specialization) {
    targetSlug = normalizeSpecialization(userMeta.specialization).slug;
  }

  // 3. If a target department is found, return its complete list of program electives
  if (targetSlug && (programElectivesData as any).by_department?.[targetSlug]) {
    const deptData = (programElectivesData as any).by_department[targetSlug];
    const lines: string[] = [
      `📌 [قائمة المقررات الاختيارية التخصصية المعتمدة (Program Electives) لقسم ${deptData.department_name_ar} (${deptData.department_name_en}) من اللائحة الرسمية]:`,
      `⚠️ القاعدة اللائحية الصارمة للمقررات الاختيارية:`,
      `• يختار الطالب **4 مقررات تخصص اختيارية فقط (بواقع 12 ساعة معتمدة إجمالياً)** من هذه القائمة طوال دراسته (مقرران بالفصل السابع ومقرران بالفصل الثامن في السنة الرابعة).`,
      `• بالإضافة إلى **4 مقررات كلية اختيارية فقط (بواقع 12 ساعة معتمدة إجمالياً)** في السنة الثالثة.`,
      `• 🚫 يُمنع منعاً باتاً لائحياً القول بأن المطلوب 6 مقررات أو 18 ساعة اختياري تخصص! العدد الإلزامي لائحياً هو 4 مقررات تخصص اختيارية (12 ساعة) و4 مقررات كلية اختيارية (12 ساعة).`
    ];

    for (const c of deptData.electives) {
      const prereqNames = c.prerequisites_details && c.prerequisites_details.length > 0
        ? c.prerequisites_details.map((p: any) => `${p.name_ar || p.name_en} (${p.code})`).join(' و ')
        : (c.prerequisites && c.prerequisites.length > 0 ? c.prerequisites.join(' و ') : 'لا يوجد متطلب سابق (يمكن تسجيلها مباشرة)');

      const altCodeStr = c.alternative_code ? ` / \`${c.alternative_code}\`` : '';
      lines.push(
        `- **${c.name_ar} (${c.name_en})** [كود: \`${c.code}\`${altCodeStr} | ${c.credit_hours} ساعات]:\n` +
        `  * المتطلب السابق: ${prereqNames}\n` +
        `  * نبذة عن المقرر: ${c.description}`
      );
    }

    return lines.join('\n');
  }

  // 4. If asked about Faculty Electives or general electives
  if (normalized.includes('كلية') || !targetSlug) {
    const facElectives = (programElectivesData as any).faculty_electives || [];
    const list = facElectives.map((e: any) => {
      const pr = (e.prerequisites && e.prerequisites.length > 0) ? ` (متطلب: ${e.prerequisites.join(',')})` : ' (بدون متطلب)';
      return `• ${e.name_en} [\`${e.code}\` | ${e.credit_hours} ساعات]${pr}`;
    });

    return `📌 [قائمة متطلبات الكلية الاختيارية المشتركة (Faculty Electives - مادة 31 باللائحة - 4 مقررات بواقع 12 ساعة)]:\n${list.join('\n')}\n\n💡 ملاحظة: لكل قسم أيضاً قائمة مقررات اختيارية تخصصية (Program Electives). يمكنك السؤال عن المواد الاختيارية لأي قسم محدد مثل الذكاء الاصطناعي، الأمن السيبراني، إلخ.`;
  }

  return null;
}
