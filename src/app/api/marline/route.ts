import { NextResponse } from "next/server";
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from "@/lib/rate-limit";
import fcdsBylawsData from "@/lib/fcds_bylaws.json";

// Optimized model list for fast token-efficient streaming at scale (3000+ students)
const MARLINE_MODELS = [
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-flash",
  "meta-llama/llama-3.3-70b-instruct"
];

// System Prompt with Marline's academic guide persona, ultra token-efficient & complete outputs
const MARLINE_SYSTEM_PROMPT = `أنتِ "مارلين" (Marline AI) - المرشد والمساعد الأكاديمي المباشر لطلاب موقع ChameleonFCDS وكلية الحاسبات وعلوم البيانات بجامعة الإسكندرية.

قواعد التوفير والإجابة الإلزامية (مخصصة لخدمة 3000 طالب بكفاءة عالية):
1. إجابات مختصرة ومباشرة (Ultra-Concise): أجيبي فوراً بالخلاصة والمطلوب بدون أي مقدمات ترحيبية مكررة، وبدون إعادة كتابة سؤال الطالب، وبدون خاتمة طويلة.
2. عدم التوقف أو التعطيل في المنتصف (Never Cut Off): اكتبي الإجابة بأسلوب مركز ومختصر مع الالتزام التام بإكمال الجملة الأخيرة دائمًا وعدم ترك الرد بترًا أو معطلاً في المنتصف.
3. التخصص الأكاديمي (Academic Scope): دورك هو الإرشاد الأكاديمي والجامعي والتوضيح المباشر. إذا كان السؤال خارج هذا النطاق، وجّهي الطالب بلطف وباختصار شديد للتركيز على الجانب الأكاديمي.
4. الاعتماد على اللائحة الرسمية: اعتمادي على اللائحة الداخلية الرسمية المرفقة أدناه في أسئلة (التقديرات، GPA، الساعات المعتمدة، الإنذار الأكاديمي، الغياب 75%، والتخرج).
5. الأكواد والمعادلات: إن طُلب كود أو معادلة، اكتبي أقصر حل برمجي ممكن ومباشر دون شرح مطول.

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

    // MAXIMUM TOKEN OPTIMIZATION: Keep System Prompt + last 3 messages ONLY and limit input to 800 chars
    const recentMessages = (messages || [])
      .filter((m: any) => m.role !== "system")
      .slice(-3)
      .map((m: any) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content.slice(0, 800) : m.content
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
            max_tokens: 600
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
