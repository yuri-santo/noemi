-- 1. Create event_details table
CREATE TABLE public.event_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    celebrant_name TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create gift_suggestions table
CREATE TABLE public.gift_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    size_info TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create guests table (RSVPs)
CREATE TABLE public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_names TEXT NOT NULL,
    headcount INTEGER NOT NULL DEFAULT 1,
    is_going BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) on all tables for public access temporarily (so frontend can read/write)
ALTER TABLE public.event_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a simple invitation site, anyone with the link can read details and write RSVPs)
CREATE POLICY "Allow public read on event_details" ON public.event_details FOR SELECT USING (true);
CREATE POLICY "Allow public read on gift_suggestions" ON public.gift_suggestions FOR SELECT USING (true);

-- Allow public to read and insert RSVPs
CREATE POLICY "Allow public select on guests" ON public.guests FOR SELECT USING (true);
CREATE POLICY "Allow public insert on guests" ON public.guests FOR INSERT WITH CHECK (true);

-- Insert initial data
INSERT INTO public.event_details (celebrant_name, event_date, location_address)
VALUES ('Noemí', '2024-05-18 16:00:00+00', 'Local da Festa');

INSERT INTO public.gift_suggestions (category, size_info, icon) VALUES 
('Roupinha', 'Tam. 2 (anos)', 'fa-shirt'),
('Calçado', 'Número 20', 'fa-shoe-prints'),
('Fralda', 'Tamanho G/XG', 'fa-baby-carriage');
