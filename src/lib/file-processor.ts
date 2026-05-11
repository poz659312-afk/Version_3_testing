export interface ProcessedFile {
  name: string
  type: string
  size: number
  content: string
  summary?: string
  keyPoints?: string[]
  quiz?: any[]
}

export class SmartFileProcessor {
  static async processFile(file: File, geminiClient?: any): Promise<ProcessedFile> {
    const content = await this.extractContent(file)

    return {
      name: file.name,
      type: file.type,
      size: file.size,
      content,
      summary: this.generateSummary(content),
      keyPoints: this.extractKeyPoints(content),
      quiz: await this.generateQuizFromContent(content, file.name, geminiClient),
    }
  }

  private static async extractContent(file: File): Promise<string> {
    const fileType = file.type
    const fileName = file.name.toLowerCase()

    if (
      fileType.includes("text") ||
      fileType.includes("json") ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".md")
    ) {
      return await file.text()
    }

    if (fileName.endsWith(".py")) {
      const pythonCode = await file.text()
      return this.analyzePythonCode(pythonCode)
    }

    if (fileName.endsWith(".ipynb")) {
      const notebookContent = await file.text()
      return this.analyzeJupyterNotebook(notebookContent)
    }

    if (fileType.includes("pdf")) {
      // Simulate more realistic PDF content extraction
      const arrayBuffer = await file.arrayBuffer()
      return this.simulatePDFExtraction(file.name, arrayBuffer.byteLength)
    }

    if (fileType.includes("powerpoint") || fileType.includes("presentation")) {
      const arrayBuffer = await file.arrayBuffer()
      return this.simulatePowerPointExtraction(file.name, arrayBuffer.byteLength)
    }

    if (fileType.includes("word") || fileType.includes("document")) {
      const arrayBuffer = await file.arrayBuffer()
      return this.simulateWordExtraction(file.name, arrayBuffer.byteLength)
    }

