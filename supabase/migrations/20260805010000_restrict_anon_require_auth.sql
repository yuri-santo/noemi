-- ════════════════════════════════════════════════════════════════════
-- MODELO DE SEGURANÇA DO PAINEL (já aplicado em produção)
--
-- A chave anon é pública por natureza: num site estático o navegador
-- precisa dela para falar com a API, e qualquer visitante lê o HTML.
-- Não dá para escondê-la — o que dá para fazer é tirar o poder dela.
--
-- Antes: a chave anon sozinha lia a lista inteira de convidados e
--        apagava qualquer registro.
-- Agora: a chave anon só INSERE uma confirmação. Ler e excluir exigem
--        um JWT do Supabase Auth (login com senha no painel).
-- ════════════════════════════════════════════════════════════════════

-- ── guests ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow public select on guests" ON public.guests;
DROP POLICY IF EXISTS "Allow public delete on guests" ON public.guests;
DROP POLICY IF EXISTS "Allow public insert on guests" ON public.guests;

-- Convidado anônimo: registra a própria presença e nada mais.
DROP POLICY IF EXISTS "anon pode inserir rsvp" ON public.guests;
CREATE POLICY "anon pode inserir rsvp" ON public.guests
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Somente o painel autenticado lê e apaga.
DROP POLICY IF EXISTS "admin le rsvps" ON public.guests;
CREATE POLICY "admin le rsvps" ON public.guests
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin apaga rsvps" ON public.guests;
CREATE POLICY "admin apaga rsvps" ON public.guests
    FOR DELETE TO authenticated USING (true);

-- ── allowed_guests (o convite não usa mais lista prévia) ────────────
DROP POLICY IF EXISTS "Allow public select on allowed_guests" ON public.allowed_guests;
DROP POLICY IF EXISTS "Allow public insert on allowed_guests" ON public.allowed_guests;
DROP POLICY IF EXISTS "Allow public update on allowed_guests" ON public.allowed_guests;
DROP POLICY IF EXISTS "Allow public delete on allowed_guests" ON public.allowed_guests;

DROP POLICY IF EXISTS "admin gerencia allowed_guests" ON public.allowed_guests;
CREATE POLICY "admin gerencia allowed_guests" ON public.allowed_guests
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── checagem de nome duplicado sem expor a lista ────────────────────
-- O convite avisa "esse nome já confirmou" sem poder baixar a lista de
-- convidados. Devolve apenas os nomes repetidos entre os que foram
-- digitados. Teto de 10 por chamada para dificultar enumeração.
CREATE OR REPLACE FUNCTION public.nome_ja_confirmado(p_nomes text[])
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_nomes IS NULL OR array_length(p_nomes, 1) IS NULL THEN
        RETURN ARRAY[]::text[];
    END IF;

    IF array_length(p_nomes, 1) > 10 THEN
        RAISE EXCEPTION 'Muitos nomes de uma vez.';
    END IF;

    RETURN COALESCE((
        SELECT array_agg(DISTINCT n)
        FROM unnest(p_nomes) AS n
        WHERE length(trim(n)) > 0
          AND EXISTS (
            SELECT 1 FROM public.guests g
            WHERE lower(g.guest_names) = lower(trim(n))
               OR lower(g.guest_names) LIKE lower(trim(n)) || ',%'
               OR lower(g.guest_names) LIKE '%, ' || lower(trim(n))
               OR lower(g.guest_names) LIKE '%, ' || lower(trim(n)) || ',%'
          )
    ), ARRAY[]::text[]);
END;
$$;

REVOKE ALL ON FUNCTION public.nome_ja_confirmado(text[]) FROM public;
GRANT EXECUTE ON FUNCTION public.nome_ja_confirmado(text[]) TO anon, authenticated;

-- ── conta do painel ─────────────────────────────────────────────────
-- Criada uma única vez via SQL (o e-mail é só um identificador interno;
-- a tela pede apenas a senha). A senha NÃO fica no código: mora no
-- Supabase Auth e é trocada pelo próprio painel, no botão da chave.
--
--   login interno: painel@convite-noemi.local
--
-- Para redefinir a senha manualmente (caso perca o acesso), rode:
--   UPDATE auth.users
--      SET encrypted_password = extensions.crypt('NOVA_SENHA', extensions.gen_salt('bf'))
--    WHERE email = 'painel@convite-noemi.local';
