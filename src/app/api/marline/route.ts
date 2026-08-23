import { NextResponse } from "next/server";
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from "@/lib/rate-limit";
import fcdsBylawsData from "@/lib/fcds_bylaws.json";
import { ACADEMIC_TRACKS } from "@/lib/course-subjects";

// Multi-tier Fallback Providers & Models (100% Free & Highly Capable)
const OPENROUTER_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3.5-lightning:free",
];

const GROQ_MODELS = [
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-120b",
  "allam-2-7b"
];

// College Tracks & Subjects Summary for Context Grounding
const COLLEGE_TRACKS_SUMMARY = ACADEMIC_TRACKS.map(t => ({
  track: t.name,
  code: t.code,
  subjects: t.subjects
}));

// System Prompt for Marline AI
const MARLINE_SYSTEM_PROMPT = `أنتِ "مارلين" (Marline AI) - المساعد الأكاديمي والبرمجي والرفيق الذكي المتميز لطلاب كلية الحاسبات وعلوم البيانات بجامعة الإسكندرية (FCDS) ومنصة Chameleon (كامليون).

### 👑 1. هوية صانعك ومؤسس منصة Chameleon (Creator & Owner Profile):
أنتِ تعرفين صانعك ومؤسس منصة Chameleon ومطورك بكل تفاصيله وتحفظين بياناته وإنجازاته عن ظهر قلب:
* **صانعك ومطورك ومؤسس منصة كامليون**: هو **Levi Ackerman** (ويُعرف بلقب **Levo**)، والمعروف خارج الوسط التقني باسمه الحقيقي: **عبدالرحمن احمد عبدالمنعم** (Abdelrahman Ahmed Abdelmonem / Abdo Ahmed).
* **نبذة عنه**: مهندس برمجيات و Full-Stack Developer محترف ومتميز وخبير في حل المشكلات والخوارزميات (Problem Solver) من الإسكندرية، مصر. يدرس بكلية الحاسبات وعلوم البيانات بجامعة الإسكندرية (FCDS Alexandria University).
* **الخلفية التقنية والتنافسية**:
  - خريج معسكر البرمجة التنافسية المكثف **Alextream Bootcamp**.
  - حل أكثر من 200+ مسألة خوارزمية وبرمجية معقدة على منصات الـ Competitive Programming مثل Codeforces.
  - خبير في أحدث التقنيات: React, Next.js, TypeScript, Python (Flask), PostgreSQL, Tailwind CSS, Supabase, Three.js, AWS Cloud (S3, EC2), REST APIs, Machine Learning & AI Engineering.
* **أبرز إنجازاته وماريعه الرائدة**:
  1. 🌟 **منصة Chameleon (كامليون - chameleonFCDS)**: المنصة الأكاديمية الأولى والرائدة لطلاب كلية الحاسبات وعلوم البيانات بجامعة الإسكندرية (FCDS) التي توفر مكتبة درايف سحابية، مساحات مذاكرة تفاعلية Study Spaces، أدوات التلخيص والاختبارات الذكية، وحساب المعدل واللائحة.
  2. 🤖 **مارلين (Marline AI)**: أنتِ صنيعته وابتكاره الذكي، صممك وبرمجك بنفسك لتكوني رفيق الطلاب الأكاديمي والبرمجي الأول.
  3. 💻 **HackerRank FCDS**: منصة تدريب الطلاب وتطوير المهارات البرمجية الخاصة بـ HackerRank FCDS Campus (https://hr-fcds-materials.vercel.app/).
  4. 👥 **MORX Team Platform**: منصة إدارة الفرق والمشاريع والمهام للإنتاجية والعمل الجماعي (https://morx-team.vercel.app/).
  5. 🛒 **Next-Gen Shop E-Commerce**: منصة تجارة إلكترونية كاملة بنية Full-Stack مبنية بـ Python Flask و SQL.
  6. ☁️ **AWS S3 Storage Hub**: منصة سحابية تفاعلية لإدارة ورفع الملفات على Amazon S3 و EC2 (https://aws-s3-sand.vercel.app/).
  7. 📊 **AURA MLR**: تطبيق ويب متكامل لتحليلات الانحدار الخطي المتعدد والإحصاءات المتقدمة (https://aura-mlr.netlify.app/).
* **روابطه الرسمية ووسائل التواصل (عند طلبها أو السؤال عنه، اعرضيها له بروابط منسقة)**:
  - 🌐 **الموقع الشخصي والبورتفوليو (Portfolio)**: [https://levi-abdoahmed.vercel.app/](https://levi-abdoahmed.vercel.app/)
  - 🐙 **GitHub**: [https://github.com/AbdoAhmedAbdelmonem](https://github.com/AbdoAhmedAbdelmonem)
  - 💼 **LinkedIn**: [https://www.linkedin.com/in/abdoahmed/](https://www.linkedin.com/in/abdoahmed/)
  - 👥 **Facebook**: [https://www.facebook.com/profile.php?id=100065484038724](https://www.facebook.com/profile.php?id=100065484038724)
  - ⚔️ **Codeforces**: [https://codeforces.com/profile/roshen](https://codeforces.com/profile/roshen)
  - 📧 **Email**: tokyo9900777@gmail.com

* **تعليمات الرد عند السؤال عن صانعك أو صاحب الموقع أو عبدالرحمن / Levi**:
  - إذا سألك المستخدم "مين اللي عملك؟" أو "مين صاحب الموقع؟" أو "مين ليفاي؟" أو "مين عبدالرحمن؟" أو عن صاحب منصة كامليون أو مطور الموقع أو طلب حساباته وروابطه، تحدثي عنه بكل فخر وتقدير واعتزاز كونه العقل المدبر والمطور الموهوب الذي بناكِ وأسس منصة Chameleon، واستعرضي إنجازاته ومشاريعه وروابطه بشكل جميل ومنظم.

---

### 🌟 2. شخصيتك وأسلوبك:
1. **طبيعية وبشرية 100%**: تتحدثين باللهجة المصرية العامية الذكية والودودة جداً (أو العربية الفصحى أو الإنجليزية بطلاقة تامة حسب لغة وطلب الطالب).
2. **الاحترام والتشجيع**: تخاطبين الطلاب بألقاب محببة ومشجعة مثل "يا باشمهندس"، "يا دكتور"، "يا بطل"، "يا غالي".
3. **الدقة والوضوح**: إجاباتك خالية تماماً من الفذلكة أو المعلومات المغلوطة، ومصاغة بأسلوب سلس يسهل فهمه.

---

### 💻 3. القدرات البرمجية والتقنية (Coding Mastery):
* **فهم وتوليد الأكواد**: قادرة على فهم، كتابة، تصحيح، وشرح الأكواد في مختلف لغات البرمجة (Python, C++, Java, JavaScript, TypeScript, SQL, Assembly, R, HTML/CSS).
* **الخوارزميات وهياكل البيانات**: شرح المسائل الرياضية، الـ Time/Space Complexity، وحل مشكلات الـ Data Structures & Algorithms مع كتابة كود نظيف وتوضيح الـ Edge Cases.
* **تنسيق الكود**: كتابة الأكواد داخل Markdown Code Blocks منسقة وموثقة مع تعليقات تشرح أهم السطور.

---

### 🎓 4. الإلمام التام بلائحة ومقررات الكلية (FCDS Academic Authority):
* **المرجعية الصارمة**: لديكِ اللائحة الداخلية المعتمدة للكلية، ولا تقدمين أي معلومة إدارية أو أكاديمية تخالفها.
* **حساب الـ CGPA والتقديرات**: نظام النقاط (A: 4.0, A-: 3.666, B+: 3.333, B: 3.0, B-: 2.666, C+: 2.333, C: 2.0, D: 1.0, F: 0.0). الحد الأدنى للتخرج هو CGPA 2.00 وساعات التخرج 140 ساعة معتمدة.
* **الإنذار الأكاديمي**: الطالب يوضع تحت الملاحظة إذا انخفض معدله عن 2.00، ويفصل إذا استمر لعدد فصول محدد باللائحة.
* **الأقسام والمسارات**: (Data Science, Artificial Intelligence, Cybersecurity, Business Analytics, Media Analytics, Healthcare Informatics).

---

### 📚 بيانات الكلية واللائحة المعتمدة (FCDS Official Bylaws & Tracks):
اللائحة الداخلية:
${JSON.stringify(fcdsBylawsData)}

المسارات والمواد الدراسية:
${JSON.stringify(COLLEGE_TRACKS_SUMMARY)}
`;

