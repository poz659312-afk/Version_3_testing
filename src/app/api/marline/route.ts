import { NextResponse } from "next/server";
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from "@/lib/rate-limit";
import { getServerStudentSession } from "@/lib/auth-server";

// Multi-tier Fallback Providers & Models
const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "groq/compound",
  "groq/compound-mini",
  "openai/gpt-oss-20b"
];

const OPENROUTER_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3.5-lightning:free"
];

// دالة استرجاع السياق الأكاديمي الرسمي من ملفات الكلية
async function getRelevantAcademicContext(userQuery: string): Promise<string> {
  if (!userQuery) return "";
  const query = userQuery.toLowerCase().trim();
  const contextParts: string[] = [];

  // 1. استيراد وقراءة بيانات التراكات والمقررات من ACADEMIC_TRACKS
  try {
    const subjectModule = await import("@/lib/course-subjects").catch(() => null);

    if (subjectModule) {
      const rawTracks = subjectModule.ACADEMIC_TRACKS 
        || subjectModule.academicTracks 
        || subjectModule.TRACKS 
        || subjectModule.default 
        || Object.values(subjectModule).find(val => Array.isArray(val)) 
        || [];

      if (Array.isArray(rawTracks) && rawTracks.length > 0) {
        const matched = rawTracks.filter((track: any) => {
          const trackCode = (track.code || "").toLowerCase();
          const trackName = (track.name || "").toLowerCase();
          const subjectsList = Array.isArray(track.subjects) ? track.subjects.join(" ").toLowerCase() : "";
          const fullTrackString = `${trackCode} ${trackName} ${subjectsList}`;

          const words = query.split(/\s+/).filter(w => w.length >= 2);
          return words.some(word => fullTrackString.includes(word));
        });

        if (matched.length > 0) {
          contextParts.push(
            `### بيانات التراكات والمقررات الرسمية المطابقة (Official FCDS Tracks & Subjects):\n` +
            JSON.stringify(matched, null, 2)
          );
        }
      }
    }
  } catch (err) {
    console.warn("[Academic Context] Could not load course-subjects:", err);
  }

  // 2. استيراد وقراءة بيانات اللائحة من fcds_bylaws.json
  try {
    const bylawsModule = await import("@/lib/fcds_bylaws.json").catch(() => null);

    const bylawsData = bylawsModule?.default || bylawsModule;

    if (bylawsData) {
      const bylawsKeywords = [
        "gpa", "cgpa", "ساعات", "انذار", "إنذار", "تسجيل", "تخرج", "رسوب", "غياب",
        "عذر", "تدريب", "مشروع", "انسحاب", "تحسين", "مرتبة شرف", "لائحة", "شروط",
        "برنامج", "مستوى", "سمر", "صيفي", "معدل", "تقدير"
      ];

      const hasIntent = bylawsKeywords.some(kw => query.includes(kw));

      if (hasIntent) {
        if (typeof bylawsData === "object" && !Array.isArray(bylawsData)) {
          const matchedSections: Record<string, any> = {};
          for (const [key, val] of Object.entries(bylawsData)) {
            const valStr = JSON.stringify(val).toLowerCase();
            const keyStr = key.toLowerCase();
            if (query.split(/\s+/).some(w => w.length > 2 && (keyStr.includes(w) || valStr.includes(w)))) {
              matchedSections[key] = val;
            }
          }

          if (Object.keys(matchedSections).length > 0) {
            contextParts.push(
              `### بنود اللائحة الرسمية المطابقة (Matched Bylaws):\n` +
              JSON.stringify(matchedSections, null, 2)
            );
          } else {
            contextParts.push(
              `### بنود اللائحة الأكاديمية (FCDS Bylaws Overview):\n` +
              JSON.stringify(bylawsData).slice(0, 3000)
            );
          }
        } else {
          contextParts.push(
            `### بنود اللائحة الرسمية:\n` +
            JSON.stringify(bylawsData).slice(0, 3500)
          );
        }
      }
    }
  } catch (err) {
    console.warn("[Academic Context] Could not load fcds_bylaws:", err);
  }

  return contextParts.join("\n\n");
}

