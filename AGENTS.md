# Orientações para agentes

## Fontes de referência e prioridades

- Leia `scope/README.md` antes de desenvolver. Ele define os requisitos funcionais, a stack, os critérios de avaliação e a entrega; este documento destaca as regras e não substitui o enunciado completo.
- A referência visual é o **Pen.dev, acessado via MCP**, conforme decisão do usuário. Essa orientação substitui as referências ao Figma no enunciado. Consulte as telas e os componentes correspondentes pelo MCP antes de implementar ou alterar a apresentação. Se o acesso estiver indisponível, informe a limitação; não invente uma referência alternativa.
- Instruções explícitas do usuário prevalecem sobre as orientações deste arquivo.

## Arquitetura modular por domínio

Adote arquitetura modular por domínio. A escolha prioriza coesão das regras de negócio e interfaces explícitas com menos camadas que FSD para o porte deste desafio. Não introduza a estrutura de camadas FSD sem solicitação.

| Local         | Responsabilidade                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/app`     | Inicialização, providers e composição global da aplicação                                                           |
| `src/routes`  | Rotas TanStack Router, parâmetros de URL, proteção de acesso e composição das telas                                 |
| `src/modules` | Domínios: catálogo, favoritos, carrinho, checkout, pedidos, sessão, perfil e carteiras                              |
| `src/shared`  | Componentes genéricos/shadcn/ui, infraestrutura Axios e Socket.IO, configuração e utilitários sem regras de negócio |
| `src/mocks`   | Handlers MSW, fixtures, persistência simulada, eventos e cenários reproduzíveis                                     |

- Cada módulo concentra UI, contratos, chamadas REST, queries, mutations e regras do domínio. Crie subdivisões internas somente quando necessárias; não gere pastas vazias ou abstrações antecipadas.
- Exponha interfaces públicas explícitas por módulo. Outros módulos não devem importar seus arquivos internos. Evite dependências circulares; componha fluxos entre domínios nas rotas ou na aplicação.
- Mantenha regras de negócio no domínio responsável, sem transformá-las em utilitários genéricos de `shared`. A infraestrutura Socket.IO é compartilhada; a interpretação dos eventos pertence aos domínios e sua composição à aplicação.
- Mocks reutilizam contratos dos domínios. Código de produção não deve importar implementações dos mocks; a inicialização pode carregar a camada de simulação condicionalmente por configuração.
- Mantenha as rotas enxutas e preserve o roteamento baseado em arquivos. Não edite manualmente `src/routeTree.gen.ts`.
- Use pnpm e preserve o lockfile. Consulte `package.json` antes de executar comandos; comandos exigidos na entrega podem ainda não existir no scaffold.
- Use Oxlint (`pnpm lint`, `pnpm lint:fix`) e Oxfmt (`pnpm format`, `pnpm format:check`). Respeite `.oxlintrc.json` e `.oxfmtrc.json`; mantenha aspas simples e ausência de ponto e vírgula no código. Não formate manualmente rotas geradas, lockfile ou o enunciado em `scope/`.

## Commits

- Antes de cada commit, execute `pnpm format` para aplicar a formatação do código e `pnpm format:check` para confirmar o resultado. Se houver falha, corrija antes de criar o commit.
- Revise as alterações produzidas pela formatação e inclua no staging os arquivos pertinentes antes do commit.
- Todas as mensagens de commit devem seguir Conventional Commits: `<tipo>[escopo opcional]: <descrição>`. Use tipos como `feat`, `fix`, `refactor`, `chore`, `style`, `perf`, `build` e `ci`, conforme a alteração.
- Use `!` após o tipo/escopo ou um rodapé `BREAKING CHANGE:` para mudanças incompatíveis. Exemplo de commit inicial: `chore: initialize project`.

## Stack e integração obrigatórias

- Use efetivamente React, TypeScript, TanStack Router, TanStack Query, Axios, REST, Socket.IO, Tailwind CSS, shadcn/ui e MSW. Lighthouse é exigido para auditoria.
- Use TanStack Router para navegação, parâmetros de busca e proteção de fluxos privados. Todas as telas previstas precisam suportar acesso direto e refresh; trate rotas inexistentes.
- Passe chamadas REST pelo Axios. Use TanStack Query para consultas, mutations e sincronização do estado remoto, com contratos tipados entre transporte, estado e interface.
- Inclua usuário e parâmetros relevantes nas query keys. Cancele ou descarte respostas obsoletas e invalide ou atualize o cache coerentemente após mutations e eventos.
- Represente carregamento, vazio, erro, sucesso e atualização em segundo plano. Permita recuperação de falhas sem duplicar operações.
- Aplique atualização otimista em pelo menos uma interação, com rollback em caso de falha.

## Escopo funcional e invariantes

Implemente início/catálogo, detalhe do NFT, carrinho, pagamento, confirmação, login, cadastro, perfil e carteiras. APIs, autenticação, carteiras e pagamentos são simulados. Integrações reais com blockchain, extensões de carteira e gateways não fazem parte do escopo.

Páginas editoriais, suporte, atividade, ofertas e downloads estão fora da entrega. Links e ações auxiliares devem ter comportamento coerente, sem aparentar sucesso de uma funcionalidade inexistente.

### Catálogo, detalhe e favoritos

- Preserve busca, filtros combinados, ordenação e paginação na URL, incluindo refresh e histórico. Alterar filtros reinicia a paginação; os parâmetros da API devem corresponder ao estado da URL.
- Trate resultados vazios, falhas, respostas fora de ordem, NFT inexistente, edição indisponível e limites de quantidade.
- Favoritos exigem autenticação e devem persistir para o usuário correspondente.

### Carrinho, cotação e compra

- Respeite disponibilidade por NFT e edição ao adicionar ou alterar quantidades inteiras. Permita remoção, aplicação/remoção de cupom e tratamento de cupom inválido ou expirado.
- Persista o carrinho após refresh e preserve os itens do visitante ao autenticar. Reflita alterações de preço e disponibilidade recebidas durante a navegação.
- Transporte ETH como strings decimais e use cálculo decimal preciso ou unidades inteiras adequadas; não calcule valores monetários com ponto flutuante que perca precisão. Subtotal, desconto, taxa de rede e total devem corresponder à cotação da API.
- Valide os dados do colecionador e permita revisão. Use carteiras cadastradas, seleção de rede e simulação de conexão, recusa e desconexão.
- Antes de confirmar a compra, revalide preço, disponibilidade, cupom e taxas pela API. Mudanças exigem nova confirmação do usuário; impeça o envio com cotação desatualizada.
- Crie pedidos com chave de idempotência. A mesma tentativa, inclusive após timeout, deve recuperar o mesmo pedido; reutilizar a chave com conteúdo diferente deve gerar conflito. Bloquear cliques repetidos na UI não substitui idempotência na API simulada.
- Represente estados pendente, confirmado e recusado, recuperáveis após refresh ou reconexão sem criar outra compra. Confirmado e recusado são terminais.
- Exiba confirmação somente após confirmação efetiva pela simulação. Preserve itens em falhas e, no sucesso, remova apenas os itens e quantidades comprados.
- O recibo reproduz o snapshot do pedido e não muda com alterações posteriores do catálogo. Referências de transação e links de exploração são simulados.

### Conta e sessão

- Implemente cadastro, login, logout e recuperação de sessão pela API simulada. Checkout, perfil, carteiras, favoritos e pedidos exigem autenticação.
- Trate expiração durante navegação e checkout, preservando o contexto para retomada após login.
- Logout e troca de usuário devem limpar cache privado, listeners e subscriptions da sessão anterior. Respostas ou eventos antigos não podem expor nem atualizar dados de outro usuário.
- Valide cadastro, perfil, avatar, senha e carteiras principal/secundária, incluindo conflitos e erros da API. Alterações confirmadas persistem após refresh. Use credenciais fictícias e não armazene senhas em claro.

## Contratos, mocks e tempo real

- Defina contratos REST para sessão/conta, NFTs, favoritos, carrinho, cotação, pedidos, perfil e carteiras. Represente erros de validação, sessão inválida, permissão, recurso inexistente, conflito de disponibilidade e falha transitória.
- Mantenha respostas fictícias e regras da simulação na camada de rede MSW. Componentes, hooks e cliente Axios não devem conter respostas mockadas ou caminhos alternativos de negócio.
- Compartilhe estado consistente entre recursos simulados. Persistência local é permitida para refresh; o reset deve restaurar integralmente um cenário conhecido. Disponibilize mocks por configuração também no build de demonstração.
- Disponibilize fixtures variadas para filtros/paginação, pelo menos dois usuários e cenários determinísticos de sucesso/vazio, latência variável, respostas fora de ordem, timeout, conexão indisponível, HTTP 4xx/5xx, expiração, acesso não autorizado, conflitos de cadastro/validação, cupom inválido/expirado, preço alterado, edição esgotada e pagamento confirmado/recusado.
- Inclua timeout após criação de pedido com recuperação do mesmo pedido por idempotência. Mudanças nos dados simulados devem aparecer tanto no REST quanto nos eventos correspondentes.
- Simule eventos com MSW e integração compatível com o protocolo Socket.IO, exercitando `socket.io-client`. Chamadas diretas a setters, callbacks ou cache para substituir o socket não atendem ao requisito.
- Implemente `nft.updated` para preço/disponibilidade em catálogo, detalhe e carrinho; implemente `order.updated` para estado do pedido, confirmação e recusa.
- Eventos devem carregar identidade estável, recurso afetado e versão. Ignore duplicatas e versões antigas sem regredir estado nem reaplicar efeitos.
- Reconcilie recursos ativos com REST após reconexão. Libere listeners/subscriptions ao encerrar seu ciclo de vida e isole os eventos por sessão.
- Garanta o fluxo de NFT no carrinho que muda de preço/disponibilidade: informar a mudança, atualizar o resumo e impedir confirmação com cotação antiga. Uma desconexão durante pedido pendente deve permitir retomada sem nova compra.

## Interface, responsividade e acessibilidade

- Use o Pen.dev via MCP para preservar tipografia, cores, espaçamentos, hierarquia, imagens, proporções e composição. Adapte shadcn/ui à identidade visual.
- Todas as telas devem funcionar em desktop, tablet e mobile, inclusive perfil, carteiras e confirmação sem frame específico. Avalie larguras de 390, 768 e 1440 px.
- Estados não desenhados devem seguir o padrão visual existente.
- Use assets disponíveis na referência e mantenha imagens e fontes necessárias acessíveis na execução local.
- Use skeletons com shimmer para componentes dependentes de dados, incluindo catálogo, detalhe e resumo do carrinho. Preserve dimensões para evitar deslocamentos e respeite movimento reduzido.
- Garanta teclado, foco visível e controle de foco em diálogos/drawers; semântica, labels e erros associados; textos alternativos; contraste legível; estados que não dependam apenas de cor; feedback acessível para mutations e eventos; ausência de overflow horizontal indevido e perda de conteúdo com zoom.

## Auditoria e entrega

- Disponibilize comandos para desenvolvimento com mocks, build, preview, tipos, lint e Lighthouse.
- Audite início e detalhe com Lighthouse, em build otimizado, cenário padrão e perfis mobile/desktop. Faça três medições por página/perfil e reporte medianas: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95 e SEO ≥ 90.
- Registre LCP, CLS e TBT; entregue configuração e relatórios HTML/JSON, versões, ambiente e condições. Justifique metas não atingidas sem simplificar a aplicação exclusivamente para a auditoria.
- A entrega exige código-fonte, lockfile, assets, mocks, fixtures e configurações de auditoria, executáveis de um checkout limpo sem serviços privados ou backend de produção.
- O deploy público é obrigatório na entrega. A versão publicada deve corresponder ao código entregue, manter mocks e tempo real funcionais e suportar acesso direto/refresh de rotas. Forneça links do repositório e da aplicação.
- Considere eliminatórios: stack sem uso efetivo, fluxos principais apenas visuais, confirmação sem resposta da simulação, exposição de dados entre usuários e eventos simulados diretamente na UI.
