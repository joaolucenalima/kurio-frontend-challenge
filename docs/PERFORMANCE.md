# Performance

## Rodar a auditoria

1. Instale o navegador utilizado na medição:

```sh
pnpm exec playwright install chromium
```

2. Execute a auditoria:

```sh
pnpm audit:lighthouse
```

O comando gera o build de demonstração, inicia o preview e executa o Lighthouse. Não é necessário iniciar o servidor manualmente.

## O que é avaliado

- **Páginas:** início (`/`) e detalhe (`/nfts/emerald-ape`).
- **Perfis:** mobile e desktop.
- **Amostras:** três medições por página e perfil, totalizando 12 execuções.
- **Resultado:** mediana de cada categoria e métrica.
- **Condições:** mocks no cenário padrão `success`, com imagens e fontes habilitadas.
- **Configuração:** perfis e limitação de rede/CPU padrão do Lighthouse.

A mediana é o valor central das três medições ordenadas. Ela reduz a influência de uma execução isolada muito diferente das outras.

A configuração está em `scripts/lighthouse.mjs`. O preview usa a porta `4174`. A variável `CHROME_PATH` permite indicar outro executável Chromium.

## Metas do desafio

| Categoria      | Nota mínima |
| -------------- | ----------: |
| Performance    |          90 |
| Acessibilidade |          95 |
| Boas práticas  |          95 |
| SEO            |          90 |

## Relatórios gerados

Os arquivos ficam em `lighthouse-reports/`. Cada execução substitui os relatórios anteriores dessa pasta.

| Arquivo                | Conteúdo                                                                    |
| ---------------------- | --------------------------------------------------------------------------- |
| `inicio-mobile-1.html` | Relatório visual de uma medição; o nome varia por página, perfil e execução |
| `inicio-mobile-1.json` | Dados completos da mesma medição                                            |
| `summary.json`         | Medições, medianas, versões das ferramentas e ambiente                      |

O workflow de pull requests para `main` também disponibiliza os relatórios como artefato de um job separado.

## Resultados registrados

Medição local em **2026-10-30 às 02:09:08.490 UTC**. Os números são medianas das três medições por página e perfil.

| Ambiente           | Versão                  |
| ------------------ | ----------------------- |
| Sistema            | macOS Darwin 25.6 arm64 |
| Node.js            | 24.21                   |
| Chrome for Testing | 156.0.8078.4            |
| Lighthouse         | 13.6.0                  |

| Página / perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP (ms) |     CLS | TBT (ms) |
| --------------- | ----------: | -------------: | ------------: | --: | -------: | ------: | -------: |
| Início mobile   |          84 |            100 |           100 | 100 |     4197 | 0.00000 |      102 |
| Início desktop  |          99 |             99 |           100 | 100 |      924 | 0.00022 |        0 |
| Detalhe mobile  |          91 |             97 |           100 | 100 |     3388 | 0.00006 |       84 |
| Detalhe desktop |         100 |            100 |           100 | 100 |      805 | 0.00000 |        0 |

### Como ler as métricas

- **LCP:** tempo para exibir o principal conteúdo visível. Valores menores são melhores.
- **CLS:** quanto os elementos mudam de posição durante o carregamento. Quanto mais próximo de zero, melhor.
- **TBT:** tempo em que tarefas longas bloqueiam a resposta da página. Valores menores são melhores.

LCP e TBT estão em milissegundos. CLS não tem unidade.

## Metas não atingidas

- **Performance do início mobile: 84 de 90.** O LCP foi de 4197 ms. A imagem de um card demorou a aparecer porque o navegador só recebe seu endereço após carregar a aplicação e consultar o catálogo.
- **Consulta do catálogo:** o cenário padrão dos mocks inclui 300 ms de latência, somados à espera pelos dados antes de solicitar a imagem.
- **Carregamento inicial:** o relatório aponta cerca de 88 KiB de JavaScript não utilizado em uma das medições. A rede e a CPU mais lentas simuladas no mobile aumentam o tempo de carregamento.

Esses fatores ajudam a explicar o resultado; o impacto individual de cada um não foi medido separadamente.

## Comparar novas execuções

1. Use o mesmo cenário de mocks e mantenha imagens e fontes habilitadas.
2. Execute `pnpm audit:lighthouse` novamente.
3. Compare as medianas em `summary.json` com as metas.
4. Abra os relatórios HTML para investigar resultados abaixo da meta.
5. Ao atualizar esta documentação, registre a data, o ambiente e as novas medianas.

Máquina, rede e versão do navegador podem alterar os resultados. Evite comparar uma única medição com as medianas registradas.

## Referências

- [Escopo e critérios de performance](SCOPE.md)
- [Comandos de testes](TESTING.md)
- [Dados, imagens e fontes](DATA.md)
