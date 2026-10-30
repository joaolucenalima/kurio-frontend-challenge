# Testar os cenários

## Preparar

1. Execute `pnpm dev` e abra http://localhost:3000.
2. Abra o console do navegador.
3. Entre com `admin@kurio.test` e `Kurio123!` para testar compras e conta.

Os comandos abaixo funcionam com mocks habilitados. Para selecionar um cenário antes de iniciar, defina `VITE_MOCK_SCENARIO` em `.env.local`.

## Restaurar o estado inicial

1. Execute no console:

```js
await window.kurioMocks.reset()
location.reload()
```

2. Entre novamente. O reset restaura contas, sessão, NFTs, favoritos, carrinhos, carteiras e pedidos.

## Catálogo

1. Execute um dos comandos abaixo.
2. Recarregue a página para descartar o cache.
3. Observe o resultado indicado.

| Comando                                         | O que observar                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| `window.kurioMocks.scenario('success')`         | Catálogo com resultados                                                   |
| `window.kurioMocks.scenario('empty')`           | Lista vazia; detalhes continuam disponíveis                               |
| `window.kurioMocks.scenario('slow')`            | Skeletons durante 2,5 segundos                                            |
| `window.kurioMocks.scenario('transient-error')` | Primeira consulta falha com 503; retry permite recuperação                |
| `window.kurioMocks.scenario('out-of-order')`    | Faça buscas sucessivas; o resultado final deve corresponder à busca atual |

## Sessão expirada

1. Entre na conta e abra o pagamento.
2. Execute `window.kurioMocks.expireCurrentSession()`.
3. Faça uma operação privada ou recarregue.
4. Verifique o pedido de login e a retomada do contexto.

## Falha em favoritos

1. Entre na conta.
2. Execute `window.kurioMocks.failNextFavoriteMutation()`.
3. Favorite um NFT.
4. Observe o erro e a reversão da alteração otimista. Tente novamente.

## Cupom

1. Adicione um NFT ao carrinho.
2. Aplique `KURIO10`: o desconto deve aparecer.
3. Aplique `EXPIRED`: deve aparecer erro de expiração.
4. Aplique outro código: deve aparecer erro de cupom inválido.

## Compra

1. Entre, adicione um NFT e prepare uma carteira compatível.
2. Abra o pagamento e selecione um cenário no console.
3. Revise e envie a compra.

| Cenário em `window.kurioMocks.scenario('...')` | O que observar                                    |
| ---------------------------------------------- | ------------------------------------------------- |
| `payment-success`                              | Pedido confirmado e recibo                        |
| `payment-declined`                             | Pedido recusado; itens preservados                |
| `payment-error`                                | Falha no envio e possibilidade de recuperação     |
| `payment-pending`                              | Pedido permanece pendente                         |
| `timeout-after-create`                         | Recuperação do mesmo pedido, sem compra duplicada |
| `price-changed`                                | Mudança na cotação exige revisão                  |
| `stock-conflict`                               | Compra bloqueada por disponibilidade              |

Restaure o estado inicial entre cenários independentes. Para testar clique repetido, envie a compra rapidamente duas vezes e confira que existe apenas um pedido.

## Preço atualizado por Socket.IO

1. Adicione um NFT e abra o carrinho.
2. Copie o ID do NFT da URL de seu detalhe.
3. Execute, substituindo o ID:

```js
window.kurioMocks.changeNft('ID_DO_NFT', { priceEth: '2.5' })
```

4. Confira o aviso, o preço e o resumo atualizado.
5. No pagamento, confirme que a cotação anterior não pode ser enviada.

## Duplicatas e reconexão

1. Altere o preço e guarde o evento:

```js
const evento = window.kurioMocks.changeNft('ID_DO_NFT', { priceEth: '2.5' })
window.kurioMocks.publish('nft.updated', evento)
```

2. Confira que a duplicata não reaplica os efeitos.
3. Execute `window.kurioMocks.disconnect()` e aguarde a reconexão.
4. Confira a atualização via REST. Repita com um pedido pendente e recarregue: não deve surgir outra compra.

## Limites

- Os cenários disponíveis estão listados acima; nem todas as falhas exigidas pelo escopo possuem um seletor próprio.
- O estado é local ao navegador. Não representa um backend compartilhado entre dispositivos.
- Imagens remotas dependem de rede; o catálogo usa snapshots e não consulta OpenSea ao iniciar.
