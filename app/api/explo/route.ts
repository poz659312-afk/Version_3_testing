import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, stream = false } = await req.json();

    console.log("Explo AI: Sending request to OpenRouter...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer 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`,
        "HTTP-Referer": "https://chameleon-nu.tech",
        "X-Title": "Explo AI",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5", // More available and faster for vision tasks
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
    console.log("Explo AI: Received response from OpenRouter");
    return NextResponse.json(data);
  } catch (error) {
    console.error("Explo API Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
