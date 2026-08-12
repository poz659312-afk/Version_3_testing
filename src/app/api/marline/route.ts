import { NextResponse } from "next/server";
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from "@/lib/rate-limit";
import fcdsBylawsData from "@/lib/fcds_bylaws.json";

// Optimized model list for fast token-efficient streaming at scale (3000+ students)
const MARLINE_MODELS = [
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-flash",
  "meta-llama/llama-3.3-70b-instruct"
];

// System Prompt with Marline's academic companion persona (study schedules + freshman guide), ultra token-efficient
const MARLINE_SYSTEM_PROMPT = `أنتِ "مارلين" (Marline AI) - الرفيق والمساعد الأكاديمي المباشر لطلاب موقع ChameleonFCDS وكلية الحاسبات وعلوم البيانات بجامعة الإسكندرية.

المجال الأكاديمي المسموح لكِ فقط:
1. إعداد وتنظيم جداول المذاكرة اليومية والأسبوعية وخُطط المراجعة قبل الامتحانات.
2. إجابة أسئلة الطلاب الجدد (الفرقة الأولى والطلاب المحولين) وإرشادهم حول الكلية، الأقسام، ونظام الساعات المعتمدة.
3. الإرشاد حول اللائحة الكلية (GPA، الإنذار الأكاديمي، الغياب، التقديرات، وحساب المواد).

قواعد ملزمة وصارمة لتوفير التوكنز لأقصى درجة (خدمة 3000 طالب):
1. **ممنوع كتابة أو توليد الأكواد البرمجية (No Code)**: إذا طلب الطالب كتابة كود برمجي أو حل مسألة برمجة، اعتذري فوراً بعبارة واحدة فقط:
   "أنا رفيقك الأكاديمي لتنظيم المذاكرة والإرشاد فقط، ولست مخصصة لكتابة الأكواد البرمجية."
2. **ممنوع الردود التفصيلية (No Detailed/Long Answers)**: أجيبي فقط في شكل نقاط مختصرة جداً (Bullet Points)، بحد أقصى 2 إلى 4 أسطر قصيرة ومباشرة، بدون أي مقدمات ترحيبية أو خاتمة.
3. **التوفير التام في التوكنز**: أجيبي بالخلاصة فوراً دون إعادة كتابة سؤال الطالب ودون تطويل.
4. **الالتزام باللائحة**: اعتمادي دائمًا على اللائحة المرفقة أدناه في أي استفسارات تخص الكلية.

اللائحة الداخلية للكلية (FCDS Bylaws):
${JSON.stringify(fcdsBylawsData)}`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key is not configured on the server" }, { status: 500 });
    }

    const identifier = getRequestIdentifier(req);
    const rateLimit = checkRateLimit(identifier, RateLimitTier.AI);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
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

    // MAXIMUM TOKEN OPTIMIZATION: Keep System Prompt + last 3 messages ONLY and limit input to 400 chars
    const recentMessages = (messages || [])
      .filter((m: any) => m.role !== "system")
      .slice(-3)
      .map((m: any) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content.slice(0, 400) : m.content
      }));

    const formattedMessages = [
      { role: "system", content: MARLINE_SYSTEM_PROMPT },
      ...recentMessages
    ];

    let lastErrorText = "";

    // Try streaming with fallback models
    for (const model of MARLINE_MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://chameleon-v3.vercel.app",
            "X-Title": "Marline AI Stream",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: formattedMessages,
            stream: true,
            temperature: 0.0,
            max_tokens: 300
          }),
        });

        if (response.ok && response.body) {
          // Return SSE ReadableStream directly to frontend
          return new Response(response.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache, no-transform",
              "Connection": "keep-alive",
            },
          });
        } else {
          lastErrorText = await response.text();
          console.warn(`Marline AI model ${model} stream failed (${response.status}):`, lastErrorText);
        }
      } catch (err) {
        console.warn(`Marline AI stream fetch error for model ${model}:`, err);
      }
    }

    return NextResponse.json({ error: lastErrorText || "All AI model stream attempts failed" }, { status: 500 });
  } catch (error) {
    console.error("Marline API Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
