import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), '.cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create cache directory:', err);
  }
}

const CACHE_VERSION = 'v2';

function getCacheFilePath(fileContent: string, task: string, language: string): string {
  // Generate a SHA-256 hash representing the text content + task details
  const contentHash = crypto.createHash('sha256').update(fileContent).digest('hex');
  const safeLang = language.toLowerCase().replace(/[^a-z0-9]/g, '');
  return path.join(CACHE_DIR, `${contentHash}-${task}-${safeLang}-${CACHE_VERSION}.json`);
}

export async function getCachedAIResult(fileContent: string, task: string, language: string): Promise<any | null> {
  try {
    const filePath = getCacheFilePath(fileContent, task, language);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      console.log(`[AI Cache Hit] Loaded persistent result for task: ${task}, lang: ${language}`);
      return parsed.data;
    }
  } catch (err) {
    console.error('[AI Cache Get Error]:', err);
  }
  return null;
}

export async function setCachedAIResult(fileContent: string, task: string, language: string, data: any): Promise<void> {
  try {
    const filePath = getCacheFilePath(fileContent, task, language);
    const payload = {
      timestamp: Date.now(),
      task,
      language,
      data
    };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    console.log(`[AI Cache Set] Saved persistent result for task: ${task}, lang: ${language}`);
  } catch (err) {
    console.error('[AI Cache Set Error]:', err);
  }
}