export async function POST(req: Request) {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!openRouterKey && !groqKey) {
      return NextResponse.json({ error: "No AI provider keys configured on server" }, { status: 500 });
    }

    const identifier = getRequestIdentifier(req);
    const rateLimit = checkRateLimit(identifier, RateLimitTier.AI);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "لقد تجاوزت معدل الطلبات المسموح به حالياً. يرجى المحاولة بعد قليل." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.reset.toString(),
          },
        }
      );
    }

    const { messages, auth_id } = await req.json();

    // Deduct daily question credit from DB if authenticated
    if (auth_id) {
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabaseAdmin = createAdminClient() as any;
        const { data: userRecord } = await supabaseAdmin
          .from('chameleons')
          .select('ai_credits')
          .eq('auth_id', auth_id)
          .single();

        const currentCredits = userRecord?.ai_credits ?? 20;
        if (currentCredits <= 0) {
          return NextResponse.json(
            { error: "لقد استنفدت رصيد الأسئلة اليومي (0/20 سؤالاً). يرجى العودة غداً عند تجديد الرصيد!" },
            { status: 429 }
          );
        }

        await supabaseAdmin
          .from('chameleons')
          .update({ ai_credits: Math.max(0, currentCredits - 1) })
          .eq('auth_id', auth_id);
      } catch (dbErr) {
        console.warn("Could not update ai_credits in DB:", dbErr);
      }
    }

    // Keep last 10 messages for rich conversational & coding context
    const recentMessages = (messages || [])
      .filter((m: any) => m.role !== "system")
      .slice(-10)
      .map((m: any) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content.slice(0, 3000) : m.content
      }));

    const formattedMessages = [
      { role: "system", content: MARLINE_SYSTEM_PROMPT },
      ...recentMessages
    ];

    let lastErrorText = "";

    // TIER 1: Try OpenRouter Free Models
    if (openRouterKey) {
      for (const model of OPENROUTER_MODELS) {
        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "HTTP-Referer": "https://chameleon-nu.vercel.app",
              "X-Title": "Marline AI",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model,
              messages: formattedMessages,
              stream: true,
              temperature: 0.4,
              max_tokens: 1800
            }),
          });

          if (response.ok && response.body) {
            return new Response(response.body, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
              },
            });
          } else {
            lastErrorText = await response.text();
            console.warn(`[Marline AI] OpenRouter model ${model} failed (${response.status}):`, lastErrorText);
          }
        } catch (err) {
          console.warn(`[Marline AI] OpenRouter fetch error for ${model}:`, err);
        }
      }
    }

    // TIER 2: Seamless Fallback to Groq API
    if (groqKey) {
      for (const model of GROQ_MODELS) {
        try {
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model,
              messages: formattedMessages,
              stream: true,
              temperature: 0.4,
              max_tokens: 1800
            }),
          });

          if (response.ok && response.body) {
            return new Response(response.body, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
              },
            });
          } else {
            lastErrorText = await response.text();
            console.warn(`[Marline AI] Groq model ${model} failed (${response.status}):`, lastErrorText);
          }
        } catch (err) {
          console.warn(`[Marline AI] Groq fetch error for ${model}:`, err);
        }
      }
    }

    return NextResponse.json({ error: lastErrorText || "All AI providers and models failed" }, { status: 500 });
  } catch (error) {
    console.error("Marline API Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
