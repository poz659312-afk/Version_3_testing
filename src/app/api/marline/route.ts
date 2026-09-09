import { NextResponse } from "next/server";
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from "@/lib/rate-limit";
import { getServerStudentSession } from "@/lib/auth-server";
import { MARLINE_SYSTEM_PROMPT } from "@/lib/marline-knowledge";
import { getBylawContextForQuery } from "@/lib/marline/bylaw-retriever";
import { marlineRouter } from "@/lib/marline/router";
import { estimateTokens } from "@/lib/token-budget-manager";
import { getProviderLayerInfo } from "@/lib/marline/providers/config";

export async function POST(req: Request) {
  try {
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
      const supabaseAdmin = createAdminClient();
      const { data: userRecord } = await (supabaseAdmin as any)
        .from('chameleons')
        .select('ai_credits')
        .eq('auth_id', auth_id)
        .single();

      const currentCredits = (userRecord as { ai_credits?: number } | null)?.ai_credits ?? 20;
      if (currentCredits <= 0) {
        return NextResponse.json(
          { error: "لقد استنفدت رصيد الأسئلة اليومي (0/20 سؤالاً). يرجى العودة غداً عند تجديد الرصيد!" },
          { status: 429 }
        );
      }

      await (supabaseAdmin as any)
        .from('chameleons')
        .update({ ai_credits: Math.max(0, currentCredits - 1) })
        .eq('auth_id', auth_id);
    } catch (dbErr) {
      console.warn("Could not update ai_credits in DB:", dbErr);
    }


    // Token-efficient conversational history pruning (keep last 5 messages, truncate older turns)
    const rawMessages = (Array.isArray(messages) ? messages : []).filter(
      (m: { role?: string; content?: unknown }) => m && m.role !== "system"
    );
    const recentMessages = rawMessages.slice(-5).map((m: { role?: string; content?: unknown }, idx: number, arr: unknown[]) => {
      const isLatest = idx === arr.length - 1;
      const maxLen = isLatest ? 2000 : 700;
      return {
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: typeof m.content === "string" ? m.content.slice(0, maxLen) : String(m.content ?? '')
      };
    });

    // Dynamic bylaw grounding if user asks about courses, codes, or prerequisites
    const latestUserQuery = recentMessages.filter(m => m.role === 'user').slice(-1)[0]?.content || "";
    const bylawContext = getBylawContextForQuery(latestUserQuery);

    const effectiveSystemPrompt = bylawContext
      ? `${MARLINE_SYSTEM_PROMPT}\n\n${bylawContext}`
      : MARLINE_SYSTEM_PROMPT;

    const formattedMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: "system", content: effectiveSystemPrompt },
      ...recentMessages
    ];

    const inputTokens = estimateTokens(JSON.stringify(formattedMessages));

    // Route across 5-layer system with transparent fallback
    const streamResponse = await marlineRouter.executeStreamWithFallback(
      {
        messages: formattedMessages,
        maxTokens: 2800,
        temperature: 0.25,
      },
      {
        task: 'chat',
        inputTokens,
        desiredOutputTokens: 2800,
        requiresStreaming: true,
      }
    );

    const { tier, tierLabel } = getProviderLayerInfo(streamResponse.provider);

    return new Response(streamResponse.stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-AI-Tier": tier,
        "X-AI-Tier-Label": tierLabel,
        "X-AI-Provider": streamResponse.provider,
        "X-AI-Model": streamResponse.model,
      },
    });

  } catch (error: unknown) {
    console.error("Marline API Internal Error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
