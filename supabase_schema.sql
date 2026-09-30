-- =========================================================================
-- AÇAÍTERIA ALVES
-- SUPABASE - BANCO DE DADOS + RLS + STORAGE
-- =========================================================================

-- =========================================================================
-- 1. EXTENSÕES
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =========================================================================
-- 2. FUNÇÃO PARA ATUALIZAR updated_at
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;


-- =========================================================================
-- 3. TABELA DE ADMINISTRADORES
-- =========================================================================
--
-- IMPORTANTE:
-- O login continua sendo feito pelo Supabase Auth.
--
-- Esta tabela serve para definir QUEM possui permissão administrativa.
--
-- O id deve ser o UUID do usuário criado em:
-- Supabase > Authentication > Users
--
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =========================================================================
-- 4. FUNÇÃO PARA VERIFICAR SE O USUÁRIO LOGADO É ADMIN
-- =========================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE id = auth.uid()
        AND ativo = true
    );
$$;


-- =========================================================================
-- 5. PRODUTOS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.produtos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    descricao TEXT,
    imagem_url TEXT,
    preco_base NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    ativo BOOLEAN NOT NULL DEFAULT true,
    ordem INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT timezone('utc'::text, now()),

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.produtos
    ADD COLUMN IF NOT EXISTS unidades INTEGER;

ALTER TABLE public.produtos
    ADD COLUMN IF NOT EXISTS tipo TEXT;


-- =========================================================================
-- 6. TAMANHOS DOS PRODUTOS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.produto_tamanhos (
    id TEXT PRIMARY KEY,

    produto_id TEXT NOT NULL
        REFERENCES public.produtos(id)
        ON DELETE CASCADE,

    nome TEXT NOT NULL,
    volume TEXT,

    preco NUMERIC(10,2) NOT NULL DEFAULT 0.00,

    limite_acompanhamentos INTEGER NOT NULL DEFAULT 4,

    ativo BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT timezone('utc'::text, now()),

    CONSTRAINT limite_acompanhamentos_valido
        CHECK (limite_acompanhamentos >= 0)
);


-- =========================================================================
-- 7. ACOMPANHAMENTOS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.acompanhamentos (
    id TEXT PRIMARY KEY,

    nome TEXT NOT NULL,

    ativo BOOLEAN NOT NULL DEFAULT true,

    ordem INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT timezone('utc'::text, now())
);


-- =========================================================================
-- 8. COBERTURAS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.coberturas (
    id TEXT PRIMARY KEY,

    nome TEXT NOT NULL,

    ativo BOOLEAN NOT NULL DEFAULT true,

    ordem INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT timezone('utc'::text, now())
);


-- =========================================================================
-- 9. OPÇÕES DE AÇAÍ
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.opcoes_acai (
    id TEXT PRIMARY KEY,

    nome TEXT NOT NULL,

    ativo BOOLEAN NOT NULL DEFAULT true,

    ordem INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT timezone('utc'::text, now())
);


-- =========================================================================
-- 10. ÍNDICES
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_produtos_categoria
ON public.produtos(categoria);

CREATE INDEX IF NOT EXISTS idx_produtos_ativo
ON public.produtos(ativo);

CREATE INDEX IF NOT EXISTS idx_produtos_ordem
ON public.produtos(ordem);

CREATE INDEX IF NOT EXISTS idx_produto_tamanhos_produto
ON public.produto_tamanhos(produto_id);

CREATE INDEX IF NOT EXISTS idx_produto_tamanhos_ativo
ON public.produto_tamanhos(ativo);

CREATE INDEX IF NOT EXISTS idx_acompanhamentos_ativo
ON public.acompanhamentos(ativo);

CREATE INDEX IF NOT EXISTS idx_coberturas_ativo
ON public.coberturas(ativo);

CREATE INDEX IF NOT EXISTS idx_opcoes_acai_ativo
ON public.opcoes_acai(ativo);


-- =========================================================================
-- 11. TRIGGER DE updated_at
-- =========================================================================

DROP TRIGGER IF EXISTS produtos_updated_at
ON public.produtos;

CREATE TRIGGER produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();


-- =========================================================================
-- 12. ROW LEVEL SECURITY
-- =========================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto_tamanhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acompanhamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coberturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opcoes_acai ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- 13. REMOVER POLÍTICAS ANTIGAS
-- =========================================================================

DROP POLICY IF EXISTS "Public read active products"
ON public.produtos;

DROP POLICY IF EXISTS "Admin full access products"
ON public.produtos;

DROP POLICY IF EXISTS "Public read active product sizes"
ON public.produto_tamanhos;

DROP POLICY IF EXISTS "Admin full access product sizes"
ON public.produto_tamanhos;

DROP POLICY IF EXISTS "Public read active acompanhamentos"
ON public.acompanhamentos;

DROP POLICY IF EXISTS "Admin full access acompanhamentos"
ON public.acompanhamentos;

DROP POLICY IF EXISTS "Public read active coberturas"
ON public.coberturas;

DROP POLICY IF EXISTS "Admin full access coberturas"
ON public.coberturas;

DROP POLICY IF EXISTS "Public read active opcoes_acai"
ON public.opcoes_acai;

DROP POLICY IF EXISTS "Admin full access opcoes_acai"
ON public.opcoes_acai;

DROP POLICY IF EXISTS "Admin read admin_users"
ON public.admin_users;

