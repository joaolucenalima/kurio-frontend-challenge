# Contratos REST

## Convenções

- Base padrão: `/api`.
- Corpos e respostas usam JSON.
- Rotas privadas recebem `Authorization: Bearer <token>`.
- ETH usa strings decimais, como `"1.25"`. Quantidades são inteiras.
- Os tipos completos ficam nos contratos dos módulos. Este documento resume a interface utilizada.

## Sessão e conta

| Método e caminho  | Entrada                         | Resposta           |
| ----------------- | ------------------------------- | ------------------ |
| `POST /accounts`  | `username`, `email`, `password` | Sessão criada      |
| `POST /session`   | `email`, `password`             | Sessão autenticada |
| `GET /session`    | Bearer token                    | Sessão atual       |
| `DELETE /session` | Bearer token                    | 204, sem corpo     |

Uma sessão contém `token`, `expiresAt` e `user` (`id`, `username`, `email`). `expiresAt` é uma data em milissegundos. Conflitos de cadastro retornam 409; credenciais inválidas retornam 401.

## Catálogo

| Método e caminho        | Entrada           | Resposta                                       |
| ----------------------- | ----------------- | ---------------------------------------------- |
| `GET /nfts`             | Parâmetros abaixo | `items`, `total`, `page`, `pageSize`, `counts` |
| `GET /nfts/:id`         | ID                | NFT                                            |
| `GET /nfts/:id/reviews` | ID                | Avaliações                                     |
| `GET /nfts/:id/related` | ID                | NFTs relacionados                              |

Parâmetros: `q`, `collection`, `network`, `minPrice`, `maxPrice`, `ranking`, `sort` e `page`. A página tem nove itens. `ranking` aceita `all`, `new-releases` e `trending`. `sort` aceita `featured`, `recently-listed`, `name`, `price-asc` e `price-desc`.

Exemplo: `GET /api/nfts?network=ethereum&sort=price-asc&page=1`.

## Favoritos — privado

| Método e caminho        | Resultado               |
| ----------------------- | ----------------------- |
| `GET /favorites`        | Lista os NFTs favoritos |
| `PUT /favorites/:id`    | Adiciona o favorito     |
| `DELETE /favorites/:id` | Remove o favorito       |

## Carrinho e cotação — privado

| Método e caminho                       | Entrada                          | Resposta            |
| -------------------------------------- | -------------------------------- | ------------------- |
| `GET /cart`                            | —                                | Carrinho            |
| `POST /cart/items`                     | `nftId`, `editionId`, `quantity` | Carrinho atualizado |
| `PUT /cart/items/:nftId/:editionId`    | `quantity`                       | Carrinho atualizado |
| `DELETE /cart/items/:nftId/:editionId` | —                                | Carrinho atualizado |
| `PUT /cart/coupon`                     | `code` ou `null`                 | Carrinho atualizado |
| `GET /cart/quote`                      | —                                | Cotação             |

Adicionar soma à quantidade existente. Alterar define a quantidade final. Estoque insuficiente retorna 409.

A cotação contém `id`, `version`, `expiresAt`, `valid`, `networks`, `coupon`, `subtotalEth`, `discountEth`, `networkFeeEth` e `totalEth`. Ela vale 60 segundos na simulação. A compra deve usar a cotação revisada pelo usuário.

Exemplo para aplicar cupom:

```json
{ "code": "KURIO10" }
```

Envie `null` para remover. Cupom inválido ou expirado retorna 422.

## Pedidos — privado

| Método e caminho           | Entrada             | Resposta                    |
| -------------------------- | ------------------- | --------------------------- |
| `POST /orders`             | Tentativa de compra | Pedido                      |
| `GET /orders`              | —                   | Pedidos do usuário          |
| `GET /orders/:id`          | ID                  | Pedido e snapshot do recibo |
| `GET /orders/attempt/:key` | Chave da tentativa  | Mesmo pedido criado         |

A tentativa contém `idempotencyKey`, `quoteId`, `collector` (`email`, `note`) e `wallets` (carteiras selecionadas). Envie também o header `Idempotency-Key` com a mesma chave.

### Idempotência, de forma simples

- Cada tentativa tem uma chave única.
- Reenviar a mesma compra com a mesma chave recupera o mesmo pedido.
- Após timeout, consulte a tentativa antes de iniciar outra compra.
- Reutilizar a chave com dados diferentes retorna 409.

O pedido contém `id`, `version`, `idempotencyKey`, `status`, `createdAt`, `snapshot` e, quando disponível, `transactionReference`. O snapshot guarda colecionador, carteiras, itens e cotação usados na compra.

Estados: `pending` (aguardando), `confirmed` (confirmado) e `declined` (recusado). Confirmado e recusado são finais.

## Perfil — privado

| Método e caminho        | Entrada                                                | Resposta               |
| ----------------------- | ------------------------------------------------------ | ---------------------- |
| `GET /profile`          | —                                                      | Perfil                 |
| `PATCH /profile`        | `displayName`, `username`, `email`, `ensName` opcional | Perfil atualizado      |
| `PUT /profile/password` | `currentPassword`, `newPassword`, `confirmPassword`    | Resultado da alteração |

Os contratos atuais não incluem upload de avatar. Não há endpoint de avatar implementado nessa interface.

## Carteiras — privado

| Método e caminho           | Entrada                                               | Resposta                |
| -------------------------- | ----------------------------------------------------- | ----------------------- |
| `GET /wallets`             | —                                                     | Carteiras               |
| `POST /wallets`            | Dados da carteira                                     | Carteira criada         |
| `PATCH /wallets/:id`       | Dados da carteira                                     | Carteira atualizada     |
| `DELETE /wallets/:id`      | ID                                                    | Resultado da remoção    |
| `POST /wallets/connect`    | `walletId`, `application`, `temporaryWallet` opcional | `walletId`, `connected` |
| `POST /wallets/disconnect` | `walletId`                                            | `walletId`, `connected` |

Dados: `alias`, `network`, `address`, `kind`, `isPrimary` e `ensName` opcional. Redes: `ethereum`, `polygon`, `solana`, `robinhood`. Tipos: `extension`, `hardware`, `custodial`. A conexão é simulada.

## Erros

| HTTP | Significado                                           |
| ---- | ----------------------------------------------------- |
| 400  | Entrada inválida                                      |
| 401  | Sessão ausente, inválida ou expirada                  |
| 403  | Operação sem permissão, quando aplicável              |
| 404  | Recurso inexistente ou não acessível                  |
| 409  | Conflito de cadastro, disponibilidade ou idempotência |
| 422  | Validação de negócio, como cupom ou senha atual       |
| 5xx  | Falha do serviço                                      |

O formato não é uniforme entre os recursos: o catálogo usa `code` e `message`; outros handlers retornam `message` e, em alguns casos, `field`. Timeouts e falhas de conexão podem ocorrer sem resposta HTTP.
