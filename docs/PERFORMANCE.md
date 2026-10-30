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

Medição local de **29/10/2026**. Os números abaixo são o registro dessa execução; não representam uma nova auditoria após alterações no código.

| Ambiente           | Versão                  |
| ------------------ | ----------------------- |
| Sistema            | macOS Darwin 25.6 arm64 |
| Node.js            | 24.21                   |
| Chrome for Testing | 156.0.8078.4            |
| Lighthouse         | 13.6.0                  |

| Página / perfil | Performance | Acessibilidade | Boas práticas | SEO |  LCP |    CLS |  TBT |
| --------------- | ----------: | -------------: | ------------: | --: | ---: | -----: | ---: |
| Início mobile   |          84 |             97 |           100 |  83 | 4467 |      0 |  105 |
| Início desktop  |          99 |             95 |           100 |  83 |  931 | 0.0002 |    0 |
| Detalhe mobile  |          80 |             94 |           100 |  83 | 4127 | 0.1495 | 97.5 |
| Detalhe desktop |          94 |             97 |           100 |  83 |  897 | 0.1355 |    0 |

### Como ler as métricas

- **LCP:** tempo para exibir o principal conteúdo visível. Valores menores são melhores.
- **CLS:** quanto os elementos mudam de posição durante o carregamento. Quanto mais próximo de zero, melhor.
- **TBT:** tempo em que tarefas longas bloqueiam a resposta da página. Valores menores são melhores.

LCP e TBT estão em milissegundos. CLS não tem unidade.

## Pontos abaixo das metas

| Área                             | Resultado registrado         | Diagnóstico registrado                                                             |
| -------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| Performance mobile               | Início: 84; detalhe: 80      | LCP acima de quatro segundos; deslocamentos de layout também afetam o detalhe      |
| Acessibilidade do detalhe mobile | 94                           | Alvos de interação pequenos e atributo `lang="pt_BR"` inválido                     |
| SEO                              | 83 nos dois perfis e páginas | Falta de meta description e resposta HTML para `robots.txt` pelo fallback de rotas |

Os relatórios completos identificam os elementos afetados. Esses diagnósticos pertencem à execução registrada e devem ser conferidos em uma nova auditoria após as correções.

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
