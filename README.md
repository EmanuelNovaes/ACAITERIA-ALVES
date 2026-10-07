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

O schema do banco de dados está em `esquema_supabase.sql`.
# Dashboard de vendas e registro de pedidos

Antes de publicar o checkout e o Dashboard, execute `migracao_supabase_pedidos_painel.sql` no SQL Editor do mesmo projeto Supabase configurado em `.env`. A migração cria `clientes`, `pedidos`, `pedido_itens`, seus índices, políticas RLS e a RPC `registrar_pedido_checkout`; ela não é aplicada automaticamente pelo frontend.

O checkout registra cliente, pedido e itens em uma única transação antes de encaminhar ao WhatsApp. Todos os pedidos salvos são contabilizados automaticamente, sem status ou confirmação manual. O Dashboard atualiza enquanto estiver aberto e ao retornar à aba.

Execute novamente a migração para adicionar a chave de idempotência às tabelas existentes e atualizar a RPC antes de publicar este frontend. A chave permite repetir uma tentativa sem duplicar o pedido.

## Organização interna em português

Pastas: components → componentes; context → contexto; data → dados; assets → recursos; assets/images → recursos/imagens; types → tipos; utils → utilitarios; pages → paginas; services → servicos.

Arquivos renomeados (as imagens mantêm seus nomes, mudando apenas o caminho da pasta):

| Antes | Depois |
| --- | --- |
| src/App.tsx | src/Aplicacao.tsx |
| src/components/AdminSettingsModal.tsx | src/componentes/ModalConfiguracoesAdministrador.tsx |
| src/components/BrandLogo.tsx | src/componentes/LogoMarca.tsx |
| src/components/CartDrawer.tsx | src/componentes/CarrinhoLateral.tsx |
| src/components/CategoryNav.tsx | src/componentes/NavegacaoCategorias.tsx |
| src/components/CategoryPromoBanners.tsx | src/componentes/BannersPromocionaisCategorias.tsx |
| src/components/CheckoutModal.tsx | src/componentes/ModalFinalizacaoPedido.tsx |
| src/components/CombosSection.tsx | src/componentes/SecaoCombos.tsx |
| src/components/FloatingCartBar.tsx | src/componentes/BarraCarrinhoFlutuante.tsx |
| src/components/Footer.tsx | src/componentes/Rodape.tsx |
| src/components/Header.tsx | src/componentes/Cabecalho.tsx |
| src/components/HeroBanner.tsx | src/componentes/BannerPrincipal.tsx |
| src/components/MascotDisplay.tsx | src/componentes/ExibicaoMascote.tsx |
| src/components/MobileBottomNav.tsx | src/componentes/NavegacaoInferiorMovel.tsx |
| src/components/OrderSuccessModal.tsx | src/componentes/ModalPedidoConcluido.tsx |
| src/components/ProductCard.tsx | src/componentes/CartaoProduto.tsx |
| src/components/ProductOptionsModal.tsx | src/componentes/ModalOpcoesProduto.tsx |
| src/context/CartContext.tsx | src/contexto/ContextoCarrinho.tsx |
| src/data/menuConfig.ts | src/dados/ConfiguracaoCardapio.ts |
| src/index.css | src/Estilos.css |
| src/main.tsx | src/Principal.tsx |
| src/pages/AdminDashboard.tsx | src/paginas/PainelAdministrador.tsx |
| src/pages/AdminLogin.tsx | src/paginas/AcessoAdministrador.tsx |
| src/pages/SalesDashboard.tsx | src/paginas/PainelVendas.tsx |
| src/services/databaseService.ts | src/servicos/ServicoBancoDados.ts |
| src/services/ordersService.ts | src/servicos/ServicoPedidos.ts |
| src/services/supabase.ts | src/servicos/supabase.ts |
| src/types/menu.ts | src/tipos/Cardapio.ts |
| src/utils/categoryRules.ts | src/utilitarios/RegrasCategorias.ts |
| src/utils/phone.ts | src/utilitarios/Telefone.ts |
| src/utils/storeHours.ts | src/utilitarios/HorarioLoja.ts |
| src/utils/xlsx.ts | src/utilitarios/PlanilhaExcel.ts |
| supabase_migration_orders_dashboard.sql | migracao_supabase_pedidos_painel.sql |
| supabase_migration_product_type.sql | migracao_supabase_tipo_produto.sql |
| supabase_schema.sql | esquema_supabase.sql |

Componentes/exportações renomeados:

- App → Aplicacao
- AdminSettingsModal → ModalConfiguracoesAdministrador
- BrandLogo → LogoMarca
- CartDrawer → CarrinhoLateral
- CategoryNav → NavegacaoCategorias
- CategoryPromoBanners → BannersPromocionaisCategorias
- CheckoutModal → ModalFinalizacaoPedido
- CombosSection → SecaoCombos
- FloatingCartBar → BarraCarrinhoFlutuante
- Footer → Rodape
- Header → Cabecalho
- HeroBanner → BannerPrincipal
- MascotDisplay → ExibicaoMascote
- MobileBottomNav → NavegacaoInferiorMovel
- OrderSuccessModal → ModalPedidoConcluido
- ProductCard → CartaoProduto
- ProductOptionsModal → ModalOpcoesProduto
- CartContext → ContextoCarrinho
- SalesDashboard → PainelVendas
- AdminDashboard → PainelAdministrador
- AdminLogin → AcessoAdministrador
- CartProvider → ProvedorCarrinho
- useCart → usarCarrinho
- CartContextType → TipoContextoCarrinho

As interfaces de propriedades dos componentes também foram renomeadas de `NomeProps` para `PropriedadesNomeEmPortugues`, mantendo todos os campos.

Comentários traduzidos: **151** (cada comentário de linha ou bloco conta como uma unidade).

Interfaces de propriedades renomeadas:

- AdminSettingsModalProps → PropriedadesModalConfiguracoesAdministrador
- BrandLogoProps → PropriedadesLogoMarca
- CartDrawerProps → PropriedadesCarrinhoLateral
- CategoryNavProps → PropriedadesNavegacaoCategorias
- CategoryPromoBannersProps → PropriedadesBannersPromocionaisCategorias
- CheckoutModalProps → PropriedadesModalFinalizacaoPedido
- CombosSectionProps → PropriedadesSecaoCombos
- FooterProps → PropriedadesRodape
- HeaderProps → PropriedadesCabecalho
- HeroBannerProps → PropriedadesBannerPrincipal
- MascotDisplayProps → PropriedadesExibicaoMascote
- MobileBottomNavProps → PropriedadesNavegacaoInferiorMovel
- ProductCardProps → PropriedadesCartaoProduto
- ProductOptionsModalProps → PropriedadesModalOpcoesProduto
- AdminLoginProps → PropriedadesAcessoAdministrador

Verificação: `npm run lint` e `npm run build` concluídos com sucesso. Comparação dos 73 arquivos originais confirmou equivalência, desconsiderando apenas renomes, referências de caminhos e comentários.
