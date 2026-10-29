# Casos de teste — pesquisa global

Executar com mocks habilitados, nos tamanhos 390, 768 e 1440 px.

| Caso           | Passos                                                                    | Resultado esperado                                            |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Busca global   | Aplicar filtros restritivos e buscar NFT de outra coleção                 | Sugestões incluem o NFT independentemente dos filtros         |
| Debounce       | Digitar rapidamente e aguardar 300 ms                                     | Consulta do termo final; nenhuma alteração no catálogo        |
| Seleção        | Clicar em sugestão; repetir com setas e Enter                             | Detalhe correto, painel fechado                               |
| Envio          | Digitar e pressionar Enter sem usar setas, inclusive durante carregamento | Catálogo recebe o texto atual                                 |
| Filtros        | Enviar no catálogo na página 2 com filtros e ordenação                    | Preserva filtros e ordenação; página 1                        |
| Outra rota     | Abrir pesquisa fora do catálogo e enviar                                  | Navega ao catálogo com filtros padrão                         |
| Vazio          | Enviar apenas espaços                                                     | Remove q; preserva outros filtros no catálogo                 |
| Limite         | Colar mais de 200 caracteres                                              | Input limitado a 200 caracteres                               |
| Sem resultados | Buscar termo inexistente                                                  | Mensagem de vazio; envio continua disponível                  |
| Lentidão       | Ativar cenário slow e pesquisar                                           | Feedback de carregamento, sem sugestões antigas selecionáveis |
| Ordem          | Ativar out-of-order e trocar rapidamente o termo                          | Somente resultados do termo atual aparecem                    |
| Erro           | Ativar transient-error; pesquisar e tentar novamente                      | Erro acessível e recuperação; envio ao catálogo disponível    |
| Eventos        | Atualizar NFT e reconectar socket com pesquisa aberta                     | REST reconcilia sugestões ativas                              |
| Histórico      | Enviar termos diferentes; voltar, avançar e atualizar                     | URL e catálogo restaurados; abertura usa q atual              |
| Foco           | Abrir e fechar com Escape, clique externo e botão fechar                  | Foco no input ao abrir e no acionador ao dispensar            |
| Mobile         | Abrir pelo campo do catálogo e acionador das demais telas                 | Diálogo acessível, foco contido e sem overflow                |
| Acessibilidade | Usar teclado, leitor de tela, zoom e movimento reduzido                   | Labels, estados e foco legíveis; animação reduzida            |

Verificar também acesso direto e refresh do detalhe selecionado, inclusive NFT esgotado.
