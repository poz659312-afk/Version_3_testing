import { NextResponse } from "next/server";
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from "@/lib/rate-limit";

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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://chameleon-nu.vercel.app",
        "X-Title": "Explo AI",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        messages: messages,
        stream: stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter Error (${response.status}):`, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json({ error: errorJson.error || "Failed to fetch from OpenRouter" }, { status: response.status });
      } catch (e) {
        return NextResponse.json({ error: errorText || "Unknown OpenRouter Error" }, { status: response.status });
      }
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Explo API Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
