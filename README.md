# Açaiteria Alves - Cardápio Digital

Cardápio digital mobile-first da Açaiteria Alves. Monte seu açaí com tamanhos, frutas e complementos favoritos e envie seu pedido diretamente pelo WhatsApp!

## Pré-requisitos

- Node.js 18 ou superior

## Como rodar localmente

1. Instale as dependências:
   ```
   npm install
   ```
2. Copie o arquivo `.env.example` para `.env` e preencha as variáveis do Supabase (veja a seção abaixo).
3. Rode o projeto em modo desenvolvimento:
   ```
   npm run dev
   ```
4. Para gerar a versão de produção:
   ```
   npm run build
   ```

## Configuração do Supabase

O projeto usa o Supabase para autenticação do painel administrativo e persistência do cardápio. Preencha no `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

O schema do banco de dados está em `supabase_schema.sql`.
# Dashboard de vendas e registro de pedidos

Antes de publicar o checkout e o Dashboard, execute `supabase_migration_orders_dashboard.sql` no SQL Editor do mesmo projeto Supabase configurado em `.env`. A migração cria `clientes`, `pedidos`, `pedido_itens`, seus índices, políticas RLS e a RPC `registrar_pedido_checkout`; ela não é aplicada automaticamente pelo frontend.

O checkout registra cliente, pedido e itens em uma única transação antes de encaminhar ao WhatsApp. Todos os pedidos salvos são contabilizados automaticamente, sem status ou confirmação manual. O Dashboard atualiza enquanto estiver aberto e ao retornar à aba.

Execute novamente a migração para adicionar a chave de idempotência às tabelas existentes e atualizar a RPC antes de publicar este frontend. A chave permite repetir uma tentativa sem duplicar o pedido.
