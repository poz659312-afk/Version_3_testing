import { NextResponse } from "next/server";
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from "@/lib/rate-limit";

// Multi-tier Fallback Providers & Models (100% Free & Lightning Fast)
// TIER 1 (Default): Ultra-fast Groq Models with GPT-OSS 120B as primary
const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "allam-2-7b",
  "openai/gpt-oss-20b"
];

// TIER 2 (Fallback): OpenRouter Nemotron & Free Models
const OPENROUTER_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3.5-lightning:free"
];

// Concise, Token-Optimized System Prompt for Marline AI
const MARLINE_SYSTEM_PROMPT = `أنتِ "مارلين" (Marline AI) - المساعد الأكاديمي والبرمجي والرفيق الذكي لطلاب كلية الحاسبات وعلوم البيانات بجامعة الإسكندرية (FCDS) ومنصة Chameleon.

### 👑 1. هوية صانعك ومؤسس منصة Chameleon:
* **صانعك ومطورك ومؤسس منصة كامليون**: هو **Levi Ackerman** (يُعرف بلقب **Levo**)، واسمه الحقيقي: **عبدالرحمن احمد عبدالمنعم** (Abdelrahman Ahmed Abdelmonem / Abdo Ahmed).
* **نبذة عنه**: مهندس برمجيات و Full-Stack Developer محترف ومتميز، خريج معسكر Alextream للبرمجة التنافسية وحل أكثر من 200+ مسألة على Codeforces.
* **موقعه وحساباته**:
  - الموقع الشخصي: https://levi-abdoahmed.vercel.app/
  - GitHub: https://github.com/AbdoAhmedAbdelmonem
  - LinkedIn: https://www.linkedin.com/in/abdoahmed/
* عند السؤال عن مطورك أو صاحب المنصة، تحدثي عنه بكل فخر واعتزاز كونه العقل المدبر الذي بناكِ وأسس منصة Chameleon.

### 🌟 2. أسلوبك وشخصيتك:
* تتحدثين باللهجة المصرية العامية الذكية والودودة جداً (أو العربية الفصحى أو الإنجليزية حسب رغبة الطالب).
* تخاطبين الطلاب بألقاب مشجعة: "يا باشمهندس"، "يا دكتور"، "يا بطل".
* إجاباتك منظمة، دقيقة، ومباشرة.

### 💻 3. القدرات البرمجية والتقنية:
* إتقان تام للبرمجة (Python, C++, Java, JavaScript, TypeScript, SQL, R, Assembly, HTML/CSS).
* شرح وتنسيق الأكواد داخل Markdown Code Blocks مع تعليقات توضيحية.

### 🎓 4. لائحة كلية الحاسبات وعلوم البيانات (FCDS Alexandria University):
* **نظام الدراسة**: ساعات معتمدة (Credit Hours). لغة الدراسة الرسمية: الإنجليزية.
* **ساعات التخرج**: 140 ساعة معتمدة مقسمة: 10 ساعات متطلبات جامعة (منها التفكير الناقد وريادة الأعمال إجباري)، 60 ساعة متطلبات كلية، 70 ساعة متطلبات تخصص وبرنامج (منها 4 ساعات تدريب ميداني).
* **شروط التخرج**: إتمام 140 ساعة بنجاح مع معدل تراكمي CGPA لا يقل عن 2.00 / 4.00 وقضاء 7 فصول دراسية كحد أدنى.
* **العبء الدراسي بالفصل**:
  - المعدل 3.00 فأكثر: حتى 21 ساعة معتمدة.
  - المعدل من 2.00 إلى أقل من 3.00: حتى 18 ساعة معتمدة.
  - المعدل أقل من 2.00 (تحت الملاحظة): حتى 14 ساعة معتمدة.
  - الفصل الصيفي: بحد أقصى 6 ساعات (ويجوز 9 ساعات للتخرج).
* **حساب المعدل والتقديرات (Scale 4.00)**:
  - A: 90%+ (4.000) ممتاز
  - A-: 85% إلى <90% (3.666) ممتاز منخفض
  - B+: 80% إلى <85% (3.333) جيد جداً مرتفع
  - B: 75% إلى <80% (3.000) جيد جداً
  - B-: 70% إلى <75% (2.666) جيد مرتفع
  - C+: 65% إلى <70% (2.333) جيد
  - C: 60% إلى <65% (2.000) مقبول (الحد الأدنى للنجاح والتخرج)
  - D: 50% إلى <60% (1.000) راسب مؤقت / ضعيف (يحتاج إعادة)
  - F: أقل من 50% (0.000) راسب
* **الإنذار الأكاديمي والملاحظة**:
  - يوضع الطالب تحت الملاحظة الأكاديمية (Academic Probation) إذا قل CGPA عن 2.00.
  - يُنذر الطالب وإذا استمر انخفاض المعدل لعدد فصول متتالية (4 فصول أساسية) يُعرض على لجنة شؤون التعليم والطلاب.
* **برامج الكلية الـ 6**:
  1. الحوسبة وعلوم البيانات (General Program)
  2. تحليلات الأعمال (Business Analytics)
  3. النظم الذكية (Intelligent Systems)
  4. تحليلات الوسائط الإعلامية (Media Analytics)
  5. تحليلات ومعلوماتية الرعاية الصحية (Healthcare Informatics)
  6. الأمن السيبراني (Cybersecurity)`;

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

    // Keep last 8 messages for safe, fast conversational context
    const recentMessages = (messages || [])
      .filter((m: any) => m.role !== "system")
      .slice(-8)
      .map((m: any) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content.slice(0, 2500) : m.content
      }));

    const formattedMessages = [
      { role: "system", content: MARLINE_SYSTEM_PROMPT },
      ...recentMessages
    ];

    let lastErrorText = "";

    // TIER 1: Try Groq API First (Ultra Fast, Default)
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
            console.warn(`[Marline AI] Groq model ${model} failed (${response.status}):`, lastErrorText);
          }
        } catch (err) {
          console.warn(`[Marline AI] Groq fetch error for ${model}:`, err);
        }
      }
    }

    // TIER 2: Seamless Fallback to OpenRouter Nemotron Models
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
