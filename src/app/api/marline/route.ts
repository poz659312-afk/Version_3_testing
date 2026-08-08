import { NextResponse } from "next/server";
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from "@/lib/rate-limit";

const MARLINE_MODELS = [
  "google/gemini-2.5-flash",
  "meta-llama/llama-3.3-70b-instruct",
  "google/gemini-flash-1.5"
];

const MARLINE_SYSTEM_PROMPT = `أنت "مارلين" (Marline AI) - المساعد الذكي والمرافق الأكاديمي الرسمي لموقع Chameleon الخاص بطلاب كلية الحاسبات وعلوم البيانات (FCDS).

شخصيتك (Persona):
- ذكي، ودود، متعاطف، مشجع، ولديك معرفة عميقة في البرمجة، العلوم والهندسة، الخوارزميات، الذكاء الاصطناعي، وقواعد البيانات.
- تتحدث العربية بطلاقة وسلاسة مع قدرة كاملة على الإجابة بالإنجليزية أو الإنجليزية الأكاديمية عند الحاجة.
- تعرف كافة فيتشرز موقع Chameleon (الدراسة، المساحات الدراسة Study Spaces، ملفات Google Drive للمواد، معارك الكويزات Quiz Battles، حاسبة المعدل GPA Calculator، والملخصات).

طريقة تنسيق الإجابات (Formatting Rules):
1. استخدم GFM Markdown بالكامل في كل الإجابات (عناوين ###، قوائم، نصوص عريضة **text**).
2. بالنسبة للأكواد البرمجية: ضعها دائماً داخل Code Blocks مغلقة موضحاً اسم اللغة (مثل \`\`\`python أو \`\`\`cpp أو \`\`\`javascript).
3. بالنسبة للمعادلات الرياضية والهندسية: استخدم KaTeX (مثل $$ E = mc^2 $$ للمعادلات المستقلة و $x^2$ للمعادلات المدمجة).
4. نظم الإجابات الطويلة إلى نقاط محددة وسهلة القراءة.
5. لا تشير لنفسك بـ "Explo" إطلاقاً، اسمك الدائم هو "مارلين" (Marline).`;

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

    const { messages, stream = false } = await req.json();

    // Ensure system prompt is at the top
    const formattedMessages = [
      { role: "system", content: MARLINE_SYSTEM_PROMPT },
      ...(messages || []).filter((m: any) => m.role !== "system")
    ];

    let lastErrorText = "";

    // Try models in fallback order
    for (const model of MARLINE_MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://chameleon-v3.vercel.app",
            "X-Title": "Marline AI Assistant",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: formattedMessages,
            stream: stream,
            temperature: 0.7,
            max_tokens: 2048
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        } else {
          lastErrorText = await response.text();
          console.warn(`Marline AI model ${model} failed (${response.status}):`, lastErrorText);
        }
      } catch (err) {
        console.warn(`Marline AI fetch error for model ${model}:`, err);
      }
    }

    return NextResponse.json({ error: lastErrorText || "All AI model attempts failed" }, { status: 500 });
  } catch (error) {
    console.error("Marline API Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
