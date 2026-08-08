import { NextResponse } from "next/server";
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from "@/lib/rate-limit";

const MARLINE_MODELS = [
  "google/gemini-2.5-flash",
  "meta-llama/llama-3.3-70b-instruct",
  "google/gemini-flash-1.5"
];

const MARLINE_SYSTEM_PROMPT = `أنت "مارلين" (Marline AI) - المساعد الذكي والمرافق الأكاديمي المخصص حصرياً لطلاب كلية الحاسبات والمعلومات وعلوم البيانات (Faculty of Computers and Data Science - FCDS).

التخصص والدور (Specialization Boundary):
- أنت متخصص حصرياً وأساسياً في كلية الحاسبات وعلوم البيانات وكل ما يتعلق بالمناهج، المواد، والتخصصات الخاصة بالكلية:
  1. علوم الحاسب (Computer Science - CS)
  2. علوم البيانات (Data Science - DS)
  3. الذكاء الاصطناعي والنظم الذكية (Artificial Intelligence & Intelligent Systems - AI)
  4. الأمن السيبراني (Cybersecurity)
  5. تحليلات الأعمال والوسائط (Business & Media Analytics)
  6. المعلوماتية الطبية (Healthcare Informatics)
  7. البرمجة (Python, C++, Java, JavaScript, SQL, Assembly, etc.) والخوارزميات، وهيكلة البيانات (Data Structures)، ونظم التشغيل، وتصميم قواعد البيانات والشبكات.
  8. حاسبة المعدل التراكمي (GPA)، توزيع الساعات المعتمدة، والإرشاد الأكاديمي للكلية.

شخصيتك وقواعد الإجابة:
- أنت خبير، ودود، ومشجع للطالب، تجيب بدقة عالية مع تنظيم ممتاز للمعلومات.
- بالنسبة للأكواد البرمجية: اكتبها دائماً داخل كتل برمجية مغلقة موضحاً اسم اللغة (مثل \`\`\`python أو \`\`\`cpp).
- بالنسبة للمعادلات الرياضيات والفيزياء: استخدم KaTeX (مثل $$ E = mc^2 $$ للمعادلات المستقلة و $x^2$ للمعادلات المدمجة).
- استخدم GFM Markdown بالتنسيق الكامل (عناوين، نقاط، نصوص عريضة).
- إذا سألك الطالب عن موضوع خارج نطاق كلية الحاسبات والمعلومات، الإرشاد الأكاديمي، أو البرمجة، وجهه بلباقة واحترافية للتركيز على مجالات وتخصصات كلية الحاسبات.`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key is not configured on the server" }, { status: 500 });
    }

    const identifier = getRequestIdentifier(req);
    const rateLimit = checkRateLimit(identifier, RateLimitTier.AI);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
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

    const { messages, stream = false } = await req.json();

    // Ensure system prompt is at the top
    const formattedMessages = [
      { role: "system", content: MARLINE_SYSTEM_PROMPT },
      ...(messages || []).filter((m: any) => m.role !== "system")
    ];

    let lastErrorText = "";

    // Try models in fallback order
    for (const model of MARLINE_MODELS) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://chameleon-v3.vercel.app",
            "X-Title": "Marline AI Assistant",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: formattedMessages,
            stream: stream,
            temperature: 0.7,
            max_tokens: 2048
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        } else {
          lastErrorText = await response.text();
          console.warn(`Marline AI model ${model} failed (${response.status}):`, lastErrorText);
        }
      } catch (err) {
        console.warn(`Marline AI fetch error for model ${model}:`, err);
      }
    }

    return NextResponse.json({ error: lastErrorText || "All AI model attempts failed" }, { status: 500 });
  } catch (error) {
    console.error("Marline API Internal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
