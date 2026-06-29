-- Create the quiz_department table
CREATE TABLE IF NOT EXISTS public.quiz_department (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    duration TEXT,
    questions_count INTEGER NOT NULL,
    questions JSONB NOT NULL, -- Storing the JSON questions data directly
    department_slug TEXT NOT NULL,
    level_num INTEGER NOT NULL,
    subject_id TEXT NOT NULL,
    term TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.quiz_department ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone (anonymous and authenticated users) to read the quizzes
CREATE POLICY "Allow public read access to quizzes" ON public.quiz_department
    FOR SELECT
    USING (true);

-- Policy to allow only admins to make changes (insert, update, delete)
CREATE POLICY "Allow write access to admin users only" ON public.quiz_department
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chameleons
            WHERE public.chameleons.auth_id = auth.uid()
            AND (public.chameleons.is_admin = true OR public.chameleons.is_super_admin = true)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chameleons
            WHERE public.chameleons.auth_id = auth.uid()
            AND (public.chameleons.is_admin = true OR public.chameleons.is_super_admin = true)
        )
    );

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_quiz_dept_department_slug ON public.quiz_department(department_slug);
CREATE INDEX IF NOT EXISTS idx_quiz_dept_subject_id ON public.quiz_department(subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_dept_level_num ON public.quiz_department(level_num);
