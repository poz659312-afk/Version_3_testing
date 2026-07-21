import pdfParse from 'pdf-parse';
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from '@/lib/rate-limit';

export const runtime = 'nodejs';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export async function POST(req: Request) {
  try {
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
    const document = formData.get('document') as File;

    if (!document) {
      return new Response(JSON.stringify({ error: 'No document provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (document.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'PDF file size exceeds maximum limit of 10MB' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const buffer = await document.arrayBuffer();
    const parseFunction = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default;
    const data = await parseFunction(Buffer.from(buffer));

    return Response.json({ text: data.text });
  } catch (error) {
    console.error('PDF analysis error:', error);
    return new Response(
      JSON.stringify({ error: `Failed to analyze PDF: ${error instanceof Error ? error.message : String(error)}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const dynamic = 'force-dynamic';
