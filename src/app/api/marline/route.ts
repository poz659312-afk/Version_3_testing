import { NextResponse } from "next/server";
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from "@/lib/rate-limit";

// Optimized model list for fast token-efficient streaming
const MARLINE_MODELS = [
  "google/gemini-2.5-flash",
  "meta-llama/llama-3.3-70b-instruct",
  "google/gemini-flash-1.5"
];

// Compressed System Prompt (~75 tokens total) for MAXIMUM token optimization
const MARLINE_SYSTEM_PROMPT = `أنت "مارلين" (Marline AI) - المساعد الأكاديمي لطلاب حاسبات وعلوم البيانات (FCDS).
- قدم إجابات مباشرة وموجزة ومنظمة بدون مقدمات أو حشو.
- اكتب الأكواد داخل كتل مغلقة محددة اللغة (\`\`\`python).
- استخدم KaTeX للمعادلات ($x^2$).
- اختصص حصرياً في الحاسبات، علوم البيانات، البرمجة، والـ GPA.`;

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

    // TOKEN OPTIMIZATION: Keep System Prompt + last 4 messages ONLY to save ~80% context tokens
    const recentMessages = (messages || [])
      .filter((m: any) => m.role !== "system")
      .slice(-4)
      .map((m: any) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content.slice(0, 1500) : m.content
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
            temperature: 0.5,
            max_tokens: 1024
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
