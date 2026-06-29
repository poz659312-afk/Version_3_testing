import { departmentData } from '../src/lib/department-data';
import * as fs from 'fs';
import * as path from 'path';

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

function main() {
  const insertStatements: string[] = [];
  insertStatements.push('-- Seed data for public.quiz_department');
  insertStatements.push('TRUNCATE TABLE public.quiz_department CASCADE;');

  let missingFiles = 0;

  Object.entries(departmentData).forEach(([deptSlug, department]) => {
    Object.entries(department.levels).forEach(([levelKey, level]) => {
      const levelNum = parseInt(levelKey, 10);
      
      const processTerm = (subjects: any[], termName: string) => {
        if (!subjects) return;
        subjects.forEach((subject) => {
          const quizzes = subject.materials?.quizzes;
          if (quizzes && Array.isArray(quizzes)) {
            quizzes.forEach((quiz) => {
              const code = quiz.code || quiz.id;
              const name = quiz.name;
              const duration = quiz.duration !== undefined ? String(quiz.duration) : 'OP';
              const questionsCount = quiz.questions || 0;
              const jsonFilePath = quiz.jsonFile;

              // Read and parse the local JSON file
              // Relative path: jsonFilePath starts with "/quizzes/..."
              const fullPath = path.join(__dirname, '../public', jsonFilePath);
              let questionsJson = '[]';
              
              if (fs.existsSync(fullPath)) {
                try {
                  const content = fs.readFileSync(fullPath, 'utf-8');
                  // Parse first to validate it's correct JSON
                  const parsed = JSON.parse(content);
                  questionsJson = JSON.stringify(parsed);
                } catch (e: any) {
                  console.error(`Error parsing JSON file ${fullPath}:`, e.message);
                }
              } else {
                console.warn(`Warning: File not found: ${fullPath}`);
                missingFiles++;
              }
              
              insertStatements.push(
                `INSERT INTO public.quiz_department (code, name, duration, questions_count, questions, department_slug, level_num, subject_id, term) ` +
                `VALUES ('${escapeSql(code)}', '${escapeSql(name)}', '${escapeSql(duration)}', ${questionsCount}, '${escapeSql(questionsJson)}'::jsonb, '${escapeSql(deptSlug)}', ${levelNum}, '${escapeSql(subject.id)}', '${escapeSql(termName)}') ` +
                `ON CONFLICT (code) DO UPDATE SET ` +
                `name = EXCLUDED.name, duration = EXCLUDED.duration, questions_count = EXCLUDED.questions_count, questions = EXCLUDED.questions, department_slug = EXCLUDED.department_slug, level_num = EXCLUDED.level_num, subject_id = EXCLUDED.subject_id, term = EXCLUDED.term;`
              );
            });
          }
        });
      };

      processTerm(level.subjects.term1, 'term1');
      processTerm(level.subjects.term2, 'term2');
    });
  });

  const outputPath = path.join(__dirname, '../supabase/seed_quiz_department.sql');
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, insertStatements.join('\n') + '\n', 'utf-8');
  console.log(`Successfully generated seed file at: ${outputPath}`);
  console.log(`Extracted ${insertStatements.length - 2} quizzes.`);
  if (missingFiles > 0) {
    console.warn(`Total missing quiz JSON files: ${missingFiles}`);
  }
}

main();
