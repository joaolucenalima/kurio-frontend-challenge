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

As contas de demonstração incluem `admin@kurio.test` e `test@kurio.test`, ambas com senha `Kurio123!`.

## Tempo real

Socket.IO usa WebSocket com MSW no desenvolvimento e build demo. Configure VITE_SOCKET_URL somente para um servidor externo compatível. Consulte ARCHITECTURE.md e docs/realtime-test-cases.md para contratos, limitações e validação manual. Os testes automatizados disponíveis usam Playwright e os mocks do build de demonstração.

No console, use window.kurioMocks.changeNft(id, { priceEth: '2.5' }) para alterar preço; disconnect() interrompe o transporte e exercita reconexão. O retorno de changeNft pode ser reenviado com publish('nft.updated', evento) para testar duplicatas. reset() seguido de recarga restaura os dados.

## Testes automatizados

Instale o navegador com `pnpm exec playwright install chromium` e execute `pnpm test:e2e`. O comando gera o build de demonstração e executa os testes em Chromium desktop e mobile. Use `pnpm test:e2e:ui` para a interface interativa e `pnpm test:e2e:report` para abrir o relatório HTML. Falhas incluem traces em `test-results/`. Cada teste recebe um contexto isolado; os testes de contratos usam requisições do navegador interceptadas pelo MSW. Os testes visuais fazem parte da mesma execução; use `pnpm test:visual` para executá-los isoladamente e `pnpm test:visual:update` para atualizar as baselines. Revise as imagens antes de versioná-las. As baselines são organizadas por plataforma e podem variar conforme navegador, fontes e sistema operacional.

A cobertura atual inclui catálogo, pesquisa, login, sessão, isolamento de favoritos, carrinho, cupom, cotação, idempotência, timeout, liquidação e atualização de NFT por Socket.IO. A cobertura completa descrita em `scope/README.md` e nos documentos de casos ainda está em desenvolvimento; a cobertura dos casos adicionais continua em desenvolvimento.

### Auditoria Lighthouse

Execute `pnpm exec playwright install chromium` e `pnpm audit:lighthouse` para gerar o build de demonstração, iniciar o preview e auditar início e detalhe. O comando salva três medições por página e perfil em `lighthouse-reports/`, com HTML, JSON e `summary.json` contendo medianas, versões e ambiente. As medições são sequenciais e usam os perfis padrão do Lighthouse; imagens e fontes da aplicação permanecem habilitadas. `CHROME_PATH` permite indicar outro Chromium. O workflow de PR para `main` publica esses relatórios como artefato em um job separado.

A execução local de 29/10/2026 (macOS Darwin 25.6 arm64, Node 24.21, Chrome for Testing 156.0.8078.4, Lighthouse 13.6.0) obteve as seguintes medianas. LCP e TBT estão em milissegundos.

| Página / perfil | Performance | Acessibilidade | Boas práticas | SEO |  LCP |    CLS |  TBT |
| --------------- | ----------: | -------------: | ------------: | --: | ---: | -----: | ---: |
| Início mobile   |          84 |             97 |           100 |  83 | 4467 |      0 |  105 |
| Início desktop  |          99 |             95 |           100 |  83 |  931 | 0.0002 |    0 |
| Detalhe mobile  |          80 |             94 |           100 |  83 | 4127 | 0.1495 | 97.5 |
| Detalhe desktop |          94 |             97 |           100 |  83 |  897 | 0.1355 |    0 |

A performance mobile ficou abaixo de 90 com LCP acima de quatro segundos; no detalhe, o CLS também prejudica a pontuação. A acessibilidade mobile do detalhe ficou abaixo de 95, com problemas de tamanho de alvos e `lang="pt_BR"` inválido. O SEO ficou abaixo de 90 nas quatro combinações porque falta meta description e o fallback de rotas retorna HTML para `robots.txt`. Os resultados variam conforme máquina e rede; os relatórios completos identificam os elementos e diagnósticos de cada execução.
