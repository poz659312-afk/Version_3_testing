import { createHuggingFace } from '@ai-sdk/huggingface';
import { streamText } from 'ai';
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from '@/lib/rate-limit';

const apiKey = process.env.HUGGINGFACE_API_KEY;
const MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI service configuration error: Missing API Key' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const identifier = getRequestIdentifier(req);
    const rateLimit = checkRateLimit(identifier, RateLimitTier.AI);
    if (!rateLimit.success) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          },
        }
      );
    }

    const hf = createHuggingFace({
      baseURL: 'https://api-inference.huggingface.co/models/',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const { messages } = await req.json();

    let prompt = "System: You are a helpful AI assistant capable of creating quizzes and summarizing text. Be brief, accurate, and format output in markdown.\n\n";
    const formatedPrompt = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n') + '\nAssistant: ';
    const completePrompt = prompt + formatedPrompt;

    const result = streamText({
      model: hf(MODEL),
      prompt: completePrompt,
      maxTokens: 1024,
      temperature: 0.5,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error in HF route:', error);
    return new Response(JSON.stringify({ error: 'Error contacting AI service' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const dynamic = 'force-dynamic';
