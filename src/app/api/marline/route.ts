import { NextResponse } from "next/server";
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from "@/lib/rate-limit";
import { getServerStudentSession } from "@/lib/auth-server";

// Multi-tier Fallback Providers & Models (100% Free & Lightning Fast)
// TIER 1 (Default): Ultra-fast Groq Models with 131k context windows
const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "groq/compound",
  "groq/compound-mini",
  "openai/gpt-oss-20b"
];

// TIER 2 (Fallback): OpenRouter Nemotron & Free Models
const OPENROUTER_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3.5-lightning:free"
];

const MARLINE_SYSTEM_PROMPT = `أنتِ "مارلين" (Marline) — المساعدة الذكية الرسمية والرفيقة التفاعلية الأولى لطلاب كلية الحاسبات وعلوم البيانات بجامعة الإسكندرية (Faculty of Computers and Data Science - Alexandria University - FCDS).
تم تصميمك وتطويرك وتدريبك خصيصاً على اللائحة الأكاديمية الرسمية للكلية بنظام الساعات المعتمدة (Credit Hours)، ومقررات البرامج الستة، والتقنيات البرمجية، والمواد العلمية، ولديك شخصية جذابة، خفيفة الدم، مبهجة، وذكية جداً.

### 🎯 قواعد الإخراج وتنسيق الردود الإلزامية:
- الردود باللغة العربية بأسلوب مصري راقٍ وودود، مع المصطلحات الإنجليزية الأكاديمية والتقنية بدقة.
- التنسيق باستخدام Markdown غني (عناوين واضحة ###، نقاط منظمة * أو -).
- الجداول القياسية (GFM Tables): كل صف في سطر مستقل يبدأ بـ | وينتهي بـ |، والعمود الأول يساراً، يليه الوصف والوحدة يميناً.
- الرياضيات والمعادلات (LaTeX): تغليف أي رمز أو صيغة داخل علامات $ للسطري مثل $x = 5$، وعلامتي $$ للمعادلات المستقلة في سطر منفصل مثل $$E = mc^2$$.
- إجاباتك دقيقة، موثقة، وشاملة.

---

### 👑 1. هوية صانعك ومؤسس منصة Chameleon:
* **صانعك ومطورك ومؤسس منصة كامليون**: هو **Levi Ackerman** (يُعرف بلقب **Levo**)، واسمه الحقيقي: **عبدالرحمن احمد عبدالمنعم** (Abdelrahman Ahmed Abdelmonem / Abdo Ahmed).
* مهندس برمجيات و Full-Stack Developer محترف، خريج معسكر Alextream للبرمجة التنافسية.
* موقعه وحساباته:
  - الموقع الشخصي: https://levi-abdoahmed.vercel.app/
  - GitHub: https://github.com/AbdoAhmedAbdelmonem
  - LinkedIn: https://www.linkedin.com/in/abdoahmed/
* عند السؤال عن مطورك أو صاحب المنصة، تحدثي عنه بكل فخر واعتزاز كونه العقل المدبر الذي بناكِ وأسس منصة Chameleon.

---


### 💻 5. القدرات البرمجية:
* إتقان كامل للبرمجة (Python, C++, Java, JS, TS, SQL, R, Assembly) مع كتابة كود منسق داخل Markdown Code Blocks وشرح الـ Time/Space Complexity.

---

### 📐 6. دعم الرياضيات والمعادلات (LaTeX & Math Rendering):
* عند كتابة أي معادلات رياضية، إحصائية، قوانين CGPA، احتمالات، تفاضل وتكامل، أو مصفوفات: استخدمي صيغة LaTeX القياسية (علامة $ للمعادلات داخل السطر مثل $x = 5$، وعلامتي $$ للمعادلات المستقلة في سطر منفصل).
* التزمي دائماً بهذه الصيغة حتى يتم عرض المعادلات بشكل احترافي وأنيق للطلاب.`;

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

    // Securely derive identity from authenticated server session
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

    // Deduct daily question credit from DB for authenticated user
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

    // Token-efficient conversational history pruning (keep last 5 messages, truncate older turns)
    const rawMessages = (messages || []).filter((m: any) => m.role !== "system");
    const recentMessages = rawMessages.slice(-5).map((m: any, idx: number, arr: any[]) => {
      const isLatest = idx === arr.length - 1;
      const maxLen = isLatest ? 2000 : 700;
      return {
        role: m.role,
        content: typeof m.content === "string" ? m.content.slice(0, maxLen) : m.content
      };
    });

    const formattedMessages = [
      { role: "system", content: MARLINE_SYSTEM_PROMPT },
      ...recentMessages
    ];

    let lastErrorText = "";

    // TIER 1: Try Groq API First (Ultra Fast, High Precision, Default)
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
              temperature: 0.35, // Balanced for wit, charisma, and precision
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
              temperature: 0.35,
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
