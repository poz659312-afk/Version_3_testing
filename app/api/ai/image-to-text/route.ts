import { HfInference } from '@huggingface/inference';

const Hf = new HfInference(process.env.HUGGINGFACE_API_KEY || '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');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;
    
    if (!image) return new Response('No image provided', { status: 400 });
    
    const buffer = await image.arrayBuffer();
    
    // Using a reliable vision-to-text model on the free tier to understand images
    const result = await Hf.imageToText({
      data: buffer,
      model: 'Salesforce/blip-image-captioning-large',
    });
    
    return Response.json({ text: result.generated_text });
  } catch (error) {
    console.error('Image analysis error:', error);
    return new Response('Failed to analyze image', { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
