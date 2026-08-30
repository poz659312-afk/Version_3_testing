import { estimateTokens } from "./token-budget-manager";

export interface DocumentChunk {
  id: number;
  title: string;
  text: string;
  tokenCount: number;
}

export interface ChunkingOptions {
  targetChunkTokens?: number;
  overlapTokens?: number;
  maxChunkTokens?: number;
}

const DEFAULT_TARGET_CHUNK_TOKENS = 2800;
const DEFAULT_MAX_CHUNK_TOKENS = 3800;
const DEFAULT_OVERLAP_TOKENS = 80;

/**
 * Splits large document text into semantically cohesive chunks along
 * headings, section dividers, paragraphs, and sentence boundaries.
 */
export function chunkDocumentSemantically(
  fullText: string,
  options: ChunkingOptions = {}
): DocumentChunk[] {
  const targetTokens = options.targetChunkTokens || DEFAULT_TARGET_CHUNK_TOKENS;
  const maxTokens = options.maxChunkTokens || DEFAULT_MAX_CHUNK_TOKENS;
  const overlapTokens = options.overlapTokens || DEFAULT_OVERLAP_TOKENS;

  if (!fullText || fullText.trim().length === 0) return [];

  const totalTokens = estimateTokens(fullText);
  if (totalTokens <= targetTokens) {
    return [
      {
        id: 1,
        title: "Complete Document",
        text: fullText.trim(),
        tokenCount: totalTokens,
      },
    ];
  }

  // 1. First-pass segmentation by semantic headings & section dividers
  const headingSplitRegex = /(?:\r?\n)(?=(?:#{1,4}\s+|---|\b(?:Lecture|Chapter|Section|Part|Topic|المحاضرة|الفصل|الوحدة|القسم)\s+\d+))/i;
  let rawSections = fullText.split(headingSplitRegex).map((s) => s.trim()).filter(Boolean);

  // If no heading structure detected, segment by double newlines (paragraphs)
  if (rawSections.length <= 1) {
    rawSections = fullText.split(/\r?\n\r?\n/).map((s) => s.trim()).filter(Boolean);
  }

  const chunks: DocumentChunk[] = [];
  let currentChunkParagraphs: string[] = [];
  let currentChunkTokens = 0;
  let chunkIndex = 1;

  for (const section of rawSections) {
    const sectionTokens = estimateTokens(section);

    // If a single section is extraordinarily large, split it down by paragraphs/sentences
    if (sectionTokens > maxTokens) {
      const subParagraphs = section.split(/\r?\n\r?\n/).map((p) => p.trim()).filter(Boolean);
      
      for (const p of subParagraphs) {
        const pTokens = estimateTokens(p);
        
        if (currentChunkTokens + pTokens > targetTokens && currentChunkParagraphs.length > 0) {
          // Finalize current chunk
          const chunkText = currentChunkParagraphs.join("\n\n");
          chunks.push({
            id: chunkIndex++,
            title: extractChunkTitle(chunkText, chunkIndex - 1),
            text: chunkText,
            tokenCount: currentChunkTokens,
          });

          // Compute overlap from end of previous chunk
          const overlap = extractOverlapText(chunkText, overlapTokens);
          currentChunkParagraphs = overlap ? [overlap, p] : [p];
          currentChunkTokens = estimateTokens(currentChunkParagraphs.join("\n\n"));
        } else {
          currentChunkParagraphs.push(p);
          currentChunkTokens += pTokens;
        }
      }
    } else {
      if (currentChunkTokens + sectionTokens > targetTokens && currentChunkParagraphs.length > 0) {
        // Finalize current chunk
        const chunkText = currentChunkParagraphs.join("\n\n");
        chunks.push({
          id: chunkIndex++,
          title: extractChunkTitle(chunkText, chunkIndex - 1),
          text: chunkText,
          tokenCount: currentChunkTokens,
        });

        // Compute overlap from end of previous chunk
        const overlap = extractOverlapText(chunkText, overlapTokens);
        currentChunkParagraphs = overlap ? [overlap, section] : [section];
        currentChunkTokens = estimateTokens(currentChunkParagraphs.join("\n\n"));
      } else {
        currentChunkParagraphs.push(section);
        currentChunkTokens += sectionTokens;
      }
    }
  }

  // Push remaining buffer as last chunk
  if (currentChunkParagraphs.length > 0) {
    const chunkText = currentChunkParagraphs.join("\n\n");
    chunks.push({
      id: chunkIndex,
      title: extractChunkTitle(chunkText, chunkIndex),
      text: chunkText,
      tokenCount: estimateTokens(chunkText),
    });
  }

  return chunks;
}

function extractChunkTitle(text: string, index: number): string {
  const match = text.match(/^(?:#{1,4}\s+|\b(?:Lecture|Chapter|Section|المحاضرة|الفصل)\s+\d+[:\-]?\s*)([^\n]{3,60})/im);
  if (match && match[1]) {
    return match[1].trim();
  }
  return `Part ${index}`;
}

function extractOverlapText(text: string, targetOverlapTokens: number): string {
  if (!text || targetOverlapTokens <= 0) return "";
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return "";
  
  const lastLine = lines[lines.length - 1];
  if (estimateTokens(lastLine) <= targetOverlapTokens * 1.5) {
    return `[Context: ${lastLine.slice(0, 250)}]`;
  }
  return "";
}
