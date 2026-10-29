# Tempo real

Socket.IO usa WebSocket, namespace padrão e mensagens de texto, interceptadas por MSW e `@mswjs/socket.io-binding`. O pacote publicado 0.2 usa `toSocketIo`; o mock envia heartbeat Engine.IO. Não são usados acknowledgements, binários ou replay. A URL é `VITE_SOCKET_URL` ou mesma origem, caminho `/socket.io`.

Cada conexão autentica por `session.authenticate` e só fica pronta após `session.ready` e reconciliação REST. Pedidos são isolados pelo proprietário validado no mock. Troca de identidade encerra listeners e conexão; callbacks verificam ciclo de vida ativo.

Eventos carregam `eventId`, identificador do recurso e `version`. `nft.updated` inclui preço decimal e edições; `order.updated` inclui usuário, pedido e estado. Duplicatas e versões antigas são descartadas. Eventos invalidam consultas ativas, com REST como autoridade; não transportam recibos nem criam compras. Reconexão refaz consultas ativas. Cotações ficam bloqueadas enquanto o transporte/reconciliação não está pronto.

NFTs persistidos são compartilhados pelos handlers de catálogo e carrinho. Pedidos concluem por agendamento, nunca como efeito da leitura; refresh retoma prazos. Idempotência e consumo único permanecem na simulação. Cenários são acionados no console e devem ser resetados com recarga para limpar caches. Fluxos manuais e futura automação estão em `docs/realtime-test-cases.md`.
