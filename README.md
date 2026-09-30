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
