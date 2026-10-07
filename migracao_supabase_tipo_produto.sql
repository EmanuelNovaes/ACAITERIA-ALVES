-- Adiciona tipo opcional ao produto, mantendo produtos existentes sem tipo.
-- Execute uma vez no SQL Editor do Supabase antes de publicar a versão.
ALTER TABLE public.produtos
    ADD COLUMN IF NOT EXISTS tipo TEXT;
