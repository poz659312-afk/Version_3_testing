import { NextRequest, NextResponse } from 'next/server';
import { getServerStudentSession } from '@/lib/auth-server';
import { checkRateLimit, RateLimitTier } from '@/lib/rate-limit';
import { getFileMetadata, downloadFileFromDrive, exportGoogleDocContent } from '@/lib/google-drive';
// Use a more robust import for pdf-parse to avoid "not a function" errors in different environments
import pdf from 'pdf-parse';
const pdfParse = pdf;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerStudentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: 10 requests per day
    const rateLimit = checkRateLimit(session.auth_id, RateLimitTier.AI);
    if (!rateLimit.success) {
      return NextResponse.json({ 
        error: 'Daily limit reached. You can perform 10 AI actions per day.',
        reset: rateLimit.reset
      }, { status: 429 });
    }

    const { fileId, task, language = 'English', messages = [] } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    // 1. Fetch File Metadata
    const userId = session.auth_id; // Fix: Use auth_id which is the Supabase UUID used in Drive logic
    const metadata = await getFileMetadata(userId, fileId);
    let fileContent = '';
    let isImage = metadata.mimeType.startsWith('image/');

    // 2. Extract Text based on MimeType (only if no messages yet or needed for context)
    if (messages.length <= 1) {
      try {
        if (metadata.mimeType === 'application/vnd.google-apps.document') {
          fileContent = await exportGoogleDocContent(userId, fileId, 'text/plain');
        } else if (metadata.mimeType === 'application/pdf') {
          const buffer = await downloadFileFromDrive(userId, fileId);
          // Robust PDF parsing with explicit function check
          try {
            const data = await pdfParse(buffer);
            fileContent = data.text;
          } catch (pdfError) {
            console.error("PDF Parsing Error:", pdfError);
            fileContent = "[Error parsing PDF content]";
          }
        } else if (metadata.mimeType.startsWith('text/') || metadata.mimeType === 'application/json') {
          const buffer = await downloadFileFromDrive(userId, fileId);
          fileContent = buffer.toString('utf-8');
        }
      } catch (extractError) {
        console.error("Error extracting file content:", extractError);
        // Don't fail completely if content extraction fails, AI might still be able to help with metadata
        fileContent = "[Error extracting file content context]";
      }
    }

    // 3. Prepare AI Prompt
    let model = "meta-llama/llama-3.1-8b-instruct";
    let systemPrompt = `You are Chameleon AI, a helpful file assistant. 
    You are assisting with a file named "${metadata.name}".
    Language: ${language}.
    ${isImage ? "This is an image file. Analyze its visual content if asked." : `File Content Context:\n${fileContent.substring(0, 12000)}`}
    Respond in ${language}. Use Markdown formatting for clarity.`;

    let apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    // Handle task shortcuts (backward compatibility for initial triggers)
    if (task && messages.length === 0) {
      if (task === 'summarize') {
        apiMessages.push({ role: "user", content: `Please provide a concise, structured summary of this file in ${language}.` });
      } else if (task === 'quiz') {
        model = "meta-llama/llama-3.1-70b-instruct";
        apiMessages.push({ role: "user", content: `Generate a structured JSON array of 5-10 quiz questions about this file. Format: [{"numb":1, "question":"...", "type":"Multiple Choice", "answer":"...", "options":["..."], "explanation":"..."}]. Output ONLY the JSON.` });
      } else if (task === 'translate') {
        apiMessages.push({ role: "user", content: `Translate the key points of this file into ${language}.` });
      }
    }

    // 4. Call OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chameleon-ai.edu",
        "X-Title": "Chameleon AI"
      },
      body: JSON.stringify({
        model: model,
        messages: apiMessages
      })
    });

    const aiData = await response.json();
    
    if (aiData.error) {
      console.error("OpenRouter Error:", aiData.error);
      return NextResponse.json({ error: aiData.error.message || 'AI service error' }, { status: 502 });
    }

    let result = aiData.choices?.[0]?.message?.content;

    // Quiz parsing logic (same as before)
    if (task === 'quiz' && messages.length === 0) {
      try {
        const cleaned = result.replace(/```json|```/g, '').trim();
        result = JSON.parse(cleaned);
        if (!Array.isArray(result) && result.questions) result = result.questions;
      } catch (e) {
        console.error("Failed to parse quiz JSON:", e);
      }
    }

    return NextResponse.json({ result });

  } catch (error) {
    console.error('AI processing error:', error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
