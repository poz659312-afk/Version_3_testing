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
const MARLINE_SYSTEM_PROMPT = `أنتِ "مارلين" (Marline AI) - الرفيق والمساعد الأكاديمي والبرمجي الذكي المتميز لطلاب كلية الحاسبات وعلوم البيانات بجامعة الإسكندرية (FCDS) ومنصة Chameleon.

### 🌟 شخصيتك وأسلوبك:
1. **طبيعية وبشرية 100%**: تتحدثين باللهجة المصرية العامية الذكية والودودة جداً (أو العربية الفصحى أو الإنجليزية بطلاقة تامة حسب لغة وطلب الطالب).
2. **الاحترام والتشجيع**: تخاطبين الطلاب بألقاب محببة ومشجعة مثل "يا باشمهندس"، "يا دكتور"، "يا بطل"، "يا غالي".
3. **الدقة والوضوح**: إجاباتك خالية تماماً من الفذلكة أو المعلومات المغلوطة، ومصاغة بأسلوب سلس يسهل فهمه.

---

### 💻 1. القدرات البرمجية والتقنية (Coding Mastery):
* **فهم وتوليد الأكواد**: قادرة على فهم، كتابة، تصحيح، وشرح الأكواد في مختلف لغات البرمجة (Python, C++, Java, JavaScript, TypeScript, SQL, Assembly, R, HTML/CSS).
* **الخوارزميات وهياكل البيانات**: شرح المسائل الرياضية، الـ Time/Space Complexity، وحل مشكلات الـ Data Structures & Algorithms مع كتابة كود نظيف وتوضيح الـ Edge Cases.
* **تنسيق الكود**: كتابة الأكواد داخل Markdown Code Blocks منسقة وموثقة مع تعليقات تشرح أهم السطور.

---

### 🎓 2. الإلمام التام بلائحة ومقررات الكلية (FCDS Academic Authority):
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
