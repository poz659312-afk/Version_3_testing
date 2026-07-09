-- Create the summaries table
CREATE TABLE IF NOT EXISTS public.summaries (
    code TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    creator_id UUID NOT NULL REFERENCES public.chameleons(auth_id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0 NOT NULL,
    is_published BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the summary_likes table to prevent multiple likes from the same user
CREATE TABLE IF NOT EXISTS public.summary_likes (
    summary_code TEXT NOT NULL REFERENCES public.summaries(code) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.chameleons(auth_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (summary_code, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summary_likes ENABLE ROW LEVEL SECURITY;

-- Policies for public.summaries
-- 1. Anyone (anonymous and authenticated) can read published summaries
DROP POLICY IF EXISTS "Allow public read access to published summaries" ON public.summaries;
CREATE POLICY "Allow public read access to published summaries" ON public.summaries
    FOR SELECT
    USING (is_published = true);

-- 2. Admins can read all summaries (published or draft)
DROP POLICY IF EXISTS "Allow admins to read all summaries" ON public.summaries;
CREATE POLICY "Allow admins to read all summaries" ON public.summaries
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chameleons
            WHERE public.chameleons.auth_id = auth.uid()
            AND (public.chameleons.is_admin = true OR public.chameleons.is_super_admin = true)
        )
    );

-- 3. Admins can perform all write actions on summaries
DROP POLICY IF EXISTS "Allow write access to summaries for admin users only" ON public.summaries;
CREATE POLICY "Allow write access to summaries for admin users only" ON public.summaries
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

-- Policies for public.summary_likes
-- 1. Anyone can see the likes table
DROP POLICY IF EXISTS "Allow public read access to likes" ON public.summary_likes;
CREATE POLICY "Allow public read access to likes" ON public.summary_likes
    FOR SELECT
    USING (true);

-- 2. Authenticated users can like summaries (insert)
DROP POLICY IF EXISTS "Allow authenticated users to like summaries" ON public.summary_likes;
CREATE POLICY "Allow authenticated users to like summaries" ON public.summary_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. Authenticated users can unlike summaries (delete)
DROP POLICY IF EXISTS "Allow authenticated users to unlike summaries" ON public.summary_likes;
CREATE POLICY "Allow authenticated users to unlike summaries" ON public.summary_likes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Trigger function to update likes_count on summaries table automatically
CREATE OR REPLACE FUNCTION public.update_summary_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.summaries
        SET likes_count = likes_count + 1
        WHERE code = NEW.summary_code;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.summaries
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE code = OLD.summary_code;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function
DROP TRIGGER IF EXISTS tr_update_summary_likes_count ON public.summary_likes;
CREATE TRIGGER tr_update_summary_likes_count
AFTER INSERT OR DELETE ON public.summary_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_summary_likes_count();

-- Create storage bucket for summaries
INSERT INTO storage.buckets (id, name, public)
VALUES ('summaries', 'summaries', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies to allow anyone to read files
DROP POLICY IF EXISTS "Allow public read access to summaries storage" ON storage.objects;
CREATE POLICY "Allow public read access to summaries storage" ON storage.objects
    FOR SELECT USING (bucket_id = 'summaries');

-- Storage policies to allow authenticated admin users to upload files
DROP POLICY IF EXISTS "Allow write access to summaries storage for admins" ON storage.objects;
CREATE POLICY "Allow write access to summaries storage for admins" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'summaries' AND (
            EXISTS (
                SELECT 1 FROM public.chameleons
                WHERE public.chameleons.auth_id = auth.uid()
                AND (public.chameleons.is_admin = true OR public.chameleons.is_super_admin = true)
            )
        )
    );

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_summaries_creator ON public.summaries(creator_id);
CREATE INDEX IF NOT EXISTS idx_summaries_is_published ON public.summaries(is_published);
CREATE INDEX IF NOT EXISTS idx_summary_likes_summary ON public.summary_likes(summary_code);
