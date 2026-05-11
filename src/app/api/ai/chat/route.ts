import { createHuggingFace } from '@ai-sdk/huggingface';
import { streamText } from 'ai';

const hf = createHuggingFace({
  baseURL: 'https://api-inference.huggingface.co/models/',
  headers: {
    Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY || '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'}`,
  },
});

const MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';

export async function POST(req: Request) {
  try {
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
    return new Response('Error contacting AI', { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
