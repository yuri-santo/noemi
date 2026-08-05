-- Sincroniza as migrations com o schema que já existe em produção
-- (as colunas abaixo foram criadas direto pelo painel do Supabase e nunca
-- entraram no versionamento, então um `db reset` recriava um banco quebrado).

ALTER TABLE public.guests
    ADD COLUMN IF NOT EXISTS companions JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.allowed_guests
    ADD COLUMN IF NOT EXISTS has_confirmed BOOLEAN DEFAULT false;

ALTER TABLE public.event_details
    ADD COLUMN IF NOT EXISTS location_url TEXT,
    ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT true;

-- NOTA: as policies abertas que existiam aqui foram substituídas pelo modelo de
-- segurança da migration seguinte (restrict_anon_access_require_auth_for_admin),
-- onde ler e excluir passam a exigir login pelo Supabase Auth.
