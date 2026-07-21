import { HfInference } from '@huggingface/inference';
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from '@/lib/rate-limit';

const apiKey = process.env.HUGGINGFACE_API_KEY;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

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

    const formData = await req.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (image.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'Image file size exceeds maximum limit of 10MB' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const buffer = await image.arrayBuffer();
    const Hf = new HfInference(apiKey);
    
    const result = await Hf.imageToText({
      data: buffer,
      model: 'Salesforce/blip-image-captioning-large',
    });
    
    return Response.json({ text: result.generated_text });
  } catch (error) {
    console.error('Image analysis error:', error);
    return new Response(JSON.stringify({ error: 'Failed to analyze image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const dynamic = 'force-dynamic';
