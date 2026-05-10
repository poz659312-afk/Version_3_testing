import pdfParse from 'pdf-parse';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const document = formData.get('document') as File;

    if (!document) return new Response('No document provided', { status: 400 });

    const buffer = await document.arrayBuffer();
    const parseFunction = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default;
    const data = await parseFunction(Buffer.from(buffer));

    return Response.json({ text: data.text });
  } catch (error) {
    console.error('PDF analysis error:', error);
    return new Response(`Failed to analyze PDF: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