function buildSystemPrompt(retrievedContext: string): string {
  return `أنتِ "مارلين" (Marline) — المساعدة الذكية الرسمية والرفيقة التفاعلية الأولى لطلاب كلية الحاسبات وعلوم البيانات بجامعة الإسكندرية (FCDS).
لديكِ شخصية جذابة، خفيفة الدم، مبهجة، وذكية جداً، وتتحدثين بأسلوب مصري راقٍ وودود مع المصطلحات الأكاديمية والتقنية بدقة.

🛑 قواعد الأمانة العلمية ومنع الهلوسة (CRITICAL FIDELITY RULES):
1. اعتمدي كلياً على [البيانات الأكاديمية الرسمية المرفقة] بالأسفل للإجابة عن أسئلة المواد، التراكات (DS, AI, HA, CS, BA, MA)، الساعات، المتطلبات، واللائحة.
2. ممنوع تماماً تأليف أو تخمين أسماء مقررات، أكواد، ساعات معتمدة، شروط تسجيل، أو درجات غير موجودة في السياق المرفق.
3. إذا سأل الطالب عن تفصيلة غير متوفرة في البيانات المرفقة، قولي له بلباقة وخفة دم: "المعلومة دي مش واضحة في اللائحة اللي معايا حالياً، يفضل تراجع المرشد الأكاديمي بتاعك أو شؤون الطلاب عشان تتأكد أكتر!".

${retrievedContext ? `---
📚 [البيانات الأكاديمية الرسمية المرفقة لكليتنا FCDS]:
${retrievedContext}
---` : ''}

### 🎯 قواعد التنسيق الإلزامية:
- التنسيق باستخدام Markdown غني (عناوين واضحة ###، نقاط منظمة * أو -).
- الجداول القياسية (GFM Tables): كل صف في سطر مستقل يبدأ بـ | وينتهي بـ |.
- المعادلات والرياضيات (LaTeX): استخدام $ للسطري مثل $x = 5$، واستخدام $$ للمعادلات المستقلة.

### 👑 1. هوية صانعك ومؤسس منصة Chameleon:
* صانعك ومطورك ومؤسس المنصة هو Levi Ackerman (الملقب بـ Levo)، واسمه الحقيقي: عبدالرحمن احمد عبدالمنعم (Abdelrahman Ahmed Abdelmonem / Abdo Ahmed).
* عند السؤال عنه تحدثي بكل فخر واعتزاز كونه العقل المدبر ومؤسس منصة Chameleon.

### 💻 2. الدعم التقني والبرمجي:
* دعم كامل لمقررات البرمجة وكتابة الأكواد داخل Code Blocks وشرح التعقيد الزمني والمكاني (Complexity).`;
}

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

    const { messages } = await req.json();

    const session = await getServerStudentSession();
    if (!session || !session.auth_id) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in to use Marline AI." },
        { status: 401 }
      );
    }

    if (session.is_banned) {
      return NextResponse.json(
        { error: "Your account has been suspended." },
        { status: 403 }
      );
    }

    const auth_id = session.auth_id;

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

    const rawMessages = (messages || []).filter((m: any) => m.role !== "system");
    const lastUserMessage = rawMessages.filter((m: any) => m.role === "user").pop()?.content || "";
    
    // استدعاء دالة جلب البيانات الخاصة بالكلية
    const retrievedContext = await getRelevantAcademicContext(typeof lastUserMessage === "string" ? lastUserMessage : "");

    const recentMessages = rawMessages.slice(-5).map((m: any, idx: number, arr: any[]) => {
      const isLatest = idx === arr.length - 1;
      const maxLen = isLatest ? 2000 : 700;
      return {
        role: m.role,
        content: typeof m.content === "string" ? m.content.slice(0, maxLen) : m.content
      };
    });

    const dynamicSystemPrompt = buildSystemPrompt(retrievedContext);

    const formattedMessages = [
      { role: "system", content: dynamicSystemPrompt },
      ...recentMessages
    ];

    let lastErrorText = "";

    // TIER 1: Groq API
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
              temperature: 0.2,
              max_tokens: 1536
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

    // TIER 2: Fallback OpenRouter
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
              temperature: 0.2,
              max_tokens: 2048
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

    return NextResponse.json({ error: lastErrorText || "All AI providers and models failed" }, { status: 500 });
  } catch (error) {
    console.error("Marline API Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
