# Dados e assets

## Origem dos dados

O catálogo contém **134 NFTs**, armazenados em arquivos JSON em `src/mocks/snapshots`.

- **Figma:** quatro NFTs da referência visual, com imagens locais.
- **OpenSea:** 130 NFTs coletados previamente pelo MCP, com imagens remotas.
- A aplicação lê esses arquivos locais. Não consulta a API OpenSea ao iniciar, gerar o build ou restaurar os mocks.

Esses arquivos são snapshots: cópias dos dados usadas para manter a demonstração reproduzível.

## Coleções

| Coleção               | NFTs | Rede      | Preço inicial simulado |
| --------------------- | ---: | --------- | ---------------------- |
| Seleção do Figma      |    4 | Ethereum  | Conforme a referência  |
| Bored Ape Yacht Club  |   30 | Ethereum  | 1,00 ETH               |
| Argonauts             |   30 | Ethereum  | 0,50 ETH               |
| Suited Ape Society    |   30 | Robinhood | 0,75 ETH               |
| Mutant Ape Yacht Club |   10 | Ethereum  | 1,50 ETH               |
| Bodoggos              |   20 | Solana    | 0,25 ETH               |
| Galactic Geckos       |   10 | Solana    | 0,40 ETH               |

Nas coleções externas, os preços avançam em incrementos de 0,01 ETH na sequência definida pelas fixtures.

## Dados simulados

- Preços, disponibilidade e condições de compra pertencem à demonstração.
- Datas de lançamento, vendas e avaliações servem às interações do catálogo; não devem ser interpretadas como indicadores atuais do mercado.
- Os textos das avaliações vêm de uma lista fictícia compartilhada.
- Todos os preços são apresentados em ETH, inclusive nas redes Solana e Robinhood. Não há conversão para moedas nativas.
- A compra não transfere NFTs nem comprova propriedade real.

## Imagens e fontes

| Asset                     | Local ou origem                     | Comportamento                    |
| ------------------------- | ----------------------------------- | -------------------------------- |
| Artes do Figma            | `public/images/nfts`                | Disponíveis localmente           |
| Imagens OpenSea           | URLs nos snapshots                  | Dependem de conexão com a origem |
| Imagem de fallback        | `public/images/nft-placeholder.svg` | Aparece quando uma imagem falha  |
| Roboto Mono e licença OFL | `public/fonts`                      | Disponíveis localmente           |
| Prints do README          | `docs/images`                       | Versionados junto à documentação |

SVGs externos são exibidos como imagens. Conteúdo HTML de animação não é executado.

## Ordenação do catálogo

| Ranking        | Comportamento                                 |
| -------------- | --------------------------------------------- |
| `all`          | Usa a ordenação selecionada pelo usuário      |
| `new-releases` | Prioriza as datas de lançamento mais recentes |
| `trending`     | Prioriza a quantidade de vendas das fixtures  |

Busca, filtros, ordenação e paginação podem ser combinados. O estado fica na URL. Veja os parâmetros em [Contratos REST](API.md).

## Persistência e reset

- Mudanças simuladas de preço e disponibilidade ficam no localStorage.
- Catálogo, detalhe e carrinho consultam o mesmo estado dos NFTs.
- Refresh preserva essas mudanças.
- O reset remove as alterações e restaura os snapshots iniciais. Também restaura os demais dados da simulação.

Para restaurar pelo console do navegador:

```js
await window.kurioMocks.reset()
location.reload()
```

Veja outros exemplos em [Cenários para testar](MOCKS.md).

## Atualizar os dados

1. Colete os NFTs desejados pelo MCP do OpenSea.
2. Atualize os JSONs em `src/mocks/snapshots`, preservando o formato dos contratos.
3. Confira IDs, coleção, rede, imagens e quantidade de registros. Preserve maiúsculas e minúsculas dos identificadores Solana.
4. Mantenha os quatro NFTs e as imagens locais da referência do Figma.
5. Restaure os mocks e confira busca, filtros, paginação e detalhe.
6. Execute os [testes](TESTING.md) e revise as baselines visuais afetadas.

Ainda não existe um comando específico para coletar ou validar automaticamente os snapshots.
