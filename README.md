# Kurio — Marketplace de NFTs

Catálogo React/TypeScript com TanStack Router, TanStack Query, Axios e API REST simulada por MSW.

## Execução

Use Node.js 24 e pnpm (o lockfile foi gerado com pnpm 11).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Acesse http://localhost:3000. `pnpm dev` ativa mocks por `.env.development`.

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build:demo
pnpm preview
```

O build de demonstração inclui o Service Worker e os snapshots. Hospedagem requer HTTPS e fallback de rotas para `index.html`. `pnpm build` gera a configuração de produção, sem mocks por padrão. Para uma API compatível, configure `VITE_API_URL`; os mocks usam `/api` na mesma origem. Nunca coloque credenciais OpenSea em variáveis `VITE_*`.

## Base de NFTs

- 4 exemplos do Figma: Emerald Ape #042, Sage Nomad #009, Neon Vessel #552 e Golden Beat #207, com artes locais exportadas pelo MCP do Figma.
- 30 BAYC, tokens 0–29, e 30 Argonauts obtidos pelo MCP do OpenSea; snapshots em `src/mocks/snapshots` preservam data, IDs, atributos e URLs originais.
- Mais 70 NFTs obtidos pelo MCP do OpenSea: 30 Suited Ape Society (Robinhood), 10 Mutant Ape Yacht Club (Ethereum), 20 Bodoggos e 10 Galactic Geckos (Solana). Total: 134 NFTs. Identificadores Solana preservam maiúsculas e minúsculas.
- Os preços e estoques de compra são simulados, independentes de anúncios ou propriedade real. BAYC começa em 1.00 ETH; Argonauts em 0.50 ETH; incremento de 0.01 por token ordenado. Os quatro preços do Figma são preservados.
- As novas coleções começam em 0.75 ETH (Suited Ape Society), 1.50 ETH (Mutant Ape), 0.25 ETH (Bodoggos) e 0.40 ETH (Galactic Geckos), com incremento de 0.01. Todos os preços são fictícios em ETH, inclusive nas redes Solana e Robinhood; não representam preços nativos nem conversão de cotações reais.
- Imagens OpenSea usam URLs remotas, sem download. Falhas mostram placeholder local. SVGs são exibidos por `<img>`; HTML de animação não é executado.

Os snapshots são estáveis: build, reset e refresh não consultam OpenSea. Para atualizar a seleção, faça nova coleta pelo MCP e confira identidade, contagens e assets Figma nos arquivos atualizados. Ainda não há um comando automatizado de validação dos snapshots.

### Ranking do catálogo

`GET /api/nfts` aceita `ranking=all|new-releases|trending`. O valor padrão é `all`, que respeita a ordenação selecionada; `new-releases` ordena primariamente por data de lançamento decrescente e `trending` ordena primariamente pela quantidade de vendas decrescente. Busca, filtros, ordenação secundária e paginação continuam combináveis e são preservados na URL da aplicação.

## Cenários e reset

Defina `VITE_MOCK_SCENARIO` em `.env.local` ou `.env.demo.local` e reinicie o servidor, ou use o console do navegador:

```js
window.kurioMocks.scenario('slow')
window.kurioMocks.scenario('empty')
window.kurioMocks.scenario('transient-error')
window.kurioMocks.scenario('out-of-order')
window.kurioMocks.scenario('success')
window.kurioMocks.reset()
```

Após mudar o cenário ou resetar, recarregue a página para descartar o cache do Query. `transient-error` falha na primeira requisição (503) e permite recuperação automática com um retry. `slow` espera 2.5 segundos. `out-of-order` alterna 1.5 segundos e 100 ms; buscas sucessivas permitem exercitar cancelamento. O cenário `empty` retorna lista vazia, preservando o detalhe.

Os handlers consultam diretamente as fixtures locais. O catálogo não utiliza localStorage nem mantém alterações de preço ou estoque. O reset restaura o cenário de rede padrão e seu contador de requisições.

Autenticação, favoritos, compra, tela de detalhe, integração Socket.IO e testes Playwright serão desenvolvidos nas próximas etapas. Não há credenciais de usuário nesta etapa.
