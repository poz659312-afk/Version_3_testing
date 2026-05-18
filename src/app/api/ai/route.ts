import { NextRequest, NextResponse } from 'next/server';
import { getServerStudentSession } from '@/lib/auth-server';
import { checkRateLimit, RateLimitTier } from '@/lib/rate-limit';
import { google } from 'googleapis';
import pdf from 'pdf-parse';

const pdfParse = pdf;

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Google Gemini 2.5 Flash: الأفضل في سرعة المعالجة، تلافي الهلوسة والتكرار اللانهائي، ودعم كامل وذكي جداً للغة العربية والـ Mermaid والـ LaTeX.
const PRIMARY_AI_MODEL = "google/gemini-2.5-flash";

// موديل سريع وخفيف للمحادثات العادية
const FAST_CHAT_MODEL = "google/gemini-2.5-flash";

export async function POST(req: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      console.error("Missing OPENROUTER_API_KEY environment variable");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const session = await getServerStudentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const drive = google.drive({ 
      version: 'v3', 
      auth: process.env.GOOGLE_DRIVE_API_KEY 
    });

    const metadataResponse = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink, parents'
    });
    const metadata = metadataResponse.data;

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (metadata.size && parseInt(metadata.size) > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File is too large. Maximum size is 10MB.' }, { status: 413 });
    }

    let fileContent = '';
    let isImage = metadata.mimeType?.startsWith('image/');

    if (messages.length <= 1) {
      try {
        if (metadata.mimeType === 'application/vnd.google-apps.document') {
          const exportResponse = await drive.files.export(
            { fileId, mimeType: 'text/plain' },
            { responseType: 'text' }
          );
          fileContent = exportResponse.data as string;
        } else if (metadata.mimeType === 'application/pdf') {
          const dlResponse = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' }
          );
          const buffer = Buffer.from(dlResponse.data as ArrayBuffer);
          const data = await pdfParse(buffer);
          fileContent = data.text;
        } else if (metadata.mimeType?.startsWith('text/') || metadata.mimeType === 'application/json') {
          const dlResponse = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' }
          );
          const buffer = Buffer.from(dlResponse.data as ArrayBuffer);
          fileContent = buffer.toString('utf-8');
        }
      } catch (extractError) {
        console.error("Error extracting file content:", extractError);
        return NextResponse.json({ error: 'Failed to extract text from the document. The file might be corrupted, protected, or empty.' }, { status: 422 });
      }
    }

    // تحديد الموديل الافتراضي للمحادثات العادية
    let currentModel = FAST_CHAT_MODEL;
    
    const rawLimit = Math.min(Math.max(fileContent.length, 15000), 150000);
    let dynamicContextLimit = rawLimit;
    if (fileContent.length > rawLimit) {
        const lastSpaceIndex = fileContent.lastIndexOf(' ', rawLimit);
        dynamicContextLimit = lastSpaceIndex > -1 ? lastSpaceIndex : rawLimit;
    }
    const contextualText = fileContent.substring(0, dynamicContextLimit);
    
    let systemPrompt = `You are Chameleon AI, an elite academic assistant built for university students.
🚨 STRICTOR NAME TRANSLITERATION RULE:
1. Your name in English is "Chameleon AI".
2. In Arabic, your name is ALWAYS "كامليون AI" (Kamelyon AI). You are STRICTLY FORBIDDEN from translating or transliterating your name as "تشاميليون" or "تشيملون" or "شاميليون". Under no circumstances are you allowed to use "تشاميليون" or "تشيملون" or "شاميليون". Always refer to yourself as "كامليون AI".
You are assisting with a file named "${metadata.name}".
Language: ${language}.

${isImage ? "This is an image file. Analyze its visual content thoroughly when asked." : `File Content Context:\n---\n${contextualText}\n---`}

🚨 ZERO-HALLUCINATION PROTOCOL (CRITICAL RULES) 🚨:
1. **STRICT CONTEXT CONFINEMENT:** You are strictly FORBIDDEN from introducing any external topics, concepts, theorems, or formulas that are NOT explicitly mentioned in the provided text. 
2. **CLARIFICATION vs. FABRICATION:** You may use your general knowledge ONLY to explain and clarify the concepts already present in the text in extreme detail. Do NOT add extra types, features, or context unless it is in the text.
3. **NO FILLER:** Do not invent information just to make the summary longer. 

FORMATTING & VISUAL RULES:
- Use rich Markdown: headers, bold, italic, bullet lists, tables.
- **EXHAUSTIVE EXPLANATION:** Extract maximum detail from the provided text. Explain concepts deeply and step-by-step.
- **STRICT EQUATION ISOLATION:** EVERY mathematical formula, equation, ratio, or calculation (even simple verbal/concept formulas like "Load Balancing = Traffic / Number of Servers") MUST be written in Display LaTeX block ($$...$$) on its own separate, empty line. Absolutely NO text, punctuation, or words are allowed on the same line as the equation. You are STRICTLY FORBIDDEN from writing any formula or equation inline inside paragraphs or bullet points. Always isolate them on separate lines.
- **DIAGRAMS & DRAWINGS:** Whenever a concept involves a process, flow, architecture, or relationships, you MUST draw it using a valid Mermaid.js code block (\`\`\`mermaid ... \`\`\`).
  🚨 STRICT MERMAID SYNTAX RULES:
  1. NEVER write extra angle brackets after link labels. Use "-->|label| B" instead of "-->|label|> B".
  2. Any node label containing special characters (like parentheses, colons, brackets, or commas) MUST be wrapped in double quotes, e.g. A["Label (Extra Info)"] instead of A[Label (Extra Info)].
- Respond ONLY in ${language}.`;

    let apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    let isQuizTask = false;

    if (task && messages.length === 0) {
      if (task === 'summarize') {
        currentModel = PRIMARY_AI_MODEL; // استخدام الموديل القوي هنا
        apiMessages.push({ role: "user", content: `You are an elite academic professor generating a highly organized, deeply elaborated masterclass study guide based ONLY on the provided document.

🚨 CRITICAL STRUCTURE RULE 🚨: 
DYNAMICALLY ADAPT the structure and headings to perfectly match the content. Do not use hardcoded templates like "Chapter 1".

Guidelines for Dynamic Structuring & Deep Elaboration:
1. **Introduction:** Start with a comprehensive overview of the document's main objective.
2. **Main Content (Exhaustive Detail):** Analyze the document's hierarchy. For every topic, provide a deep, granular, and fully elaborated explanation. Do not just summarize; TEACH the concept based on the text. 
3. **Visual Diagrams (Mermaid):** If the text describes an architecture (e.g., layers, nodes, inputs/outputs), a flowchart, or a cycle, explicitly draw it using a \`\`\`mermaid\`\`\` code block with shapes and lines.
4. **Formulas & Math (Isolated):** IF the document contains math, write governing equations in block LaTeX ($$...$$). Ensure the equation is alone on its line, with variable definitions written BELOW it, not next to it.
5. **Comparisons:** Synthesize comparisons into dense Markdown tables.
6. **Key Takeaways:** End with critical insights from the text.

**CRITICAL ENFORCEMENT:**
1. **Math Verification:** Correct obvious typos in extracted equations to their standard forms (e.g., Sigmoid $\\sigma(x) = \\frac{1}{1 + e^{-x}}$).
2. **Scale of Detail:** Extract every ounce of detail from the source text. 
3. **Respond in ${language}.` });
      } else if (task === 'quiz') {
        isQuizTask = true; 
        currentModel = PRIMARY_AI_MODEL; // استخدام الموديل القوي هنا
        apiMessages.push({ role: "user", content: `Generate a structured JSON array of 5-10 quiz questions strictly about the provided file. Format: [{"numb":1, "question":"...", "type":"Multiple Choice", "answer":"...", "options":["..."], "explanation":"..."}]. Output ONLY the JSON.` });
      } else if (task === 'translate') {
        currentModel = PRIMARY_AI_MODEL; // استخدام الموديل القوي هنا
        apiMessages.push({ role: "user", content: `Translate and restructure the key points of this file into ${language}. Use proper markdown formatting with headers, bullet points, tables, Mermaid diagrams for visual concepts, and isolated LaTeX on empty lines for math.` });
      }
    }

    let dynamicMaxTokens = 2000; 
    if (task === 'summarize') {
      if (fileContent.length > 80000) {
        dynamicMaxTokens = 5500; 
      } else if (fileContent.length > 30000) {
        dynamicMaxTokens = 3500; 
      } else {
        dynamicMaxTokens = 2000;
      }
    }

    const shouldStream = !isQuizTask;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chameleon-nu.tech",
        "X-Title": "Chameleon AI"
      },
      body: JSON.stringify({
        model: currentModel, // تم تمرير المتغير هنا
        messages: apiMessages,
        max_tokens: dynamicMaxTokens,
        temperature: 0.1, 
        stream: shouldStream 
      })
    });

    if (!response.ok) {
       const errorText = await response.text();
       console.error("OpenRouter Fetch Error:", errorText);
       
       let parsedError = errorText;
       try {
         const parsed = JSON.parse(errorText);
         parsedError = parsed.error?.message || parsed.error || errorText;
       } catch (e) {}
       
       return NextResponse.json({ error: `AI service connection failed: ${parsedError}` }, { status: 502 });
    }

    if (shouldStream) {
       return new Response(response.body, {
         headers: {
           'Content-Type': 'text/event-stream',
           'Cache-Control': 'no-cache, no-transform',
           'Connection': 'keep-alive',
         },
       });
    } else {
       const aiData = await response.json();
       if (aiData.error) {
         console.error("OpenRouter Error:", aiData.error);
         return NextResponse.json({ error: aiData.error.message || 'AI service error' }, { status: 502 });
       }

       let result = aiData.choices?.[0]?.message?.content;
       try {
         const cleaned = result.replace(/```json|```/g, '').trim();
         result = JSON.parse(cleaned);
         if (!Array.isArray(result) && result.questions) result = result.questions;
       } catch (e) {
         console.error("Failed to parse quiz JSON:", e);
       }
       return NextResponse.json({ result });
    }

  } catch (error) {
    console.error('AI processing error:', error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
