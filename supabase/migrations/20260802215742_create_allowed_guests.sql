CREATE TABLE IF NOT EXISTS public.allowed_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.allowed_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on allowed_guests" ON public.allowed_guests FOR SELECT USING (true);
CREATE POLICY "Allow public insert on allowed_guests" ON public.allowed_guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on allowed_guests" ON public.allowed_guests FOR DELETE USING (true);
