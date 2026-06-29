import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { departmentData } from '../src/lib/department-data';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function main() {
  const quizzes: any[] = [];
  let missingFiles = 0;

  Object.entries(departmentData).forEach(([deptSlug, department]) => {
    Object.entries(department.levels).forEach(([levelKey, level]) => {
      const levelNum = parseInt(levelKey, 10);
      
      const processTerm = (subjects: any[], termName: string) => {
        if (!subjects) return;
        subjects.forEach((subject) => {
          const quizList = subject.materials?.quizzes;
          if (quizList && Array.isArray(quizList)) {
            quizList.forEach((quiz) => {
              const code = quiz.code || quiz.id;
              const name = quiz.name;
              const duration = quiz.duration !== undefined ? String(quiz.duration) : 'OP';
              const questionsCount = quiz.questions || 0;
              const jsonFilePath = quiz.jsonFile;

              // Read and parse the local JSON file
              const fullPath = path.join(__dirname, '../public', jsonFilePath);
              let questionsObj: any[] = [];
              
              if (fs.existsSync(fullPath)) {
                try {
                  const content = fs.readFileSync(fullPath, 'utf-8');
                  questionsObj = JSON.parse(content);
                } catch (e: any) {
                  console.error(`Error parsing JSON file ${fullPath}:`, e.message);
                }
              } else {
                console.warn(`Warning: File not found: ${fullPath}`);
                missingFiles++;
              }

              quizzes.push({
                code: code,
                name: name,
                duration: duration,
                questions_count: questionsCount,
                questions: questionsObj, // Storing parsed questions JSON array directly
                department_slug: deptSlug,
                level_num: levelNum,
                subject_id: subject.id,
                term: termName,
              });
            });
          }
        });
      };

      processTerm(level.subjects.term1, 'term1');
      processTerm(level.subjects.term2, 'term2');
    });
  });

  console.log(`Starting seeding of ${quizzes.length} quizzes to Supabase (storing raw JSON questions)...`);
  if (missingFiles > 0) {
    console.warn(`Total missing quiz JSON files: ${missingFiles}`);
  }

  // Upsert in batches of 50 to avoid hitting limits
  const batchSize = 50;
  for (let i = 0; i < quizzes.length; i += batchSize) {
    const batch = quizzes.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('quiz_department')
      .upsert(batch, { onConflict: 'code' });
      
    if (error) {
      console.error(`Error seeding batch ${i / batchSize + 1}:`, error.message);
      console.error('Please make sure you have modified the "quiz_department" table in your Supabase database first.');
      process.exit(1);
    } else {
      console.log(`Successfully seeded batch ${i / batchSize + 1}/${Math.ceil(quizzes.length / batchSize)}`);
    }
  }

  console.log('Seeding completed successfully!');
}

main();
