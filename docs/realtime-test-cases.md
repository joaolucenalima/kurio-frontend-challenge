# Fluxos de validação de tempo real

Executar com `pnpm dev` ou `pnpm build:demo` e `pnpm preview`, em desktop e mobile. Não há Playwright nesta etapa. Cada caso começa com `await window.kurioMocks.reset()` e recarga da página; autenticar com uma conta fictícia e adicionar um NFT ao carrinho quando necessário.

## Preço e disponibilidade

1. Abrir detalhe, adicionar ao carrinho e iniciar revisão no pagamento.
2. No console, executar `window.kurioMocks.changeNft('ID', { priceEth: '2.5' })` com o identificador do NFT escolhido.
3. Verificar aviso, fechamento da revisão e atualização do resumo pela API. A confirmação anterior não deve permanecer disponível.
4. Repetir com `{ editions: [{ id: 'EDICAO', name: 'Nome', available: 0 }] }`, preservando as demais edições quando houver. A compra deve ficar impedida até corrigir as quantidades.
5. No catálogo, aplicar ordenação/filtro de preço e alterar o preço. Verificar posição, inclusão/exclusão, contagens e preservação da URL.

## Duplicatas e respostas antigas

1. Guardar `const event = window.kurioMocks.changeNft('ID', { priceEth: '3' })`.
2. Executar `window.kurioMocks.publish('nft.updated', event)` duas vezes. Não deve repetir aviso.
3. Alterar novamente para preço superior e reenviar o evento anterior. O preço não pode regredir.
4. Repetir no cenário `out-of-order`, com consultas pendentes durante a alteração. Verificar convergência REST e ausência de regressão.

## Pedidos, desconexão e refresh

1. Escolher cenário `payment-success`, concluir a compra e observar pendente seguido de confirmado. O recibo mantém snapshot e somente as quantidades compradas são removidas.
2. Repetir com `payment-declined`: estado recusado terminal e itens preservados.
3. Durante pedido pendente, executar `window.kurioMocks.disconnect()`. A reconexão deve recuperar o mesmo pedido, sem POST adicional.
4. Recarregar durante pendência e após conclusão. A tentativa deve recuperar o mesmo identificador e recibo.
5. Usar `timeout-after-create` e recuperar a tentativa: mesma chave e mesmo pedido; reenviar conteúdo diferente com essa chave deve resultar em conflito.
6. Após confirmação, alterar preço do NFT. O recibo não deve mudar.

## Sessão e falhas

1. Encerrar sessão com consultas/eventos em trânsito e entrar com outro usuário. Nenhum pedido, aviso privado ou resposta da sessão anterior pode aparecer.
2. Expirar a sessão no checkout. Verificar proteção, preservação do contexto e retomada após login.
3. Interromper a conexão durante revisão: confirmação indisponível até reconciliação. Simular falha REST e verificar recuperação após restaurar rede e reconectar.
4. Navegar repetidamente entre catálogo, detalhe e pagamento. Cada evento deve produzir apenas um efeito.
5. Executar reset com pedido pendente e recarregar: nenhum pedido ou alteração anterior deve reaparecer.

Registrar viewport, cenário, passos, resultados, requisições REST e frames Socket.IO. Conferir avisos com leitor de tela e teclado. Os futuros testes automatizados devem atravessar os handlers MSW e o cliente Socket.IO, sem alterar cache diretamente.