DROP POLICY IF EXISTS "Admin manage admin_users"
ON public.admin_users;


-- =========================================================================
-- 14. POLÍTICAS - ADMIN_USERS
-- =========================================================================

CREATE POLICY "Admin read own admin record"
ON public.admin_users
FOR SELECT
TO authenticated
USING (id = auth.uid());


-- =========================================================================
-- 15. POLÍTICAS - PRODUTOS
-- =========================================================================

-- Público pode visualizar somente produtos ativos
CREATE POLICY "Public read active products"
ON public.produtos
FOR SELECT
TO anon, authenticated
USING (ativo = true);


-- Administrador pode visualizar todos
CREATE POLICY "Admin read all products"
ON public.produtos
FOR SELECT
TO authenticated
USING (public.is_admin());


-- Administrador pode inserir
CREATE POLICY "Admin insert products"
ON public.produtos
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());


-- Administrador pode atualizar
CREATE POLICY "Admin update products"
ON public.produtos
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- Administrador pode excluir
CREATE POLICY "Admin delete products"
ON public.produtos
FOR DELETE
TO authenticated
USING (public.is_admin());


-- =========================================================================
-- 16. POLÍTICAS - TAMANHOS
-- =========================================================================

CREATE POLICY "Public read active product sizes"
ON public.produto_tamanhos
FOR SELECT
TO anon, authenticated
USING (ativo = true);


CREATE POLICY "Admin read all product sizes"
ON public.produto_tamanhos
FOR SELECT
TO authenticated
USING (public.is_admin());


CREATE POLICY "Admin insert product sizes"
ON public.produto_tamanhos
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());


CREATE POLICY "Admin update product sizes"
ON public.produto_tamanhos
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


CREATE POLICY "Admin delete product sizes"
ON public.produto_tamanhos
FOR DELETE
TO authenticated
USING (public.is_admin());


-- =========================================================================
-- 17. POLÍTICAS - ACOMPANHAMENTOS
-- =========================================================================

CREATE POLICY "Public read active acompanhamentos"
ON public.acompanhamentos
FOR SELECT
TO anon, authenticated
USING (ativo = true);


CREATE POLICY "Admin read all acompanhamentos"
ON public.acompanhamentos
FOR SELECT
TO authenticated
USING (public.is_admin());


CREATE POLICY "Admin insert acompanhamentos"
ON public.acompanhamentos
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());


CREATE POLICY "Admin update acompanhamentos"
ON public.acompanhamentos
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


CREATE POLICY "Admin delete acompanhamentos"
ON public.acompanhamentos
FOR DELETE
TO authenticated
USING (public.is_admin());


-- =========================================================================
-- 18. POLÍTICAS - COBERTURAS
-- =========================================================================

CREATE POLICY "Public read active coberturas"
ON public.coberturas
FOR SELECT
TO anon, authenticated
USING (ativo = true);


CREATE POLICY "Admin read all coberturas"
ON public.coberturas
FOR SELECT
TO authenticated
USING (public.is_admin());


CREATE POLICY "Admin insert coberturas"
ON public.coberturas
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());


CREATE POLICY "Admin update coberturas"
ON public.coberturas
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


CREATE POLICY "Admin delete coberturas"
ON public.coberturas
FOR DELETE
TO authenticated
USING (public.is_admin());


-- =========================================================================
-- 19. POLÍTICAS - OPÇÕES DE AÇAÍ
-- =========================================================================

CREATE POLICY "Public read active opcoes_acai"
ON public.opcoes_acai
FOR SELECT
TO anon, authenticated
USING (ativo = true);


CREATE POLICY "Admin read all opcoes_acai"
ON public.opcoes_acai
FOR SELECT
TO authenticated
USING (public.is_admin());


CREATE POLICY "Admin insert opcoes_acai"
ON public.opcoes_acai
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());


CREATE POLICY "Admin update opcoes_acai"
ON public.opcoes_acai
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


CREATE POLICY "Admin delete opcoes_acai"
ON public.opcoes_acai
FOR DELETE
TO authenticated
USING (public.is_admin());


-- =========================================================================
-- 20. STORAGE - IMAGENS DOS PRODUTOS
-- =========================================================================

INSERT INTO storage.buckets (
    id,
    name,
    public
)
VALUES (
    'produtos',
    'produtos',
    true
)
ON CONFLICT (id)
DO UPDATE SET public = true;


-- Remover políticas antigas caso existam
DROP POLICY IF EXISTS "Public read product images"
ON storage.objects;

DROP POLICY IF EXISTS "Admin upload product images"
ON storage.objects;

DROP POLICY IF EXISTS "Admin update product images"
ON storage.objects;

DROP POLICY IF EXISTS "Admin delete product images"
ON storage.objects;


-- Público pode visualizar imagens
CREATE POLICY "Public read product images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
    bucket_id = 'produtos'
);


-- Somente administrador pode enviar
CREATE POLICY "Admin upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'produtos'
    AND public.is_admin()
);


-- Somente administrador pode atualizar
CREATE POLICY "Admin update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'produtos'
    AND public.is_admin()
)
WITH CHECK (
    bucket_id = 'produtos'
    AND public.is_admin()
);


-- Somente administrador pode excluir
CREATE POLICY "Admin delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'produtos'
    AND public.is_admin()
);


-- =========================================================================
-- FIM DO SCHEMA
-- =========================================================================
