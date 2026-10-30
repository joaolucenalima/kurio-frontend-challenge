# Tempo real

## Transporte

- Socket.IO usa WebSocket no caminho `/socket.io`, no namespace padrão.
- A URL é `VITE_SOCKET_URL` ou a mesma origem da aplicação.
- MSW intercepta a conexão com `@mswjs/socket.io-binding`.
- O mock mantém o heartbeat da conexão.
- A simulação usa mensagens de texto. Não implementa acknowledgements, binários ou replay.

## Conexão e sessão

1. O cliente envia `session.authenticate` com `{ token }`; visitantes usam `null`.
2. O mock valida a sessão e responde `session.ready` ou `session.invalid`.
3. Após a conexão, o cliente atualiza os recursos ativos via REST.
4. O checkout só libera a cotação quando conexão e reconciliação estão prontas.

Trocar de usuário encerra a conexão anterior. Pedidos são enviados somente ao proprietário validado. Listeners são removidos ao encerrar o ciclo de vida.

## Eventos

| Evento          | Campos                                                | Efeito                                                  |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| `nft.updated`   | `eventId`, `nftId`, `version`, `priceEth`, `editions` | Atualiza catálogo, detalhe e carrinho por consulta REST |
| `order.updated` | `eventId`, `orderId`, `userId`, `version`, `status`   | Atualiza o pedido e seu resultado por consulta REST     |

- `eventId` identifica o evento para evitar efeitos duplicados.
- `version` identifica a versão do recurso para descartar mensagens antigas.
- `priceEth` é uma string decimal.
- `status` é `pending`, `confirmed` ou `declined`.

## Reconciliação

- Eventos invalidam consultas afetadas. REST é a fonte do estado atualizado.
- Reconexão refaz as consultas ativas.
- Eventos não criam compras nem transportam o recibo completo.
- O pedido é recuperado após refresh sem iniciar outra tentativa.
- A simulação agenda a conclusão dos pedidos e retoma os prazos após refresh.
- Estados confirmados e recusados são finais.

## Testar

- [Passo a passo dos cenários](MOCKS.md)
- [Comandos e cobertura automatizada](TESTING.md)