    return `محتوى الملف: ${file.name}\n\nنوع الملف: ${fileType}\nحجم الملف: ${file.size} بايت`
  }

  private static analyzePythonCode(code: string): string {
    const lines = code.split("\n")
    const imports = lines.filter((line) => line.trim().startsWith("import ") || line.trim().startsWith("from "))
    const functions = lines.filter((line) => line.trim().startsWith("def "))
    const classes = lines.filter((line) => line.trim().startsWith("class "))
    const comments = lines.filter((line) => line.trim().startsWith("#"))

    let analysis = `تحليل كود Python:\n\n`
    analysis += `📊 إحصائيات الكود:\n`
    analysis += `• عدد الأسطر: ${lines.length}\n`
    analysis += `• المكتبات المستوردة: ${imports.length}\n`
    analysis += `• الدوال: ${functions.length}\n`
    analysis += `• الفئات (Classes): ${classes.length}\n`
    analysis += `• التعليقات: ${comments.length}\n\n`

    if (imports.length > 0) {
      analysis += `📚 المكتبات المستخدمة:\n${imports
        .slice(0, 10)
        .map((imp) => `• ${imp.trim()}`)
        .join("\n")}\n\n`
    }

    if (functions.length > 0) {
      analysis += `🔧 الدوال الرئيسية:\n${functions
        .slice(0, 5)
        .map((func) => `• ${func.trim()}`)
        .join("\n")}\n\n`
    }

    analysis += `💻 الكود الكامل:\n${code}`

    return analysis
  }

  private static analyzeJupyterNotebook(content: string): string {
    try {
      const notebook = JSON.parse(content)
      const cells = notebook.cells || []

      let analysis = `تحليل Jupyter Notebook:\n\n`
      analysis += `📊 إحصائيات النوت بوك:\n`
      analysis += `• عدد الخلايا: ${cells.length}\n`

      const codeCells = cells.filter((cell: any) => cell.cell_type === "code")
      const markdownCells = cells.filter((cell: any) => cell.cell_type === "markdown")

      analysis += `• خلايا الكود: ${codeCells.length}\n`
      analysis += `• خلايا النص: ${markdownCells.length}\n\n`

      // Extract content from cells
      let extractedContent = ""
      cells.forEach((cell: any, index: number) => {
        if (cell.source && cell.source.length > 0) {
          const cellContent = Array.isArray(cell.source) ? cell.source.join("") : cell.source
          extractedContent += `\n--- خلية ${index + 1} (${cell.cell_type}) ---\n${cellContent}\n`
        }
      })

      analysis += `📝 محتوى الخلايا:\n${extractedContent}`

      return analysis
    } catch (error) {
      return `خطأ في تحليل Jupyter Notebook: ${content.substring(0, 1000)}...`
    }
  }

  private static simulatePDFExtraction(fileName: string, fileSize: number): string {
    const estimatedPages = Math.ceil(fileSize / 50000) // Rough estimate

    return `📄 محتوى PDF: ${fileName}

📊 معلومات الملف:
• عدد الصفحات المقدر: ${estimatedPages}
• حجم الملف: ${(fileSize / 1024).toFixed(1)} KB

📝 المحتوى المستخرج:
هذا ملف PDF يحتوي على معلومات أكاديمية مهمة. يتضمن الملف عدة أقسام رئيسية:

1. المقدمة والأهداف التعليمية
2. المفاهيم الأساسية والنظريات
3. الأمثلة التطبيقية والحالات العملية
4. التمارين والأنشطة التفاعلية
5. الخلاصة والنتائج الرئيسية

🔍 النقاط الرئيسية:
• يغطي الملف موضوعات متقدمة في علوم الحاسوب
• يتضمن أمثلة عملية وتطبيقات واقعية
• مناسب للطلاب في المستويات المتوسطة والمتقدمة
• يحتوي على مراجع ومصادر إضافية للتعمق

💡 ملاحظة: هذا تحليل تقديري للمحتوى. للحصول على تحليل دقيق، يُنصح بتحويل الملف إلى نص أو استخدام أدوات استخراج النصوص المتخصصة.`
  }

  private static simulatePowerPointExtraction(fileName: string, fileSize: number): string {
    const estimatedSlides = Math.ceil(fileSize / 30000) // Rough estimate

    return `🎯 محتوى العرض التقديمي: ${fileName}

📊 معلومات العرض:
• عدد الشرائح المقدر: ${estimatedSlides}
• حجم الملف: ${(fileSize / 1024).toFixed(1)} KB

📋 هيكل العرض:
الشريحة 1: العنوان والمقدمة
• عنوان الموضوع الرئيسي
• أهداف العرض والجمهور المستهدف

الشريحة 2-3: المفاهيم الأساسية
• تعريف المصطلحات الرئيسية
• الخلفية النظرية والسياق

الشريحة 4-${Math.max(4, estimatedSlides - 2)}: المحتوى الرئيسي
• شرح مفصل للموضوعات
• أمثلة وحالات دراسية
• رسوم بيانية وصور توضيحية

الشريحة الأخيرة: الخلاصة والتوصيات
• ملخص النقاط الرئيسية
• الخطوات التالية والمراجع

🎨 عناصر العرض:
• نصوص وعناوين تفاعلية
• صور ورسوم بيانية توضيحية
• قوائم نقطية ومخططات
• انتقالات وتأثيرات بصرية

💡 ملاحظة: هذا تحليل تقديري لهيكل العرض. المحتوى الفعلي قد يختلف حسب طبيعة الموضوع والتصميم المستخدم.`
  }

  private static simulateWordExtraction(fileName: string, fileSize: number): string {
    const estimatedPages = Math.ceil(fileSize / 40000) // Rough estimate

    return `📄 محتوى المستند: ${fileName}

📊 معلومات المستند:
• عدد الصفحات المقدر: ${estimatedPages}
• حجم الملف: ${(fileSize / 1024).toFixed(1)} KB

📝 هيكل المستند:
1. المقدمة والملخص التنفيذي
   • نظرة عامة على الموضوع
   • الأهداف والنطاق

2. الفصل الأول: الأسس النظرية
   • المفاهيم الأساسية
   • الخلفية التاريخية والتطور

3. الفصل الثاني: التطبيقات العملية
   • دراسات الحالة
   • الأمثلة التطبيقية

4. الفصل الثالث: التحليل والنتائج
   • البيانات والإحصائيات
   • التفسير والاستنتاجات

5. الخاتمة والتوصيات
   • ملخص النتائج
   • التوصيات المستقبلية

📋 عناصر المستند:
• نصوص مُنسقة بعناوين وفقرات
• جداول وقوائم منظمة
• مراجع وحواشي سفلية
• فهارس ومحتويات

💡 ملاحظة: هذا تحليل تقديري لمحتوى المستند. للحصول على النص الكامل، يُنصح باستخدام أدوات استخراج النصوص المتخصصة.`
  }

  static generateSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 10)
    const words = content.split(/\s+/).filter((w) => w.length > 3)
    const lines = content.split("\n").filter((line) => line.trim().length > 0)

    // Analyze content structure
    const hasCode = content.includes("def ") || content.includes("function") || content.includes("import")
    const hasData = content.includes("data") || content.includes("بيانات") || content.includes("جدول")
    const hasTheory = content.includes("نظرية") || content.includes("مفهوم") || content.includes("تعريف")

    let summary = `📋 ملخص ذكي للمحتوى:\n\n`

    // Content type analysis
    if (hasCode) {
      summary += `💻 نوع المحتوى: برمجي/تقني\n`
    } else if (hasData) {
      summary += `📊 نوع المحتوى: بيانات وإحصائيات\n`
    } else if (hasTheory) {
      summary += `📚 نوع المحتوى: نظري/أكاديمي\n`
    } else {
      summary += `📄 نوع المحتوى: عام\n`
    }

    summary += `📏 طول المحتوى: ${words.length} كلمة، ${sentences.length} جملة\n\n`

    // Extract key sentences
    const keyPoints = sentences.slice(0, 5).map((s, i) => `${i + 1}. ${s.trim().substring(0, 100)}...`)
    summary += `🔑 النقاط الرئيسية:\n${keyPoints.join("\n")}\n\n`

    // Reading time estimate
    const readingTime = Math.ceil(words.length / 200) // Average reading speed
    summary += `⏱️ وقت القراءة المقدر: ${readingTime} دقيقة`

    return summary
  }

  static extractKeyPoints(content: string): string[] {
    // Extract key concepts and important points
    const lines = content.split("\n").filter((line) => line.trim().length > 5)
    const keyPoints = lines.slice(0, 5).map((line) => line.trim())

    return keyPoints
  }

  static async generateQuizFromContent(content: string, fileName: string, geminiClient?: any): Promise<any[]> {
    if (!geminiClient) {
      // Fallback to basic generation if no AI client available
      return this.generateBasicQuiz(content, fileName)
    }

    try {
      const quizPrompt = `
You are an expert educational content creator. Analyze the following content and create a high-quality, intelligent quiz in English.

CONTENT TO ANALYZE:
${content}

REQUIREMENTS:
1. Create 7-10 questions based ONLY on the actual content provided
2. Questions must be directly related to concepts, facts, or information in the content
3. Use English language for all questions and answers
4. Create meaningful, realistic answer choices (not generic placeholders)
5. Include different question types: multiple choice, true/false
6. Ensure questions test understanding, not just memorization
7. Make incorrect answers plausible but clearly wrong
8. Base all content on the actual text provided, not assumptions

OUTPUT FORMAT (JSON):
[
  {
    "numb": 1,
    "question": "What is the main concept discussed in the content?",
    "type": "Multiple Choice",
    "answer": "Correct answer from content",
    "options": ["Correct answer", "Plausible wrong answer 1", "Plausible wrong answer 2", "Plausible wrong answer 3"],
    "explanation": "Brief explanation of why this is correct"
  }
]

Generate intelligent questions that demonstrate deep understanding of the content. Avoid generic or placeholder answers.
`

      const response = await geminiClient.generateText(quizPrompt, "gemini-1.5-flash")

      // Check if response indicates API error (service unavailable, quota exceeded, etc.)
      if (response.includes("عذراً") || response.includes("خطأ") || response.includes("غير متاح")) {
        console.log("[v0] AI service unavailable, using enhanced fallback quiz generation")
        return this.generateEnhancedFallbackQuiz(content, fileName)
      }

      // Try to parse the JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0])
        return questions.map((q: any, index: number) => ({
          ...q,
          numb: index + 1,
          image: null,
        }))
      }

      // If JSON parsing fails, fall back to enhanced generation
      return this.generateEnhancedFallbackQuiz(content, fileName)
    } catch (error) {
      console.error("AI quiz generation failed:", error)
      return this.generateEnhancedFallbackQuiz(content, fileName)
    }
  }

  private static generateBasicQuiz(content: string, fileName: string): any[] {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 30)
    const questions = []

    // Extract key terms and concepts from content
    const keyTerms = this.extractKeyTerms(content)
    const concepts = this.extractConcepts(content)

    // Generate multiple choice questions based on actual content
    for (let i = 0; i < Math.min(5, sentences.length); i++) {
      const sentence = sentences[i].trim()

      if (keyTerms.length > i) {
        const term = keyTerms[i]
        const context = sentence.substring(0, 100)

        questions.push({
          numb: i + 1,
          question: `Based on the content, what does "${term}" refer to in the context: "${context}..."?`,
          type: "Multiple Choice",
          answer: `The concept as described in the content`,
          options: [
            `The concept as described in the content`,
            `A different interpretation`,
            `An unrelated concept`,
            `Not mentioned in the content`,
          ],
          explanation: `This term appears in the context of: ${context}`,
          image: null,
        })
      }
    }

    // Add true/false questions based on actual statements
    for (let i = 0; i < Math.min(3, concepts.length); i++) {
      const concept = concepts[i]
      questions.push({
        numb: questions.length + 1,
        question: `True or False: The content discusses "${concept}"`,
        type: "True/False",
        answer: "True",
        options: ["True", "False"],
        explanation: `This concept is mentioned in the provided content`,
        image: null,
      })
    }

    return questions
  }

  private static generateEnhancedFallbackQuiz(content: string, fileName: string): any[] {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 30)
    const questions = []

    // Extract key terms and concepts from content
    const keyTerms = this.extractKeyTerms(content)
    const concepts = this.extractConcepts(content)
    const codeBlocks = this.extractCodeBlocks(content)
    const definitions = this.extractDefinitions(content)

    // Generate questions based on file type and content
    if (fileName.endsWith(".py") && codeBlocks.length > 0) {
      // Python-specific questions
      questions.push(...this.generatePythonQuestions(codeBlocks, keyTerms))
    } else if (fileName.endsWith(".ipynb")) {
      // Jupyter notebook questions
      questions.push(...this.generateNotebookQuestions(content, concepts))
    } else if (fileName.includes("pdf") || fileName.includes("doc")) {
      // Document-based questions
      questions.push(...this.generateDocumentQuestions(sentences, definitions))
    }

    // Add general content questions
    questions.push(...this.generateContentBasedQuestions(sentences, keyTerms))

    return questions.slice(0, 8) // Limit to 8 questions
  }

  private static generatePythonQuestions(codeBlocks: string[], keyTerms: string[]): any[] {
    const questions = []

    if (codeBlocks.length > 0) {
      const firstBlock = codeBlocks[0]
      questions.push({
        numb: 1,
        question: `What programming concept is demonstrated in this code snippet: "${firstBlock.substring(0, 50)}..."?`,
        type: "Multiple Choice",
        answer: "Python programming logic",
        options: [
          "Python programming logic",
          "Database management",
          "Web development framework",
          "Machine learning algorithm",
        ],
        explanation: "This code demonstrates Python programming concepts and syntax.",
        image: null,
      })
    }

    return questions
  }

  private static generateNotebookQuestions(content: string, concepts: string[]): any[] {
    const questions = []

    if (concepts.length > 0) {
      questions.push({
        numb: 1,
        question: `Based on the notebook content, which concept is primarily explored?`,
        type: "Multiple Choice",
        answer: concepts[0],
        options: [concepts[0], "Unrelated topic A", "Unrelated topic B", "Unrelated topic C"],
        explanation: `The notebook focuses on: ${concepts[0]}`,
        image: null,
      })
    }

    return questions
  }

  private static generateDocumentQuestions(sentences: string[], definitions: string[]): any[] {
    const questions = []

    if (sentences.length > 0) {
      const mainSentence = sentences[0]
      questions.push({
        numb: 1,
        question: `According to the document, what is the main point discussed in: "${mainSentence.substring(0, 80)}..."?`,
        type: "Multiple Choice",
        answer: "The concept described in the document",
        options: [
          "The concept described in the document",
          "An alternative interpretation",
          "A contradictory viewpoint",
          "An unrelated topic",
        ],
        explanation: "This reflects the main idea presented in the document.",
        image: null,
      })
    }

    return questions
  }

  private static generateContentBasedQuestions(sentences: string[], keyTerms: string[]): any[] {
    const questions = []

    for (let i = 0; i < Math.min(3, keyTerms.length); i++) {
      const term = keyTerms[i]
      questions.push({
        numb: questions.length + 1,
        question: `True or False: The content discusses "${term}" as a key concept.`,
        type: "True/False",
        answer: "True",
        options: ["True", "False"],
        explanation: `The term "${term}" appears frequently in the content, indicating its importance.`,
        image: null,
      })
    }

    return questions
  }

  // Helper methods for content extraction
  private static extractCodeBlocks(content: string): string[] {
    const codePatterns = [/def\s+\w+$$[^)]*$$:/g, /class\s+\w+.*:/g, /import\s+\w+/g, /from\s+\w+\s+import/g]

    const blocks = []
    for (const pattern of codePatterns) {
      const matches = content.match(pattern)
      if (matches) blocks.push(...matches)
    }

    return blocks.slice(0, 5)
  }

  private static extractDefinitions(content: string): string[] {
    const definitionPatterns = [/(\w+)\s+is\s+defined\s+as/gi, /(\w+)\s+refers\s+to/gi, /(\w+)\s+means/gi]

    const definitions = []
    for (const pattern of definitionPatterns) {
      const matches = content.match(pattern)
      if (matches) definitions.push(...matches)
    }

    return definitions.slice(0, 3)
  }

  private static extractKeyTerms(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/)
    const stopWords = [
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
    ]

    const meaningfulWords = words
      .filter((word) => word.length > 4 && !stopWords.includes(word))
      .filter((word) => /^[a-zA-Z]+$/.test(word))

    // Get most frequent meaningful words
    const wordCount: { [key: string]: number } = {}
    meaningfulWords.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  private static extractConcepts(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20)
    return sentences
      .slice(0, 5)
      .map((sentence) => sentence.trim().substring(0, 50) + (sentence.length > 50 ? "..." : ""))
  }
}

