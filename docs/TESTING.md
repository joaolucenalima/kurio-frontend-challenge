# Testes

## Rodar

`pnpm install --frozen-lockfile` — instala as dependências.

`pnpm exec playwright install chromium` — instala o navegador dos testes.

`pnpm test:e2e` — executa a suíte com os mocks do build de demonstração.

`pnpm test:e2e:ui` — abre a interface interativa do Playwright.

`pnpm test:e2e:report` — abre o relatório HTML da última execução.

`pnpm test:visual` — executa a regressão visual.

`pnpm test:visual:update` — atualiza as baselines; revise as imagens antes de versionar.

`pnpm typecheck` — verifica os tipos.

`pnpm lint` — verifica o código.

`pnpm format:check` — verifica a formatação.

`pnpm audit:lighthouse` — audita início e detalhe; veja [resultados e condições](PERFORMANCE.md).

## Mapa de cobertura

A tabela aponta os arquivos existentes. Não representa uma nova execução nem certifica cobertura integral do escopo.

| Área                    | Arquivo em `tests/`            | Conferir na entrega                                          |
| ----------------------- | ------------------------------ | ------------------------------------------------------------ |
| Catálogo e detalhe      | `catalog.spec.ts`              | Acesso direto e recurso inexistente                          |
| Busca e recuperação     | `search.spec.ts`               | Filtros, histórico, latência e erros                         |
| Sessão                  | `session-ui.spec.ts`           | Expiração, logout e troca de usuário                         |
| Favoritos               | `favorites-ui.spec.ts`         | Rollback e isolamento                                        |
| Compra                  | `checkout-ui.spec.ts`          | Cotação, confirmação, recusa e retomada                      |
| Contratos REST          | `contracts.spec.ts`            | Idempotência e timeout após criação                          |
| Perfil e carteiras      | `profile-ui.spec.ts`           | Persistência e validações; avatar segue pendente no contrato |
| Socket.IO               | `realtime.spec.ts`             | Duplicatas, versões antigas e reconexão                      |
| Regressão visual        | `visual.spec.ts`               | Início, detalhe, carrinho e pagamento                        |
| Acessibilidade completa | Validação adicional necessária | Teclado, foco, zoom e anúncios acessíveis                    |

## Evidências e limites

- O relatório HTML é gerado pelo Playwright. Traces de falhas ficam em `test-results/`.
- Contextos isolados evitam compartilhar o estado entre testes.
- Contratos usam requisições do navegador interceptadas pelo MSW.
- Tempo real deve passar pelo cliente Socket.IO.
- Baselines variam por plataforma; há imagens versionadas para desktop, tablet e mobile.
- Use o [roteiro manual](MOCKS.md) para complementar a suíte.
