-- Cadastro de pedidos iniciado no checkout e dados do cliente para o painel.
-- Execute no SQL Editor do projeto Supabase antes de publicar o frontend.
create extension if not exists pgcrypto;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null unique check (telefone ~ '^[0-9]{10,11}$'),
  endereco text not null default '',
  primeiro_pedido_em timestamptz not null default now(),
  ultimo_pedido_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id),
  status text not null default 'Pendente' check (status in ('Pendente','Confirmado','Em preparo','Entregue','Cancelado')),
  subtotal numeric(10,2) not null,
  taxa_entrega numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  tipo_entrega text not null,
  endereco text not null default '',
  bairro text not null default '',
  ponto_referencia text not null default '',
  forma_pagamento text not null default '',
  observacoes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  produto_id text not null,
  produto_nome text not null,
  categoria_nome text not null default '',
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric(10,2) not null,
  subtotal numeric(10,2) not null,
  tamanho jsonb,
  complementos jsonb not null default '[]'::jsonb,
  cobertura text not null default '',
  observacoes text not null default '',
  detalhes jsonb not null default '{}'::jsonb
);

-- Compatível com pedidos existentes; nenhuma linha é removida.
alter table public.pedidos add column if not exists checkout_key uuid;
create unique index if not exists pedidos_checkout_key_idx on public.pedidos(checkout_key);

create index if not exists pedidos_created_at_idx on public.pedidos(created_at desc);
create index if not exists pedidos_cliente_id_idx on public.pedidos(cliente_id);
create index if not exists pedido_itens_pedido_id_idx on public.pedido_itens(pedido_id);

alter table public.clientes enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;

drop policy if exists "Admin read clientes" on public.clientes;
create policy "Admin read clientes" on public.clientes for select to authenticated using (public.is_admin());
drop policy if exists "Admin read pedidos" on public.pedidos;
create policy "Admin read pedidos" on public.pedidos for select to authenticated using (public.is_admin());
drop policy if exists "Admin update pedidos" on public.pedidos;
create policy "Admin update pedidos" on public.pedidos for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admin read pedido_itens" on public.pedido_itens;
create policy "Admin read pedido_itens" on public.pedido_itens for select to authenticated using (public.is_admin());

create or replace function public.registrar_pedido_checkout(p_cliente jsonb, p_pedido jsonb, p_itens jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_cliente_id uuid;
  v_pedido_id uuid;
  v_checkout_key uuid := (p_pedido->>'checkout_key')::uuid;
  v_subtotal numeric;
  v_taxa numeric;
  v_telefone text := regexp_replace(coalesce(p_cliente->>'telefone',''), '[^0-9]', '', 'g');
begin
  if (length(v_telefone) in (12,13) and left(v_telefone,2) = '55') then
    v_telefone := substr(v_telefone,3);
  end if;
  if length(v_telefone) not in (10,11) then
    raise exception 'Telefone inválido';
  end if;
  if coalesce(trim(p_cliente->>'nome'),'') = '' or jsonb_typeof(p_itens) is distinct from 'array' then
    raise exception 'Dados do pedido inválidos';
  end if;
  if jsonb_array_length(p_itens) = 0 then raise exception 'O pedido deve conter pelo menos um item'; end if;
  if v_checkout_key is not null then
    -- Serializa apenas tentativas da mesma chave, inclusive respostas perdidas.
    perform pg_advisory_xact_lock(hashtextextended(v_checkout_key::text, 0));
    select id into v_pedido_id from public.pedidos where checkout_key = v_checkout_key;
    if v_pedido_id is not null then return v_pedido_id; end if;
  end if;
  if exists (select 1 from jsonb_array_elements(p_itens) x
    where coalesce(x->>'produto_id','') = '' or coalesce(trim(x->>'produto_nome'),'') = ''
      or (x->>'quantidade')::numeric is null or (x->>'quantidade')::numeric <= 0
      or (x->>'quantidade')::numeric <> trunc((x->>'quantidade')::numeric)
      or (x->>'preco_unitario')::numeric is null or (x->>'preco_unitario')::numeric < 0
      or (x->>'subtotal')::numeric is null
      or round((x->>'subtotal')::numeric,2) <> round((x->>'quantidade')::numeric * (x->>'preco_unitario')::numeric,2)) then
    raise exception 'Itens do pedido inválidos';
  end if;
  select sum(round((x->>'subtotal')::numeric,2)) into v_subtotal from jsonb_array_elements(p_itens) x;
  v_taxa := (p_pedido->>'taxa_entrega')::numeric;
  if v_taxa is null or v_taxa < 0 or (p_pedido->>'subtotal')::numeric is null
    or (p_pedido->>'total')::numeric is null
    or round((p_pedido->>'subtotal')::numeric,2) <> v_subtotal
    or round((p_pedido->>'total')::numeric,2) <> v_subtotal + round(v_taxa,2)
    or coalesce(p_pedido->>'tipo_entrega','') not in ('entrega','retirada') then
    raise exception 'Valores do pedido inválidos';
  end if;
  insert into public.clientes(nome, telefone, endereco, ultimo_pedido_em)
  values (trim(p_cliente->>'nome'), v_telefone, coalesce(p_cliente->>'endereco',''), now())
  on conflict (telefone) do update set nome = excluded.nome, endereco = excluded.endereco, ultimo_pedido_em = now()
  returning id into v_cliente_id;

  insert into public.pedidos(checkout_key, cliente_id, subtotal, taxa_entrega, total, tipo_entrega, endereco, bairro, ponto_referencia, forma_pagamento, observacoes)
  values (v_checkout_key, v_cliente_id, (p_pedido->>'subtotal')::numeric, (p_pedido->>'taxa_entrega')::numeric, (p_pedido->>'total')::numeric,
    p_pedido->>'tipo_entrega', coalesce(p_pedido->>'endereco',''), coalesce(p_pedido->>'bairro',''),
    coalesce(p_pedido->>'ponto_referencia',''), coalesce(p_pedido->>'forma_pagamento',''), coalesce(p_pedido->>'observacoes',''))
  returning id into v_pedido_id;

  insert into public.pedido_itens(pedido_id, produto_id, produto_nome, categoria_nome, quantidade, preco_unitario, subtotal, tamanho, complementos, cobertura, observacoes, detalhes)
  select v_pedido_id, x->>'produto_id', x->>'produto_nome', coalesce(x->>'categoria_nome',''), (x->>'quantidade')::integer,
    (x->>'preco_unitario')::numeric, (x->>'subtotal')::numeric, x->'tamanho', coalesce(x->'complementos','[]'::jsonb),
    coalesce(x->>'cobertura',''), coalesce(x->>'observacoes',''), coalesce(x->'detalhes','{}'::jsonb)
  from jsonb_array_elements(p_itens) x;
  return v_pedido_id;
end; $$;

revoke all on function public.registrar_pedido_checkout(jsonb,jsonb,jsonb) from public;
grant execute on function public.registrar_pedido_checkout(jsonb,jsonb,jsonb) to anon, authenticated;
