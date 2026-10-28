# Tokens do design

Os tokens ficam em `src/shared/styles/globals.css`, no `@theme` do Tailwind CSS 4. Exemplos de uso: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-hero`, `font-mono` e `md:grid-cols-2`. Os nomes semânticos de cores também preparam a integração de componentes shadcn/ui.

## Cores

| Token             | Valor     | Uso observado / mapeamento                 |
| ----------------- | --------- | ------------------------------------------ |
| background        | `#140d0a` | Fundo das telas                            |
| foreground        | `#f5f1eb` | Texto principal                            |
| card / popover    | `#241612` | Cards, filtros, modais e resumos           |
| primary           | `#d28a4c` | Ações e destaques em cobre                 |
| accent / ring     | `#e89b55` | Destaques; reutilizado para foco           |
| secondary / muted | `#2f1d15` | Superfícies secundárias                    |
| muted-foreground  | `#cfb28c` | Texto secundário                           |
| subtle            | `#b39463` | Texto auxiliar                             |
| border            | `#3f2319` | Divisórias e contornos                     |
| input             | `#55321f` | Contornos de campos                        |
| surface-warm      | `#38220f` | Superfície quente auxiliar                 |
| highlight         | `#e3a44e` | Destaques mobile                           |
| destructive       | `#f0805f` | Indicações obrigatórias e ações de atenção |

As cores de marcas em ícones sociais não foram transformadas em cores semânticas da aplicação. O verde observado em ícones sociais não representa um token de sucesso. Os pares de foreground e o foco são mapeamentos de implementação com cores da referência.

## Tipografia

Roboto Mono em todas as telas, pesos regular (400), medium (500) e bold (700). Fonte variável e licença OFL incluídas em `public/fonts`, sem dependência de um serviço externo em execução. `font-sans` e `font-mono` usam a mesma família para manter a identidade nos componentes genéricos.

Tamanhos observados, em pixels: 9, 10, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 24, 28, 32 e 43. Todos estão disponíveis como tokens nomeados em rem, sem substituir a escala padrão do Tailwind. O texto principal usa 15 px; o hero desktop usa 43 px. Labels em destaque usam tracking de 0.1em.

As entrelinhas variam por elemento. Exemplos observados: hero 43/70, descrição 14/24 e 14/22, título 24/32 e preço 22/29. A base global usa 1.5; entrelinhas específicas devem ser aplicadas na composição de cada componente. Não se aplica globalmente a entrelinha de 16 px encontrada em alguns títulos de 18–22 px, para evitar sobreposição em textos com quebra.

## Responsividade

Os frames existentes têm **414 px no mobile** e **1440 px no desktop**. O início desktop tem conteúdo de 1200 px e margens laterais de 120 px; no mobile, margens de 24 px e conteúdo de 366 px. Não existem frames tablet nem metadados com limites de media queries. Larguras de frame são referências de composição, não evidência de breakpoints.

| Faixa configurada      | Tailwind    | Origem                                                |
| ---------------------- | ----------- | ----------------------------------------------------- |
| Base, abaixo de 768 px | Sem prefixo | Composição mobile; validar também em 390 e 414 px     |
| A partir de 768 px     | `md:`       | Decisão de adaptação para tablet, exigido pelo escopo |
| A partir de 1024 px    | `lg:`       | Decisão de adaptação para composição desktop          |
| A partir de 1440 px    | `xl:`       | Largura do frame desktop                              |

Os limites são definidos em rem (48, 64 e 90), considerando 16 px como referência. Breakpoints padrão não utilizados foram removidos para manter uma única convenção. `max-w-page` limita o conteúdo a 75rem (1200 px). A configuração fornece as ferramentas de responsividade; a adaptação das telas deve respeitar o conteúdo e ser validada em 390, 768 e 1440 px.
