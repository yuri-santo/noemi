import os
import psycopg2

password = "Martiniano.165812"
conn_str = f"postgresql://postgres:{password}@db.izphobguvtfjqzrsbkva.supabase.co:5432/postgres"

sql = """
CREATE TABLE IF NOT EXISTS public.allowed_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.allowed_guests ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public select on allowed_guests'
  ) THEN
    CREATE POLICY "Allow public select on allowed_guests" ON public.allowed_guests FOR SELECT USING (true);
    CREATE POLICY "Allow public insert on allowed_guests" ON public.allowed_guests FOR INSERT WITH CHECK (true);
    CREATE POLICY "Allow public delete on allowed_guests" ON public.allowed_guests FOR DELETE USING (true);
  END IF;
END $$;
"""

try:
    with psycopg2.connect(conn_str) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            conn.commit()
    print("Table allowed_guests created successfully.")
except Exception as e:
    print(f"Error: {e}")
