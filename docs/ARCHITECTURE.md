# Arquitetura

## Organização

- `src/app`: inicialização, providers e composição global.
- `src/routes`: navegação e composição das telas com TanStack Router.
- `src/modules`: regras, contratos, API e interface de cada domínio.
- `src/shared`: componentes genéricos e infraestrutura compartilhada.
- `src/mocks`: simulação de rede, fixtures e persistência local.

A organização é modular por domínio. Alguns módulos ainda usam arquivos na raiz; outros já possuem segmentos `ui`, `model` e `api`. A estrutura atual não está totalmente padronizada.

## Dados e integração

- Axios envia as chamadas REST.
- TanStack Query mantém o estado remoto.
- MSW responde às chamadas na demonstração.
- Socket.IO informa alterações; REST fornece o estado atualizado.
- Busca, filtros, ordenação e página ficam na URL.

## Sessão

- A sessão simulada dura uma hora.
- O token fica no localStorage e é enviado como Bearer.
- A consulta de sessão permite retomada após refresh.
- Um 401 nessa consulta remove o token.
- As senhas fictícias são armazenadas como hash com salt.
- Trocas de identidade encerram a conexão de tempo real anterior.

## Carrinho e compra

- O mock persiste carrinhos por usuário no localStorage.
- Os endpoints atuais do carrinho exigem autenticação. O carrinho de visitante previsto no escopo ainda precisa ser atendido.
- Quantidades são inteiras. Valores em ETH trafegam como strings e os cálculos usam unidades inteiras.
- A API calcula subtotal, desconto, taxa e total.
- A revisão usa uma cotação com validade. Mudanças exigem nova revisão.
- A tentativa de compra é persistida para recuperar o mesmo pedido após timeout.
- O recibo usa o snapshot do pedido.
- A confirmação remove apenas as quantidades compradas.

## Cache

- O catálogo permanece atualizado por 30 segundos antes de ser considerado antigo.
- Dados sem uso saem do cache após cinco minutos.
- As consultas privadas incluem a identidade do usuário nas chaves.
- A configuração global repete uma vez falhas de rede e HTTP 5xx.
- Erros HTTP 4xx não são repetidos por essa política.
- Consultas específicas podem desabilitar retries.
- Montagem e foco da janela não provocam refetch automático.
- Mutations e eventos invalidam as consultas afetadas.
- Favoritos têm atualização otimista e rollback em caso de falha.
- As consultas do catálogo recebem sinal de cancelamento para descartar buscas anteriores.

## Interface e limites

- Tailwind aplica os estilos nos componentes; shadcn/ui fornece componentes adaptados.
- Os breakpoints de tablet são decisões de adaptação, pois não há frame específico.
- Imagens OpenSea são remotas e usam placeholder local em caso de falha.
- Pagamentos, carteiras e referências de transação são simulados.
- A documentação de tokens registra adaptações de tipografia e responsividade.
- A existência de um teste não significa aprovação de todo o requisito: consulte a matriz de testes.

## Referências

- [REST](API.md)
- [Tempo real e reconciliação](REALTIME.md)
- [Cenários manuais](MOCKS.md)
- [Decisões visuais](design-tokens.md)
