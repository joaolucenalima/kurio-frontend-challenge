# Casos de testes de checkout

Automação futura; Playwright não instalado nesta etapa. Usar mocks MSW e estado isolado por caso.

| Caso                  | Preparação e passos                                                               | Resultado esperado                                                             |
| --------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Confirmação com cupom | Aplicar KURIO10, confirmar compra e recarregar                                    | Carrinho sem cupom; recibo preserva desconto e valores                         |
| Uso único             | Tentar aplicar novamente com o mesmo usuário, incluindo espaços e caixa diferente | API rejeita o código utilizado                                                 |
| Isolamento            | Entrar com outro usuário e aplicar o mesmo código                                 | Cupom disponível independentemente do primeiro usuário                         |
| Reserva               | Manter pedido pendente e iniciar outra tentativa com o código                     | Segundo pedido bloqueado; mesma chave recupera o original                      |
| Recusa                | Recusar pagamento e tentar novamente                                              | Itens e cupom preservados; reserva liberada                                    |
| Timeout               | Ativar timeout-after-create e recuperar tentativa após refresh                    | Mesmo pedido, sem duplicar consumo                                             |
| Cotação antiga        | Enviar cotação anterior após consumo do cupom                                     | API impede nova compra                                                         |
| Liquidação repetida   | Consultar repetidamente pedido confirmado                                         | Não remove itens ou quantidades novamente                                      |
| Validação             | Aplicar código inválido, EXPIRED e remover código válido                          | Erros legíveis; remoção funciona                                               |
| Modal pendente        | Criar pedido payment-pending; clicar fora e pressionar Escape                     | Modal permanece aberto, sem botão de fechar e sem mensagem de sucesso          |
| Modal terminal        | Confirmar ou recusar; clicar fora, fechar explicitamente e reabrir                | Clique fora bloqueado; fechamento e reabertura disponíveis                     |
| Refresh               | Recarregar durante processamento                                                  | Mesmo pedido recuperado e modal reaberto                                       |
| Sessão                | Trocar usuário durante processamento                                              | Sem exposição ou atualização do pedido anterior                                |
| Reset                 | Resetar mocks após cupom consumido                                                | Elegibilidade restaurada                                                       |
| Formulários           | Preencher pagamento e abrir revisão                                               | Etapas anteriores ao envio preservadas                                         |
| Acessibilidade        | Usar teclado e viewports 390, 768 e 1440 px                                       | Foco contido e restaurado, estados anunciados, conteúdo acessível sem overflow |
